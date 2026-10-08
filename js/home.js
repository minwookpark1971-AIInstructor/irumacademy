/**
 * Home — 메인 프론트페이지 콘텐츠 렌더러 + 커버 슬라이더
 *
 * site_content 의 home.* 키를 한 번의 요청으로 읽어 화면을 덮어쓴다.
 * 실패·타임아웃·빈 값·모양이 다른 값이면 HTML 에 들어 있는 폴백 문구를 그대로 둔다.
 * 공개 키(IRUM_CONFIG)만 사용하며, 값은 textContent/DOM 노드로만 넣는다(HTML 삽입 없음).
 *
 * 키(모두 선택):
 *   home.hero      {title, subtitle}                         커버 1장 제목·부제
 *   home.hero_meta {tags[], cta1{label,href}, cta2{...}}     커버 1장 태그·버튼
 *   home.slides    [{label,title,desc,image,alt,href,cta}]   커버 슬라이더
 *   home.highlights[문장 5개]                                이번 기수 핵심 5
 *   home.cards     [{code,name,status,tone,tagline,desc,sessions,fee,output,href,cta}]
 *   home.timeline  {title, weeks[{no,date,title,body,milestone,track}]}
 *   home.outcomes  {title, items[{title,body}]}
 *   home.system    {title, rows[{k,v}]}
 *   home.instructor{name, role, bio[]}  /  home.metrics{items[{n,label}]}   (없으면 섹션 숨김)
 *   home.enrollment{schedule, fees[{name,price,note}], account{bank,number,holder}, notice[]}
 *   home.faq       [{q,a}]                                   (없으면 섹션 숨김)
 *   settings.seo   {title, description}  (site_settings 테이블)  탭 제목·description
 */
(function () {
    'use strict';

    // ── 유틸 ────────────────────────────────────────────────
    var isStr = function (x) { return typeof x === 'string' && x.trim() !== ''; };
    var $ = function (sel, root) { return (root || document).querySelector(sel); };
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
    var q = function (n, sel) { return n.querySelector(sel); };

    function setText(el, text) { if (el && isStr(text)) el.textContent = text; }
    function setLines(el, text) {
        if (!el || !isStr(text)) return;
        el.textContent = '';
        text.split('\n').forEach(function (line, i) {
            if (i) el.appendChild(document.createElement('br'));
            el.appendChild(document.createTextNode(line));
        });
    }
    // DB 에는 사이트 루트 기준 상대 경로(html/apply.html)를 저장한다.
    // 스테이징(/v2/)에서도 같은 값이 동작하도록 루트 기준으로 해석한다.
    var ROOT = /\/v2\/[^/]*$/.test(location.pathname) ? '../' : '';
    function rootRel(h) { return (h.charAt(0) === '#' || h.indexOf('../') === 0 || h.charAt(0) === '/') ? h : ROOT + h; }
    /** 상대 경로 또는 http(s) 링크만 허용 (javascript: 등 차단). 실패하면 null */
    function safeHref(h) {
        h = String(h || '').trim();
        if (!h) return null;
        if (/^[a-z][a-z0-9+.-]*:/i.test(h)) return /^https?:/i.test(h) ? h : null;
        return h.indexOf('//') === 0 ? null : rootRel(h);
    }
    /** 이미지: 상대 경로 또는 https 만 허용 */
    function safeSrc(h) {
        h = String(h || '').trim();
        if (!h) return null;
        if (/^[a-z][a-z0-9+.-]*:/i.test(h)) return /^https:/i.test(h) ? h : null;
        return h.indexOf('//') === 0 ? null : rootRel(h);
    }
    function setLink(a, label, href) {
        if (!a) return;
        if (isStr(label)) a.textContent = label;
        var h = safeHref(href);
        if (h) a.setAttribute('href', h);
    }
    /** 컨테이너의 첫 자식을 틀(template)로 삼아 목록 개수만큼 복제해 채운다 */
    function fillList(box, items, fill) {
        if (!box || !Array.isArray(items) || !items.length || !box.firstElementChild) return false;
        var tpl = box.firstElementChild.cloneNode(true);
        var nodes = items.map(function (it, i) { var n = tpl.cloneNode(true); fill(n, it, i); return n; });
        box.textContent = '';
        nodes.forEach(function (n) { box.appendChild(n); });
        return true;
    }
    var pad = function (i) { return (i < 9 ? '0' : '') + (i + 1); };

    // ── 적용기 ──────────────────────────────────────────────
    var heroText = null; // 슬라이드 1장 덮어쓰기용

    function applyHero(v) { if (v) heroText = v; }

    function applyHeroMeta(v) {
        if (!v) return;
        var first = $('.slide');
        if (!first) return;
        var tags = $('.slide-tags', first);
        if (tags && Array.isArray(v.tags) && v.tags.some(isStr)) {
            tags.textContent = '';
            v.tags.filter(isStr).forEach(function (t) {
                var s = document.createElement('span');
                s.className = 'tag tag-on-dark';
                s.textContent = t;
                tags.appendChild(s);
            });
        }
        if (v.cta1) setLink($('[data-role="cta1"]', first), v.cta1.label, v.cta1.href);
        if (v.cta2) setLink($('[data-role="cta2"]', first), v.cta2.label, v.cta2.href);
    }

    function applySlides(list) {
        fillList($('#slides'), list, function (n, s, i) {
            s = s || {};
            setText(q(n, '.slide-label'), s.label);
            setLines(q(n, '.slide-title'), s.title);
            setLines(q(n, '.slide-desc'), s.desc);
            var img = q(n, 'img');
            var src = safeSrc(s.image);
            if (img && src) { img.setAttribute('src', src); }
            if (img) img.setAttribute('alt', isStr(s.alt) ? s.alt : (isStr(s.title) ? s.title.replace(/\n/g, ' ') : ''));
            if (img) img.setAttribute('loading', i === 0 ? 'eager' : 'lazy');
            var cta = q(n, '[data-role="cta1"]');
            if (cta && (s.href || s.cta)) setLink(cta, s.cta, s.href);
            var tags = q(n, '.slide-tags'); if (tags && i > 0) tags.textContent = '';
            var cta2 = q(n, '[data-role="cta2"]'); if (cta2 && i > 0) cta2.hidden = true;
            n.classList.remove('is-active');
        });
    }

    function applyHeroOverlay() {
        if (!heroText) return;
        var first = $('.slide');
        if (!first) return;
        setLines($('.slide-title', first), heroText.title);
        setLines($('.slide-desc', first), heroText.subtitle);
    }

    function applyHighlights(list) {
        if (!Array.isArray(list)) return;
        var items = list.filter(isStr);
        fillList($('#highlights-list'), items, function (n, t) { n.textContent = t; });
    }

    function applyCards(list) {
        fillList($('[data-home="cards"]'), list, function (n, c) {
            c = c || {};
            if (isStr(c.code)) { n.setAttribute('data-code', c.code.toUpperCase().slice(0, 1)); setText(q(n, '.tc-code'), c.code.toUpperCase().slice(0, 1)); }
            var badge = q(n, '.tc-badge');
            if (badge) { setText(badge, c.status); if (isStr(c.tone)) badge.setAttribute('data-tone', c.tone); }
            setText(q(n, '.tc-name'), c.name);
            setText(q(n, '.tc-tagline'), c.tagline);
            setText(q(n, '.tc-desc'), c.desc);
            setText(q(n, '[data-f="sessions"]'), c.sessions);
            setText(q(n, '[data-f="fee"]'), c.fee);
            setText(q(n, '[data-f="output"]'), c.output);
            setLink(q(n, 'a.btn'), c.cta, c.href);
        });
    }

    function applyTimeline(v) {
        if (!v) return;
        setText($('[data-home="timeline.title"]'), v.title);
        fillList($('[data-home="timeline.weeks"]'), v.weeks, function (n, w) {
            w = w || {};
            var track = isStr(w.track) ? w.track.toUpperCase().slice(0, 1) : (isStr(w.no) ? w.no.trim().slice(0, 1).toUpperCase() : '');
            n.setAttribute('data-track', track);
            n.classList.toggle('is-ms', w.milestone === true);
            setText(q(n, '.c-no'), w.no);
            setText(q(n, '.c-date'), w.date);
            setText(q(n, '.c-title'), w.title);
            setText(q(n, '.c-track'), w.body);
        });
    }

    function applyOutcomes(v) {
        if (!v) return;
        setText($('[data-home="outcomes.title"]'), v.title);
        fillList($('[data-home="outcomes.items"]'), v.items, function (n, it, i) {
            it = it || {};
            setText(q(n, '.num'), pad(i));
            setText(q(n, 'h3'), it.title);
            setText(q(n, 'p'), it.body);
        });
    }

    function applySystem(v) {
        if (!v) return;
        setText($('[data-home="system.title"]'), v.title);
        fillList($('[data-home="system.rows"]'), v.rows, function (n, r) {
            r = r || {};
            setText(q(n, 'th'), r.k);
            setText(q(n, 'td'), r.v);
        });
    }

    function applyInstructor(v, metrics) {
        var sec = $('#instructor');
        if (!sec) return;
        var hasInst = v && isStr(v.name);
        var items = metrics && Array.isArray(metrics.items) ? metrics.items.filter(function (m) { return m && isStr(m.n) && isStr(m.label); }) : [];
        if (!hasInst && !items.length) return; // 값이 없으면 숨김 유지
        var card = $('.inst-card', sec), mg = $('.metric-grid', sec);
        if (hasInst && card) {
            setText($('h3', card), v.name);
            setText($('.inst-role', card), v.role);
            var ul = $('.inst-bio', card);
            if (ul && Array.isArray(v.bio) && v.bio.some(isStr)) {
                ul.textContent = '';
                v.bio.filter(isStr).forEach(function (b) { var li = document.createElement('li'); li.textContent = b; ul.appendChild(li); });
            }
            card.hidden = false;
        } else if (card) { card.hidden = true; }
        if (items.length && mg) {
            mg.textContent = '';
            items.slice(0, 4).forEach(function (m) {
                var d = document.createElement('div'); d.className = 'metric';
                var n = document.createElement('div'); n.className = 'n'; n.textContent = m.n;
                var l = document.createElement('div'); l.className = 'l'; l.textContent = m.label;
                d.appendChild(n); d.appendChild(l); mg.appendChild(d);
            });
            mg.hidden = false;
        } else if (mg) { mg.hidden = true; }
        sec.hidden = false;
    }

    function applyEnrollment(v) {
        if (!v) return;
        setText($('[data-home="enroll.schedule"]'), v.schedule);
        fillList($('[data-home="enroll.fees"]'), v.fees, function (n, f) {
            f = f || {};
            setText(q(n, '.fee-name'), f.name);
            setText(q(n, '.fee-price'), f.price);
            var note = q(n, '.fee-note'); if (note) { note.textContent = isStr(f.note) ? f.note : ''; }
        });
        if (v.account) {
            setText($('[data-home="pay.bank"]'), v.account.bank);
            setText($('#pay-number'), v.account.number);
            setText($('[data-home="pay.holder"]'), v.account.holder ? '예금주 ' + v.account.holder : null);
        }
        fillList($('[data-home="pay.notice"]'), Array.isArray(v.notice) ? v.notice.filter(isStr) : null, function (n, t) { n.textContent = t; });
    }

    function applyFaq(list) {
        var sec = $('#faq');
        if (!sec || !Array.isArray(list)) return;
        var items = list.filter(function (x) { return x && isStr(x.q) && isStr(x.a); });
        if (!items.length) return;
        var box = $('.faq-list', sec);
        if (!box) return;
        box.textContent = '';
        items.forEach(function (it, i) {
            var d = document.createElement('details'); d.className = 'faq-item';
            var s = document.createElement('summary'); s.textContent = it.q;
            var p = document.createElement('p'); p.textContent = it.a;
            d.appendChild(s); d.appendChild(p); box.appendChild(d);
        });
        sec.hidden = false;
    }


    /** settings.seo — 브라우저 탭 제목·description 보정(크롤러는 JS 를 실행하지 않으므로 OG 는 정적 HTML 이 담당) */
    function applySeo(v) {
        if (!v) return;
        if (isStr(v.title)) {
            document.title = v.title;
            var ot = $('meta[property="og:title"]'); if (ot) ot.setAttribute('content', v.title);
        }
        if (isStr(v.description)) {
            var d = $('meta[name="description"]'); if (d) d.setAttribute('content', v.description);
            var od = $('meta[property="og:description"]'); if (od) od.setAttribute('content', v.description);
        }
    }

    // ── 섹션 번호 · 「다음 →」 · 메뉴 갱신 ─────────────────────
    function renumber() {
        var secs = $$('[data-sec]').filter(function (s) { return !s.hidden; });
        secs.forEach(function (s, i) {
            var no = $('.sec-no', s);
            if (no) no.textContent = pad(i);
            var next = $('.sec-next', s);
            var target = secs[i + 1];
            if (next) {
                if (target && target.id) { next.hidden = false; next.setAttribute('href', '#' + target.id); }
                else { next.hidden = true; }
            }
        });
        if (window.IRUM_refreshNav) window.IRUM_refreshNav();
    }

    // ── 슬라이더 ────────────────────────────────────────────
    function initSlider() {
        var root = $('#slider');
        if (!root) return;
        var slides = $$('.slide', root);
        if (!slides.length) return;
        var dots = $('.slider-dots', root), count = $('.slider-count', root);
        var cur = 0, timer = null, userPaused = false;
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var pauseBtn = $('[data-act="pause"]', root);

        if (dots) {
            dots.textContent = '';
            slides.forEach(function (_, i) {
                var b = document.createElement('button');
                b.type = 'button'; b.setAttribute('aria-label', (i + 1) + '번 슬라이드');
                b.addEventListener('click', function () { go(i, true); });
                dots.appendChild(b);
            });
        }
        function go(i, byUser) {
            cur = (i + slides.length) % slides.length;
            slides.forEach(function (s, k) {
                s.classList.toggle('is-active', k === cur);
                s.setAttribute('aria-label', (k + 1) + ' / ' + slides.length);
            });
            if (dots) $$('button', dots).forEach(function (b, k) { b.setAttribute('aria-current', String(k === cur)); });
            if (count) count.textContent = pad(cur) + ' / ' + pad(slides.length - 1);
            if (byUser) restart();
        }
        function stop() { if (timer) { clearInterval(timer); timer = null; } }
        function start() { if (reduce || userPaused || timer || slides.length < 2) return; timer = setInterval(function () { go(cur + 1); }, 6500); }
        function restart() { stop(); start(); }
        $('[data-act="prev"]', root).addEventListener('click', function () { go(cur - 1, true); });
        $('[data-act="next"]', root).addEventListener('click', function () { go(cur + 1, true); });
        if (pauseBtn) {
            if (reduce) { pauseBtn.hidden = true; }
            pauseBtn.addEventListener('click', function () {
                userPaused = !userPaused;
                pauseBtn.setAttribute('aria-pressed', String(userPaused));
                pauseBtn.textContent = userPaused ? '▶' : '❚❚';
                pauseBtn.setAttribute('aria-label', userPaused ? '자동 넘김 재생' : '자동 넘김 일시정지');
                userPaused ? stop() : start();
            });
        }
        root.addEventListener('mouseenter', stop);
        root.addEventListener('mouseleave', start);
        root.addEventListener('focusin', stop);
        root.addEventListener('focusout', start);
        root.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowLeft') { go(cur - 1, true); }
            else if (e.key === 'ArrowRight') { go(cur + 1, true); }
        });
        // 스와이프
        var x0 = null;
        root.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') x0 = e.clientX; });
        root.addEventListener('pointerup', function (e) {
            if (x0 === null) return;
            var dx = e.clientX - x0; x0 = null;
            if (Math.abs(dx) > 48) go(cur + (dx < 0 ? 1 : -1), true);
        });
        document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
        go(0);
        start();
    }

    // ── 입금 계좌 복사 ──────────────────────────────────────
    function initCopy() {
        var btn = $('#copy-account'), num = $('#pay-number');
        if (!btn || !num) return;
        btn.addEventListener('click', function () {
            var text = num.textContent.trim();
            function done(ok) {
                btn.textContent = ok ? '복사되었습니다' : '길게 눌러 직접 복사해 주세요';
                setTimeout(function () { btn.textContent = '계좌번호 복사'; }, 2000);
            }
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
            else done(false);
        });
    }

    // ── 부팅 ────────────────────────────────────────────────
    function render(c) {
        // 순서 중요: 슬라이드(틀 복제)가 먼저, 그 위에 1장 제목·태그·버튼을 덮어쓴다
        var steps = [
            ['home.slides', applySlides], ['home.hero', applyHero], ['home.hero_meta', applyHeroMeta],
            ['home.highlights', applyHighlights], ['home.cards', applyCards],
            ['home.timeline', applyTimeline], ['home.outcomes', applyOutcomes], ['home.system', applySystem],
            ['home.enrollment', applyEnrollment], ['home.faq', applyFaq]
        ];
        steps.forEach(function (p) {
            try { if (c[p[0]] !== undefined) p[1](c[p[0]]); } catch (e) { /* 이 구역만 폴백 */ }
        });
        try { applyInstructor(c['home.instructor'], c['home.metrics']); } catch (e) { /* 폴백 */ }
        try { applyHeroOverlay(); } catch (e) { /* 폴백 */ }
    }

    function boot(c, seo) {
        if (c) render(c);
        try { applySeo(seo); } catch (e) { /* 폴백 */ }
        initSlider();
        initCopy();
        renumber();
    }

    // DOM 준비 + 데이터 조회(성공·실패 무관) 둘 다 끝나면 딱 한 번 실행
    var cfg = window.IRUM_CONFIG || {};
    var data = null, seoData = null, fetched = false, domReady = document.readyState !== 'loading', booted = false;
    function tryBoot() {
        if (booted || !fetched || !domReady) return;
        booted = true;
        boot(data, seoData);
    }
    document.addEventListener('DOMContentLoaded', function () { domReady = true; tryBoot(); });

    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.fetch) { fetched = true; tryBoot(); return; }

    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 4000);
    function get(path) {
        return fetch(cfg.supabaseUrl + '/rest/v1/' + path, {
            headers: { apikey: cfg.supabaseAnonKey },
            signal: ctrl ? ctrl.signal : undefined
        }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    }
    Promise.all([
        get('site_content?key=like.home.*&select=key,value'),
        get('site_settings?key=eq.seo&select=value&limit=1')
    ]).then(function (res) {
        if (Array.isArray(res[0])) { data = {}; res[0].forEach(function (r) { data[r.key] = r.value; }); }
        if (Array.isArray(res[1]) && res[1][0]) seoData = res[1][0].value;
    }).then(function () { clearTimeout(timer); fetched = true; tryBoot(); });
})();
