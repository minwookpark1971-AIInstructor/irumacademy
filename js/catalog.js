/**
 * Catalog — 메인 프론트페이지 컨트롤러
 *   · 히어로 슬라이더 = 진행중·모집중 과정(featured)별 슬라이드
 *   · 우측 「지금 진행중」 목록
 *   · 진행중·모집중 과정 카드 + 종류 필터
 *   · 전역 구역(강사·지표·FAQ): site_content 의 home.instructor / home.metrics / home.faq (값 있을 때만 표시)
 *   · 섹션 번호·「다음 장」·GNB 앵커 갱신, 슬라이더(자동·일시정지·키보드·스와이프)
 * 데이터: js/programs.js (window.IRUM_PROGRAMS)
 */
(function () {
    'use strict';

    var P = window.IRUM_PROGRAMS;
    if (!P) return;
    var cfg = window.IRUM_CONFIG || {};
    var $ = function (sel, root) { return (root || document).querySelector(sel); };
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
    var isStr = P.isStr;
    var pad = function (i) { return (i < 9 ? '0' : '') + (i + 1); };

    // ── 슬라이더 ────────────────────────────────────────────
    var sliderCtl = null;
    function initSlider() {
        var root = $('#slider');
        if (!root) return;
        if (sliderCtl) sliderCtl.destroy();
        var slides = $$('.slide', root);
        var ctrlBar = $('.slider-ctrl', root);
        var dots = $('.slider-dots', root), count = $('.slider-count', root), pauseBtn = $('[data-act="pause"]', root);
        if (ctrlBar) ctrlBar.hidden = slides.length < 2;
        if (!slides.length) return;
        var cur = 0, timer = null, userPaused = false;
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var off = [];
        function on(t, ev, fn, opt) { t.addEventListener(ev, fn, opt); off.push(function () { t.removeEventListener(ev, fn, opt); }); }

        if (dots) {
            dots.textContent = '';
            slides.forEach(function (_, i) {
                var b = document.createElement('button');
                b.type = 'button'; b.setAttribute('aria-label', (i + 1) + '번 슬라이드');
                on(b, 'click', function () { go(i, true); });
                dots.appendChild(b);
            });
        }
        function go(i, byUser) {
            cur = (i + slides.length) % slides.length;
            slides.forEach(function (s, k) { s.classList.toggle('is-active', k === cur); });
            if (dots) $$('button', dots).forEach(function (b, k) { b.setAttribute('aria-current', String(k === cur)); });
            if (count) count.textContent = pad(cur) + ' / ' + pad(slides.length - 1);
            if (byUser) { stop(); start(); }
        }
        function stop() { if (timer) { clearInterval(timer); timer = null; } }
        function start() { if (reduce || userPaused || timer || slides.length < 2) return; timer = setInterval(function () { go(cur + 1); }, 6500); }
        on($('[data-act="prev"]', root), 'click', function () { go(cur - 1, true); });
        on($('[data-act="next"]', root), 'click', function () { go(cur + 1, true); });
        if (pauseBtn) {
            pauseBtn.hidden = !!reduce;
            userPaused = false;
            pauseBtn.setAttribute('aria-pressed', 'false'); pauseBtn.textContent = '❚❚'; pauseBtn.setAttribute('aria-label', '자동 넘김 일시정지');
            on(pauseBtn, 'click', function () {
                userPaused = !userPaused;
                pauseBtn.setAttribute('aria-pressed', String(userPaused));
                pauseBtn.textContent = userPaused ? '▶' : '❚❚';
                pauseBtn.setAttribute('aria-label', userPaused ? '자동 넘김 재생' : '자동 넘김 일시정지');
                userPaused ? stop() : start();
            });
        }
        on(root, 'mouseenter', stop); on(root, 'mouseleave', start);
        on(root, 'focusin', stop); on(root, 'focusout', start);
        on(root, 'keydown', function (e) {
            if (e.key === 'ArrowLeft') go(cur - 1, true);
            else if (e.key === 'ArrowRight') go(cur + 1, true);
        });
        var x0 = null;
        on(root, 'pointerdown', function (e) { if (e.pointerType !== 'mouse') x0 = e.clientX; });
        on(root, 'pointerup', function (e) {
            if (x0 === null) return;
            var dx = e.clientX - x0; x0 = null;
            if (Math.abs(dx) > 48) go(cur + (dx < 0 ? 1 : -1), true);
        });
        on(document, 'visibilitychange', function () { document.hidden ? stop() : start(); });
        go(0); start();
        sliderCtl = { destroy: function () { stop(); off.forEach(function (f) { f(); }); } };
    }

    // ── 렌더: 히어로 / 지금 진행중 / 카드 ────────────────────
    var kindFilter = 'all';
    var lastRows = null;

    function renderHero(rows, failed) {
        var box = $('#slides');
        if (!box) return;
        var list = failed ? [] : P.heroList(rows);
        box.textContent = '';
        var cover = $('#top');
        if (!list.length) {
            // 진행중 과정이 없거나 불러오지 못했을 때의 기본 화면
            var s = P.el('article', 'slide is-active');
            var t = P.el('div', 'slide-text');
            t.appendChild(P.el('span', 'slide-label', 'IRUM ACADEMY'));
            var h = P.el('div', 'slide-title', failed ? '과정 정보를 불러오지 못했습니다.' : '다음 과정을 준비하고 있습니다.');
            h.setAttribute('role', 'heading'); h.setAttribute('aria-level', '2');
            t.appendChild(h);
            t.appendChild(P.el('p', 'slide-desc', failed
                ? '잠시 후 새로고침해 주세요. 신청은 아래 버튼으로 바로 하실 수 있습니다.'
                : '새로운 과정이 열리면 이곳에서 가장 먼저 안내해 드립니다.'));
            var act = P.el('div', 'slide-actions');
            var a = failed ? P.el('a', 'btn btn-primary btn-lg', '신청 페이지로 →') : P.el('a', 'btn btn-primary btn-lg', '문의하기 →');
            a.href = failed ? P.ROOT + 'html/apply.html' : 'mailto:irum.ceo@gmail.com';
            act.appendChild(a); t.appendChild(act); s.appendChild(t);
            box.appendChild(s);
            if (cover) cover.setAttribute('data-empty', 'true');
        } else {
            if (cover) cover.removeAttribute('data-empty');
            list.forEach(function (p, i) { box.appendChild(P.slideNode(p, i, list.length)); });
        }
        initSlider();
    }

    function renderNow(rows) {
        var ol = $('#now-list');
        if (!ol) return;
        var list = P.listedRows(rows);
        ol.textContent = '';
        var hl = $('#now-count'); if (hl) hl.textContent = list.length ? '지금 열려 있는 과정 ' + list.length + '개' : '';
        list.slice(0, 6).forEach(function (p) {
            var li = document.createElement('li');
            var a = P.el('a', 'now-item');
            var ext = P.isExternal(p) ? P.externalUrl(p) : null;
            a.href = ext || P.detailUrl(p);
            if (ext) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
            a.appendChild(P.el('span', 'now-title', p.title));
            var meta = [P.statusText(p), p.start_date ? P.md(p.start_date) + ' 개강' : '', P.KIND_LABEL[p.kind]].filter(isStr).join(' · ');
            a.appendChild(P.el('span', 'now-meta', meta));
            li.appendChild(a);
            ol.appendChild(li);
        });
    }

    function renderCards(rows) {
        var grid = $('#program-grid');
        if (!grid) return;
        var all = P.listedRows(rows);
        var kinds = ['live', 'online', 'external'].filter(function (k) { return all.some(function (p) { return p.kind === k; }); });

        // 필터 칩 (종류가 2개 이상일 때만)
        var chips = $('#program-filter');
        if (chips) {
            chips.textContent = '';
            if (kinds.length > 1) {
                if (kindFilter !== 'all' && kinds.indexOf(kindFilter) === -1) kindFilter = 'all';
                [['all', '전체']].concat(kinds.map(function (k) { return [k, P.KIND_LABEL[k]]; })).forEach(function (kv) {
                    var b = P.el('button', 'chip', kv[1]);
                    b.type = 'button';
                    b.setAttribute('aria-pressed', String(kindFilter === kv[0]));
                    b.addEventListener('click', function () { kindFilter = kv[0]; renderCards(lastRows); });
                    chips.appendChild(b);
                });
                chips.hidden = false;
            } else { kindFilter = 'all'; chips.hidden = true; }
        }

        var shown = all.filter(function (p) { return kindFilter === 'all' || p.kind === kindFilter; });
        grid.textContent = '';
        grid.setAttribute('aria-busy', 'false');
        var empty = $('#program-empty');
        if (!shown.length) {
            if (empty) { empty.hidden = false; }
        } else {
            if (empty) empty.hidden = true;
            shown.forEach(function (p) { grid.appendChild(P.cardNode(p)); });
        }
        var live = $('#program-live'); if (live) live.textContent = shown.length + '개 과정 표시';
    }

    function renderError() {
        var grid = $('#program-grid');
        if (grid) { grid.textContent = ''; grid.setAttribute('aria-busy', 'false'); }
        var empty = $('#program-empty');
        if (empty) {
            empty.hidden = false;
            var t = $('.empty-title', empty); if (t) t.textContent = '과정 정보를 불러오지 못했습니다.';
            var d = $('.empty-desc', empty); if (d) d.textContent = '잠시 후 새로고침해 주세요. 신청은 아래 버튼으로 바로 하실 수 있습니다.';
        }
        renderHero([], true);
        var nl = $('#now-list'); if (nl) nl.textContent = '';
    }

    function render(rows) {
        lastRows = rows;
        renderHero(rows);
        renderNow(rows);
        renderCards(rows);
        renumber();
    }

    // ── 전역 구역: 강사 · 지표 · FAQ ─────────────────────────
    function applyGlobal(c) {
        try {
            var v = c['home.instructor'], m = c['home.metrics'];
            var sec = $('#instructor');
            var items = m && Array.isArray(m.items) ? m.items.filter(function (x) { return x && isStr(x.n) && isStr(x.label); }) : [];
            var hasInst = v && isStr(v.name);
            if (sec && (hasInst || items.length)) {
                var card = $('.inst-card', sec), mg = $('.metric-grid', sec);
                if (hasInst && card) {
                    $('h3', card).textContent = v.name;
                    $('.inst-role', card).textContent = isStr(v.role) ? v.role : '';
                    var ul = $('.inst-bio', card); ul.textContent = '';
                    (Array.isArray(v.bio) ? v.bio.filter(isStr) : []).forEach(function (b) { var li = document.createElement('li'); li.textContent = b; ul.appendChild(li); });
                    card.hidden = false;
                } else if (card) card.hidden = true;
                if (items.length && mg) {
                    mg.textContent = '';
                    items.slice(0, 4).forEach(function (x) {
                        var d = P.el('div', 'metric'); d.appendChild(P.el('div', 'n', x.n)); d.appendChild(P.el('div', 'l', x.label)); mg.appendChild(d);
                    });
                    mg.hidden = false;
                } else if (mg) mg.hidden = true;
                sec.hidden = false;
            }
        } catch (e) { /* 이 구역만 숨김 유지 */ }
        try {
            var faq = c['home.faq'], fs = $('#faq');
            var qa = Array.isArray(faq) ? faq.filter(function (x) { return x && isStr(x.q) && isStr(x.a); }) : [];
            if (fs && qa.length) {
                var box = $('.faq-list', fs); box.textContent = '';
                qa.forEach(function (it) {
                    var d = P.el('details', 'faq-item'); d.appendChild(P.el('summary', null, it.q)); d.appendChild(P.el('p', null, it.a)); box.appendChild(d);
                });
                fs.hidden = false;
            }
        } catch (e) { /* 폴백 */ }
        renumber();
    }

    function loadGlobal() {
        if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.fetch) return;
        var ctrl = window.AbortController ? new AbortController() : null;
        var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 4000);
        fetch(cfg.supabaseUrl + '/rest/v1/site_content?key=in.(home.instructor,home.metrics,home.faq)&select=key,value', {
            headers: { apikey: cfg.supabaseAnonKey }, signal: ctrl ? ctrl.signal : undefined
        }).then(function (r) { return r.ok ? r.json() : null; })
            .then(function (rows) {
                clearTimeout(timer);
                if (!Array.isArray(rows)) return;
                var c = {}; rows.forEach(function (r) { c[r.key] = r.value; });
                applyGlobal(c);
            }).catch(function () { clearTimeout(timer); });
    }

    // ── 섹션 번호 · 다음 장 · 메뉴 ──────────────────────────
    function renumber() {
        var secs = $$('[data-sec]').filter(function (s) { return !s.hidden; });
        secs.forEach(function (s, i) {
            var no = $('.sec-no', s); if (no) no.textContent = pad(i);
            var next = $('.sec-next', s), target = secs[i + 1];
            if (next) {
                if (target && target.id) { next.hidden = false; next.setAttribute('href', '#' + target.id); } else next.hidden = true;
            }
        });
        if (window.IRUM_refreshNav) window.IRUM_refreshNav();
    }

    // ── 부팅 ────────────────────────────────────────────────
    function boot() {
        P.loadList(function (rows, source) {
            if (rows === null) { renderError(); return; }
            render(rows);
        });
        loadGlobal();
        renumber();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
