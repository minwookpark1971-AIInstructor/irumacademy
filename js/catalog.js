/**
 * Catalog — 메인 「모집 · 진행 중인 과정」 섹션 컨트롤러
 *   · 진행중·모집중·예정 과정 카드 + 종류 필터 칩
 *   · 마지막에 「다음 기수 알림」 카드
 * 히어로·강의영역·사례·지표·FAQ 등 나머지는 js/content.js 가 맡는다.
 * 데이터: js/programs.js (window.IRUM_PROGRAMS)
 */
(function () {
    'use strict';

    var P = window.IRUM_PROGRAMS;
    if (!P) return;
    var $ = function (sel, root) { return (root || document).querySelector(sel); };

    var kindFilter = 'all';
    var lastRows = null;

    function nextCard() {
        var c = P.el('article', 'pcard-next');
        c.appendChild(P.el('h3', null, '다음 기수가 궁금하신가요?'));
        c.appendChild(P.el('p', null, '새 과정이 열리면 가장 먼저 안내해 드립니다. 관심 분야를 남겨 주세요.'));
        var a = P.el('a', 'btn btn-secondary', '다음 기수 알림 문의 →');
        a.href = P.ROOT + 'html/inquiry.html?topic=next';
        c.appendChild(a);
        return c;
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
            if (empty) empty.hidden = false;
        } else {
            if (empty) empty.hidden = true;
            shown.forEach(function (p) { grid.appendChild(P.cardNode(p)); });
            if (kindFilter === 'all') grid.appendChild(nextCard());
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
            var a = $('a', empty); if (a) { a.textContent = '신청 페이지로 →'; a.href = P.ROOT + 'html/apply.html'; }
        }
    }

    function boot() {
        P.loadList(function (rows) {
            if (rows === null) { renderError(); return; }
            lastRows = rows;
            renderCards(rows);
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
