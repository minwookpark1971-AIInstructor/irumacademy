/**
 * Content — 메인 전역 콘텐츠(site_content / site_settings) 조회 → 섹션 렌더
 *
 *   home.hero         {title, subtitle}                      히어로 카피(줄바꿈 \n = 줄 구분)
 *   home.hero_meta    {cta1{label,href}, cta2{label,href}}   히어로 버튼
 *   home.hero_images  {items:[{src, alt?}]}  1~5장           히어로 배경 사진 크로스페이드
 *   home.clients      {items:[{name, src?, href?}]}          신뢰 로고 마키 (없으면 섹션 숨김)
 *   home.cases        {more_href?, items:[{title, image?, tags?[], href?}]}  출강 사례 캐러셀
 *   home.areas        {items:[{name, desc, audience?, courses?[], output?, images?[{src,alt?}]}]}  강의영역 탭(없으면 HTML 폴백 유지)
 *   home.metrics      {items:[{n, label}]}                   숫자 카운트업
 *   home.insights     {more_href?, items:[{title, tag?, image?, href}]}      인사이트 롤링
 *   home.cta          {title, body?, primary{label,href}, secondary{label,href}}
 *   home.instructor / home.faq                               값이 있을 때만 표시
 *   site_settings.footer  {kakao_url?, sns?[{label,href}]}   FAB·푸터
 *
 * 실패하면 index.html 의 폴백 문구가 그대로 남는다. 값은 textContent·DOM 노드로만 넣고,
 * 링크는 상대경로·http(s), 이미지는 상대경로·https 만 허용한다. 마지막 성공 응답은 localStorage 에 24h 캐시(SWR).
 */
(function () {
    'use strict';

    var P = window.IRUM_PROGRAMS;
    if (!P) return;
    var cfg = window.IRUM_CONFIG || {};
    var $ = function (sel, root) { return (root || document).querySelector(sel); };
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
    var isStr = P.isStr, el = P.el;
    var KEYS = ['home.hero', 'home.hero_meta', 'home.hero_images', 'home.clients', 'home.cases', 'home.areas', 'home.metrics',
        'home.insights', 'home.cta', 'home.instructor', 'home.faq'];
    var CACHE_KEY = 'irum:content:v1', CACHE_TTL = 24 * 60 * 60 * 1000;

    function items(v, max) { return v && Array.isArray(v.items) ? v.items.filter(function (x) { return x && typeof x === 'object'; }).slice(0, max) : []; }
    function external(h) { return /^https?:\/\//i.test(h || ''); }
    function setLink(a, link) {
        if (!a || !link || !isStr(link.label)) return;
        var href = P.safeHref(link.href);
        if (!href) return;
        // 버튼 안의 화살표(.arr) 는 유지한다
        a.textContent = link.label + ' ';
        var arr = el('span', 'arr', '→'); arr.setAttribute('aria-hidden', 'true'); a.appendChild(arr);
        a.href = href;
        if (external(link.href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    }
    function section(id, show) { var s = document.getElementById(id); if (s) s.hidden = !show; return s; }
    function linkWrap(href, cls, child) {
        var h = P.safeHref(href);
        if (!h) { var d = el('div', cls); d.appendChild(child); return d; }
        var a = el('a', cls); a.href = h; a.appendChild(child);
        if (external(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        return a;
    }

    // ── 히어로 ──────────────────────────────────────────────
    function applyHero(c) {
        try {
            var h = c['home.hero'];
            var title = $('#hero-title'), sub = $('#hero-sub');
            function lines(box, text, startI) {
                var parts = String(text).split('\n').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 3);
                var cur = $$('.hl', box).map(function (n) { return n.textContent; }).join('|');
                if (cur === parts.join('|')) return; // 같은 문구면 건드리지 않음(등장 애니메이션 재시작 방지)
                box.textContent = '';
                parts.forEach(function (t, i) {
                    var s = el('span', 'hl', t); s.style.setProperty('--i', startI + i);
                    box.appendChild(s); box.appendChild(document.createTextNode(' '));
                });
            }
            if (h && title && isStr(h.title)) lines(title, h.title, 0);
            if (h && sub && isStr(h.subtitle)) lines(sub, h.subtitle, 2);
        } catch (e) { /* 폴백 유지 */ }
        try {
            var m = c['home.hero_meta'];
            if (m) { setLink($('#hero-cta1'), m.cta1); setLink($('#hero-cta2'), m.cta2); }
        } catch (e) { /* 폴백 유지 */ }
        try {
            var imgs = items(c['home.hero_images'], 5).filter(function (x) { return P.safeSrc(x.src); });
            var bg = $('#hero-bg');
            if (bg && imgs.length) {
                var key = imgs.map(function (x) { return x.src; }).join('|');
                if (bg.getAttribute('data-key') !== key) {
                    bg.setAttribute('data-key', key);
                    bg.textContent = '';
                    imgs.forEach(function (x, i) {
                        var s = el('div', 'hero-slide');
                        var im = el('img');
                        im.src = P.safeSrc(x.src); im.alt = ''; im.decoding = 'async';
                        im.loading = i === 0 ? 'eager' : 'lazy';
                        if (i === 0) im.setAttribute('fetchpriority', 'high');
                        s.appendChild(im); bg.appendChild(s);
                    });
                    if (window.IRUM_MOTION) window.IRUM_MOTION.heroStart();
                }
            }
        } catch (e) { /* 폴백 유지 */ }
    }

    // ── 신뢰 로고 ───────────────────────────────────────────
    function applyClients(c) {
        var list = items(c['home.clients'], 30).filter(function (x) { return isStr(x.name); });
        var sec = $('#clients'), track = $('#clients-track');
        if (!sec || !track) return;
        if (!list.length) { sec.hidden = true; return; }
        track.textContent = '';
        list.forEach(function (x) {
            var li = el('li', 'client');
            var inner;
            var src = P.safeSrc(x.src);
            if (src) { inner = el('img'); inner.src = src; inner.alt = x.name; inner.height = 36; inner.loading = 'lazy'; inner.decoding = 'async'; }
            else inner = el('span', 'client-name', x.name);
            var h = P.safeHref(x.href);
            if (h) { var a = el('a'); a.href = h; a.setAttribute('aria-label', x.name); if (external(x.href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } a.appendChild(inner); li.appendChild(a); }
            else li.appendChild(inner);
            track.appendChild(li);
        });
        sec.hidden = false;
        if (window.IRUM_MOTION) window.IRUM_MOTION.marquee($('#clients-mq'), true);
    }

    // ── 사례 · 인사이트 카드 ────────────────────────────────
    function cardThumb(image, fallbackText) {
        var t = el('div', 'mc-thumb');
        var src = P.safeSrc(image);
        if (src) { var im = el('img'); im.src = src; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.width = 720; im.height = 540; t.appendChild(im); }
        else t.appendChild(el('span', 'mc-ph', fallbackText));
        return t;
    }
    function applyCases(c) {
        var v = c['home.cases'];
        var list = items(v, 12).filter(function (x) { return isStr(x.title); });
        var sec = $('#cases'), track = $('#cases-track');
        if (!sec || !track) return;
        if (!list.length) { sec.hidden = true; return; }
        track.textContent = '';
        list.forEach(function (x) {
            var li = el('li');
            var body = document.createDocumentFragment();
            var wrap = el('div', 'mc-body');
            wrap.appendChild(cardThumb(x.image, Array.isArray(x.tags) && isStr(x.tags[0]) ? x.tags[0] : x.title));
            var tags = (Array.isArray(x.tags) ? x.tags.filter(isStr) : []).slice(0, 2);
            if (tags.length) { var tg = el('div', 'mc-tags'); tags.forEach(function (t) { tg.appendChild(el('span', 'mc-tag', t)); }); wrap.appendChild(tg); }
            wrap.appendChild(el('h3', 'mc-title', x.title));
            if (P.safeHref(x.href)) wrap.appendChild(el('span', 'mc-link', '자세히 보기 →'));
            body.appendChild(wrap);
            var card = P.safeHref(x.href) ? el('a', 'mc-card') : el('div', 'mc-card');
            if (card.tagName === 'A') { card.href = P.safeHref(x.href); if (external(x.href)) { card.target = '_blank'; card.rel = 'noopener noreferrer'; } }
            card.appendChild(body);
            li.appendChild(card); track.appendChild(li);
        });
        var more = $('#cases-more');
        if (more) { var mh = P.safeHref(v && v.more_href); if (mh) { more.href = mh; more.hidden = false; } else more.hidden = true; }
        sec.hidden = false;
        if (window.IRUM_MOTION) { window.IRUM_MOTION.marquee($('#cases-mq'), true); window.IRUM_MOTION.scan(sec); }
    }
    function applyInsights(c) {
        var v = c['home.insights'];
        var list = items(v, 12).filter(function (x) { return isStr(x.title) && P.safeHref(x.href); });
        var sec = $('#insight'), track = $('#insight-track');
        if (!sec || !track) return;
        if (!list.length) { sec.hidden = true; return; }
        track.textContent = '';
        list.forEach(function (x) {
            var li = el('li');
            var card = el('a', 'mc-card'); card.setAttribute('data-insight', '');
            card.href = P.safeHref(x.href);
            if (external(x.href)) { card.target = '_blank'; card.rel = 'noopener noreferrer'; }
            card.appendChild(cardThumb(x.image, x.title));
            if (isStr(x.tag)) { var tg = el('div', 'mc-tags'); tg.appendChild(el('span', 'mc-tag', x.tag)); card.appendChild(tg); }
            card.appendChild(el('h3', 'mc-title', x.title));
            li.appendChild(card); track.appendChild(li);
        });
        var more = $('#insight-more');
        if (more) { var mh = P.safeHref(v && v.more_href); if (mh) { more.href = mh; more.hidden = false; } else more.hidden = true; }
        sec.hidden = false;
        if (window.IRUM_MOTION) { window.IRUM_MOTION.marquee($('#insight-mq'), true); window.IRUM_MOTION.scan(sec); }
    }

    // ── 강의영역 탭 ─────────────────────────────────────────
    function applyAreas(c) {
        var list = items(c['home.areas'], 6).filter(function (x) { return isStr(x.name); });
        var tabs = $('#area-tabs'), panels = $('#area-panels');
        if (!tabs || !panels || !list.length) return; // 값이 없으면 index.html 의 폴백 6개 유지
        var key = JSON.stringify(list);
        if (tabs.getAttribute('data-key') === key) return;
        tabs.setAttribute('data-key', key);
        tabs.textContent = ''; panels.textContent = '';
        list.forEach(function (x, i) {
            var n = i + 1, id = 'a' + n;
            var b = el('button'); b.type = 'button'; b.id = 'tab-' + id; b.setAttribute('role', 'tab');
            b.setAttribute('aria-controls', 'panel-' + id); b.setAttribute('aria-selected', String(i === 0)); b.tabIndex = i === 0 ? 0 : -1;
            b.appendChild(el('i', null, (n < 10 ? '0' : '') + n)); b.appendChild(document.createTextNode(x.name));
            tabs.appendChild(b);

            var p = el('section', 'area-panel'); p.id = 'panel-' + id; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', 'tab-' + id);
            if (i !== 0) p.hidden = true;
            if (isStr(x.desc)) p.appendChild(el('p', 'area-desc', x.desc));
            var courses = (Array.isArray(x.courses) ? x.courses.filter(isStr) : []).slice(0, 3);
            var imgs = Array.isArray(x.images) ? x.images : [];
            if (courses.length || imgs.length) {
                var tiles = el('div', 'area-tiles');
                var cnt = Math.max(courses.length, Math.min(imgs.length, 3));
                for (var k = 0; k < cnt; k++) {
                    var t = el('div', 'area-tile');
                    var src = imgs[k] && P.safeSrc(imgs[k].src);
                    if (src) { t.classList.add('has-img'); var im = el('img'); im.src = src; im.alt = (imgs[k] && isStr(imgs[k].alt)) ? imgs[k].alt : ''; im.loading = 'lazy'; im.decoding = 'async'; t.appendChild(im); }
                    t.appendChild(el('i', null, String(k + 1)));
                    if (courses[k]) t.appendChild(el('b', null, courses[k]));
                    tiles.appendChild(t);
                }
                p.appendChild(tiles);
            }
            var rows = [['주 대상', x.audience], ['산출물', x.output]].filter(function (r) { return isStr(r[1]); });
            if (rows.length) {
                var dl = el('dl', 'area-meta');
                rows.forEach(function (r) { var d = el('div'); d.appendChild(el('dt', null, r[0])); d.appendChild(el('dd', null, r[1])); dl.appendChild(d); });
                p.appendChild(dl);
            }
            panels.appendChild(p);
        });
    }
    function initAreaTabs() {
        var tabs = $('#area-tabs');
        if (!tabs || tabs.__bound) return;
        tabs.__bound = true;
        function select(btn, focus) {
            $$('[role="tab"]', tabs).forEach(function (t) {
                var on = t === btn;
                t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
                var pn = document.getElementById(t.getAttribute('aria-controls'));
                if (pn) pn.hidden = !on;
            });
            if (focus) btn.focus();
        }
        tabs.addEventListener('click', function (e) { var b = e.target.closest('[role="tab"]'); if (b) select(b); });
        tabs.addEventListener('keydown', function (e) {
            var all = $$('[role="tab"]', tabs), i = all.indexOf(document.activeElement);
            if (i < 0) return;
            var to = null;
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') to = all[(i + 1) % all.length];
            else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') to = all[(i - 1 + all.length) % all.length];
            else if (e.key === 'Home') to = all[0];
            else if (e.key === 'End') to = all[all.length - 1];
            if (to) { e.preventDefault(); select(to, true); }
        });
    }

    // ── 숫자 ────────────────────────────────────────────────
    function applyMetrics(c) {
        var list = items(c['home.metrics'], 4).filter(function (x) { return isStr(x.n) && isStr(x.label); });
        var sec = $('#stats'), grid = $('#stats-grid');
        if (!sec || !grid) return;
        if (!list.length) { sec.hidden = true; return; }
        grid.textContent = '';
        grid.classList.remove('is-in');
        list.forEach(function (x) {
            var d = el('div', 'stat');
            var n = el('div', 'n', x.n);
            var m = /^([^0-9]*)([0-9][0-9,]*(?:\.[0-9]+)?)(.*)$/.exec(x.n);
            if (m) {
                var num = parseFloat(m[2].replace(/,/g, ''));
                n.setAttribute('data-countup', ''); n.setAttribute('data-to', String(num));
                n.setAttribute('data-dec', m[2].indexOf('.') > -1 ? String(m[2].split('.')[1].length) : '0');
                n.setAttribute('data-prefix', m[1]); n.setAttribute('data-suffix', m[3]);
            }
            d.appendChild(n); d.appendChild(el('div', 'l', x.label));
            grid.appendChild(d);
        });
        sec.hidden = false;
        grid.__mw = false;
        if (window.IRUM_MOTION) window.IRUM_MOTION.scan(sec);
    }

    // ── CTA · 강사 · FAQ ────────────────────────────────────
    function applyCta(c) {
        var v = c['home.cta'];
        if (!v) return;
        if (isStr(v.title)) $('#cta-title').textContent = v.title;
        if (isStr(v.body)) $('#cta-body').textContent = v.body;
        setLink($('#cta-primary'), v.primary);
        setLink($('#cta-secondary'), v.secondary);
    }
    function applyInstructor(c) {
        try {
            var v = c['home.instructor'], sec = $('#instructor');
            if (!sec || !v || !isStr(v.name)) return;
            var card = $('.inst-card', sec);
            $('h3', card).textContent = v.name;
            $('.inst-role', card).textContent = isStr(v.role) ? v.role : '';
            var ul = $('.inst-bio', card); ul.textContent = '';
            (Array.isArray(v.bio) ? v.bio.filter(isStr) : []).forEach(function (b) { var li = document.createElement('li'); li.textContent = b; ul.appendChild(li); });
            sec.hidden = false;
        } catch (e) { /* 이 구역만 숨김 유지 */ }
    }
    function applyFaq(c) {
        try {
            var faq = c['home.faq'], fs = $('#faq');
            var qa = Array.isArray(faq) ? faq.filter(function (x) { return x && isStr(x.q) && isStr(x.a); }) : [];
            if (!fs || !qa.length) return;
            var box = $('.faq-list', fs); box.textContent = '';
            qa.forEach(function (it) {
                var d = el('details', 'faq-item'); d.appendChild(el('summary', null, it.q)); d.appendChild(el('p', null, it.a)); box.appendChild(d);
            });
            fs.hidden = false;
        } catch (e) { /* 폴백 */ }
    }

    // ── FAB · 푸터 ──────────────────────────────────────────
    function applyFooter(f) {
        if (!f || typeof f !== 'object') return;
        try {
            var btn = $('#fab-btn');
            if (btn && /^https:\/\//i.test(f.kakao_url || '')) {
                btn.href = f.kakao_url; btn.target = '_blank'; btn.rel = 'noopener noreferrer'; btn.textContent = '카카오 상담 ›';
            }
            var sns = $('#footer-sns');
            if (sns && Array.isArray(f.sns)) {
                sns.textContent = '';
                f.sns.slice(0, 6).forEach(function (s) {
                    if (!s || !isStr(s.label) || !/^https:\/\//i.test(s.href || '')) return;
                    var a = el('a', null, s.label); a.href = s.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; sns.appendChild(a);
                });
            }
        } catch (e) { /* 무시 */ }
    }

    function applyAll(c, footer) {
        applyHero(c); applyClients(c); applyCases(c); applyAreas(c); applyMetrics(c);
        applyInsights(c); applyCta(c); applyInstructor(c); applyFaq(c); applyFooter(footer);
        if (window.IRUM_MOTION) window.IRUM_MOTION.scan(document);
        if (window.IRUM_refreshNav) window.IRUM_refreshNav();
    }

    window.IRUM_CONTENT = { apply: applyAll }; // 점검·미리보기용: IRUM_CONTENT.apply({키: 값}, 푸터설정)

    // ── 조회(SWR) ───────────────────────────────────────────
    function readCache() {
        try {
            var o = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
            return (o && o.c && Date.now() - o.t < CACHE_TTL) ? o : null;
        } catch (e) { return null; }
    }
    function writeCache(c, f) { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), c: c, f: f })); } catch (e) { /* 무시 */ } }
    function get(path) {
        var ctrl = window.AbortController ? new AbortController() : null;
        var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 4500);
        return fetch(cfg.supabaseUrl + '/rest/v1/' + path, { headers: { apikey: cfg.supabaseAnonKey }, signal: ctrl ? ctrl.signal : undefined })
            .then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error('http ' + r.status); return r.json(); }, function (e) { clearTimeout(timer); throw e; });
    }

    function boot() {
        initAreaTabs();
        if (window.IRUM_MOTION) window.IRUM_MOTION.scan(document);
        if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.fetch) return;
        var cached = readCache(), cachedKey = null;
        if (cached) { cachedKey = JSON.stringify([cached.c, cached.f]); applyAll(cached.c, cached.f); }
        Promise.all([
            get('site_content?key=in.(' + KEYS.join(',') + ')&select=key,value'),
            get('site_settings?key=eq.footer&select=key,value')
        ]).then(function (res) {
            if (!Array.isArray(res[0])) return;
            var c = {}; res[0].forEach(function (r) { c[r.key] = r.value; });
            var f = Array.isArray(res[1]) && res[1][0] ? res[1][0].value : null;
            writeCache(c, f);
            if (JSON.stringify([c, f]) !== cachedKey) applyAll(c, f);
        }).catch(function () { /* 폴백(HTML 문구) 유지 */ });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
