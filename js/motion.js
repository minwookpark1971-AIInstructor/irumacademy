/**
 * Motion — 메인 모션 모음 (외부 라이브러리 없음, transform/opacity 만 사용)
 *   [data-reveal]          뷰포트 진입 시 1회 fade-up
 *   [data-reveal-stagger]  자식을 80ms 간격으로 순차 등장
 *   [data-marquee]         무한 가로 롤링 (data-speed=한 바퀴 초, data-direction=right 이면 역방향)
 *   [data-countup]         0 → 목표값 (data-to, data-prefix, data-suffix)
 *   [data-hero]            #hero-bg 의 .hero-slide 크로스페이드(6초), 탭이 숨겨지면 정지
 * prefers-reduced-motion: reduce 이면 전부 즉시 표시·정지한다.
 * 동적으로 채워지는 영역은 렌더 후 IRUM_MOTION.scan() 을 다시 부른다.
 */
(function () {
    'use strict';

    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
    var io = null;

    function ensureIO() {
        if (io || !('IntersectionObserver' in window)) return io;
        io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                var el = en.target;
                io.unobserve(el);
                if (el.hasAttribute('data-countup')) runCount(el); else el.classList.add('is-in');
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
        return io;
    }
    function watch(el) {
        if (el.__mw) return;
        el.__mw = true;
        if (reduce || !ensureIO()) { if (el.hasAttribute('data-countup')) runCount(el, true); else el.classList.add('is-in'); return; }
        io.observe(el);
    }

    // ── 숫자 카운트업 ───────────────────────────────────────
    function fmt(n, dec) {
        var s = dec ? n.toFixed(dec) : String(Math.round(n));
        return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    function runCount(el, instant) {
        var to = parseFloat(el.getAttribute('data-to')) || 0;
        var dec = parseInt(el.getAttribute('data-dec') || '0', 10) || 0;
        var pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '';
        if (instant || reduce) { el.textContent = pre + fmt(to, dec) + suf; return; }
        var t0 = null, dur = 1600;
        function step(ts) {
            if (t0 === null) t0 = ts;
            var p = Math.min(1, (ts - t0) / dur);
            var e = 1 - Math.pow(1 - p, 3); // easeOutCubic
            el.textContent = pre + fmt(to * e, dec) + suf;
            if (p < 1) requestAnimationFrame(step);
        }
        el.textContent = pre + '0' + suf;
        requestAnimationFrame(step);
    }

    // ── 마키 ────────────────────────────────────────────────
    function cloneHidden(n) {
        var c = n.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        $$('a, button', c).forEach(function (f) { f.setAttribute('tabindex', '-1'); });
        return c;
    }
    /** 목록을 한 화면 이상으로 채운 뒤 전체를 한 번 더 복제 → translateX(-50%) 로 이음매 없이 반복 */
    function marquee(box, force) {
        if (!box) return;
        if (box.__mq && !force) return;
        var track = box.querySelector('.mq-track');
        if (!track || !track.children.length) return;
        box.__mq = true;
        $$('[aria-hidden="true"]', track).forEach(function (n) { if (n.parentNode === track && n.__clone) track.removeChild(n); });
        box.style.removeProperty('--mq-dur');
        if (reduce) return;
        var orig = Array.prototype.slice.call(track.children), guard = 0;
        function mark(c) { c.__clone = true; return c; }
        while (track.scrollWidth < box.clientWidth * 1.1 && guard++ < 12) orig.forEach(function (n) { track.appendChild(mark(cloneHidden(n))); });
        Array.prototype.slice.call(track.children).forEach(function (n) { track.appendChild(mark(cloneHidden(n))); });
        box.style.setProperty('--mq-dur', (parseFloat(box.getAttribute('data-speed')) || 40) + 's');
    }

    // ── 히어로 크로스페이드 ─────────────────────────────────
    var heroTimer = null, heroIdx = 0, heroBound = false;
    function heroStart() {
        var bg = document.getElementById('hero-bg');
        if (!bg) return;
        var slides = $$('.hero-slide', bg);
        if (heroTimer) { clearInterval(heroTimer); heroTimer = null; }
        if (!slides.length) return;
        heroIdx = 0;
        slides.forEach(function (s, i) { s.classList.toggle('is-active', i === 0); });
        function go(i) {
            heroIdx = (i + slides.length) % slides.length;
            slides.forEach(function (s, k) { s.classList.toggle('is-active', k === heroIdx); });
        }
        function start() { if (reduce || heroTimer || slides.length < 2) return; heroTimer = setInterval(function () { go(heroIdx + 1); }, 6000); }
        function stop() { if (heroTimer) { clearInterval(heroTimer); heroTimer = null; } }
        start();
        if (!heroBound) {
            heroBound = true;
            document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
        }
    }

    // ── 전체 스캔 ───────────────────────────────────────────
    function scan(root) {
        $$('[data-reveal-stagger]', root).forEach(function (box) {
            Array.prototype.forEach.call(box.children, function (c, i) { c.style.setProperty('--i', i); });
        });
        $$('[data-reveal], [data-reveal-stagger], [data-countup]', root).forEach(watch);
        $$('[data-marquee]', root).forEach(function (b) { marquee(b); });
    }

    window.IRUM_MOTION = { scan: scan, marquee: marquee, heroStart: heroStart, reduce: reduce };

    function boot() { scan(document); heroStart(); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
