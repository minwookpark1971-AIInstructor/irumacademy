/**
 * Program page — html/program.html?p=<slug> 상세 렌더러
 * 데이터: site_programs(상세 detail 포함) + 연결된 courses/course_options(수강료 원본)
 * 값이 없는 구역은 숨긴다. 모든 값은 textContent/DOM 노드로만 넣는다.
 */
(function () {
    'use strict';

    var P = window.IRUM_PROGRAMS;
    if (!P) return;
    var $ = function (id) { return document.getElementById(id); };
    var isStr = P.isStr, el = P.el;
    var slug = (new URLSearchParams(location.search).get('p') || '').trim();

    function show(id) { var n = $(id); if (n) n.hidden = false; }
    function setText(id, v) { var n = $(id); if (n) { n.textContent = v; } }
    function won(n) { return (n == null || isNaN(n)) ? '' : Number(n).toLocaleString('ko-KR') + '원'; }
    function status(msg) { var s = $('pg-status'); if (s) s.textContent = msg; }

    function notFound(id) {
        ['pg-hero', 'pg-toc'].forEach(function (x) { $(x).hidden = true; });
        show(id);
        document.title = '과정을 찾을 수 없습니다 | 이룸아카데미';
    }

    // ── 구역 ────────────────────────────────────────────────
    var sections = []; // [{id,label}]
    function addSection(id, label) { show(id); sections.push({ id: id, label: label }); }

    function fillCards(boxId, items, build) {
        var box = $(boxId);
        box.textContent = '';
        items.forEach(function (it, i) { box.appendChild(build(it, i)); });
    }
    function iCard(it, i) {
        var c = el('div', 'icard');
        c.appendChild(el('div', 'num', (i < 9 ? '0' : '') + (i + 1)));
        c.appendChild(el('h3', null, it.title));
        if (isStr(it.body)) c.appendChild(el('p', null, it.body));
        return c;
    }
    function tCard(t) {
        var c = el('div', 'tcard');
        if (isStr(t.code)) { c.setAttribute('data-code', String(t.code).toUpperCase().slice(0, 1)); c.appendChild(el('div', 'tc-code', 'PROGRAM ' + String(t.code).toUpperCase().slice(0, 1))); }
        c.appendChild(el('h3', null, t.name));
        if (isStr(t.tagline)) c.appendChild(el('p', 'tag-line', t.tagline));
        if (isStr(t.desc)) c.appendChild(el('p', null, t.desc));
        var dl = el('dl');
        [['회차', t.sessions], ['산출물', t.output]].forEach(function (r) {
            if (!isStr(r[1])) return;
            var d = el('div'); d.appendChild(el('dt', null, r[0])); d.appendChild(el('dd', null, r[1])); dl.appendChild(d);
        });
        if (dl.children.length) c.appendChild(dl);
        return c;
    }

    var TYPE_LABEL = { zoom: 'Zoom', offline: '오프라인', online: '온라인', video: '영상' };

    function renderDetail(p, d, course) {
        // 개요
        var ov = Array.isArray(d.overview) ? d.overview.filter(isStr) : [];
        if (ov.length) {
            var b = $('overview-body'); b.textContent = '';
            ov.forEach(function (t) { b.appendChild(el('p', null, t)); });
            addSection('sec-overview', '소개');
        }
        // 트랙
        var tr = Array.isArray(d.tracks) ? d.tracks.filter(function (t) { return t && isStr(t.name); }) : [];
        if (tr.length) { fillCards('tracks-body', tr, tCard); addSection('sec-tracks', '트랙'); }
        // 배우는 것 / 얻는 것
        ['learn', 'outcomes'].forEach(function (k) {
            var items = Array.isArray(d[k]) ? d[k].filter(function (t) { return t && isStr(t.title); }) : [];
            if (items.length) { fillCards(k + '-body', items, iCard); addSection('sec-' + k, k === 'learn' ? '배우는 것' : '얻는 것'); }
        });
        // 커리큘럼
        var cur = Array.isArray(d.curriculum) ? d.curriculum.filter(function (r) { return r && isStr(r.title); }) : [];
        if (cur.length) {
            var tb = $('curriculum-body'); tb.textContent = '';
            var anyMs = false;
            cur.forEach(function (r) {
                var tr1 = el('tr');
                if (isStr(r.track)) tr1.setAttribute('data-track', String(r.track).toUpperCase().slice(0, 1));
                if (r.milestone === true) { tr1.className = 'is-ms'; anyMs = true; }
                tr1.appendChild(el('td', 'c-no', r.no || ''));
                tr1.appendChild(el('td', 'c-date', (r.date || '') + (r.milestone === true ? ' ★' : '')));
                var tdType = el('td');
                if (isStr(r.type) && TYPE_LABEL[r.type]) { var sp = el('span', 'type-badge', TYPE_LABEL[r.type]); sp.setAttribute('data-type', r.type); tdType.appendChild(sp); }
                tr1.appendChild(tdType);
                tr1.appendChild(el('td', 'c-title', r.title));
                tr1.appendChild(el('td', 'c-track', r.body || ''));
                tb.appendChild(tr1);
            });
            $('curriculum-note').hidden = !anyMs;
            addSection('sec-curriculum', '커리큘럼');
        }
        // 운영 방식
        var ops = Array.isArray(d.operations) ? d.operations.filter(function (r) { return r && isStr(r.k) && isStr(r.v); }) : [];
        if (ops.length) {
            var ob = $('operations-body'); ob.textContent = '';
            ops.forEach(function (r) { var tr2 = el('tr'); tr2.appendChild(el('th', null, r.k)); tr2.getElementsByTagName('th')[0].setAttribute('scope', 'row'); tr2.appendChild(el('td', null, r.v)); ob.appendChild(tr2); });
            addSection('sec-operations', '운영 방식');
        }
        // 수강료: 신청 과정 옵션(원본) 우선, 없으면 detail.fees
        var fees = [];
        if (course && Array.isArray(course.course_options)) {
            fees = course.course_options.filter(function (o) { return o.active !== false; })
                .sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); })
                .map(function (o) { return { name: o.name, note: o.description, price: o.price > 0 ? won(o.price) : '문의' }; });
        }
        if (!fees.length && Array.isArray(d.fees)) fees = d.fees.filter(function (f) { return f && isStr(f.name) && isStr(f.price); });
        if (fees.length) {
            var fb = $('fees-body'); fb.textContent = '';
            fees.forEach(function (f) {
                var r = el('tr'); var td = el('td');
                td.appendChild(el('b', 'fee-name', f.name));
                if (isStr(f.note)) td.appendChild(el('span', 'fee-note', f.note));
                r.appendChild(td); r.appendChild(el('td', 'fee-price', f.price));
                fb.appendChild(r);
            });
            if (p.checked_at && P.isExternal(p)) { var fn = $('fees-note'); fn.textContent = '외부 사이트 정보 · ' + P.md(p.checked_at) + ' 확인 · 신청 전 원본에서 다시 확인하세요.'; fn.hidden = false; }
            addSection('sec-fees', '수강료');
        }
        // 안내 사항
        var nt = Array.isArray(d.notices) ? d.notices.filter(isStr) : [];
        if (nt.length) {
            var nb = $('notices-body'); nb.textContent = '';
            nt.forEach(function (t) { nb.appendChild(el('li', null, t)); });
            addSection('sec-notices', '안내');
        }
        // 입금 안내 (과정별 계좌)
        var pay = d.payment;
        if (pay && isStr(pay.bank) && isStr(pay.number) && isStr(pay.holder) && !P.isExternal(p)) {
            setText('pay-bank', pay.bank); setText('pay-number', pay.number); setText('pay-holder', '예금주 ' + pay.holder);
            addSection('sec-payment', '입금 안내');
            var cp = $('copy-account');
            cp.addEventListener('click', function () {
                function done(ok) { cp.textContent = ok ? '복사되었습니다' : '길게 눌러 직접 복사해 주세요'; setTimeout(function () { cp.textContent = '계좌번호 복사'; }, 2000); }
                if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(pay.number).then(function () { done(true); }, function () { done(false); }); else done(false);
            });
        }
        // FAQ
        var faq = Array.isArray(d.faq) ? d.faq.filter(function (f) { return f && isStr(f.q) && isStr(f.a); }) : [];
        if (faq.length) {
            var fq = $('faq-body'); fq.textContent = '';
            faq.forEach(function (f) { var dt = el('details', 'faq-item'); dt.appendChild(el('summary', null, f.q)); dt.appendChild(el('p', null, f.a)); fq.appendChild(dt); });
            addSection('sec-faq', 'FAQ');
        }
    }

    function renderTop(p) {
        var es = P.effStatus(p);
        $('pg-hero').setAttribute('data-status', es);
        var bd = $('pg-badges'); bd.textContent = '';
        bd.appendChild(el('span', 'pbadge pbadge-kind', P.KIND_LABEL[p.kind] || ''));
        bd.appendChild(el('span', 'pbadge pbadge-status', P.statusText(p)));
        setText('pg-title', p.title);
        if (isStr(p.subtitle)) { setText('pg-sub', p.subtitle); show('pg-sub'); }
        if (isStr(p.summary)) { setText('pg-sum', p.summary); show('pg-sum'); }
        var f = $('pg-facts'); f.textContent = '';
        var rows = P.factRows(p);
        if (isStr(p.audience_label)) rows.push(['대상', p.audience_label]);
        if (isStr(p.location_label)) rows.push(['장소', p.location_label]);
        rows.forEach(function (r) { var d = el('div'); d.appendChild(el('dt', null, r[0])); d.appendChild(el('dd', null, r[1])); f.appendChild(d); });

        var cta = $('pg-cta'); cta.textContent = '';
        var sticky = $('pg-sticky'); sticky.textContent = '';
        function addBtn(box, label, href, cls, external) {
            var a = el('a', cls, label); a.href = href;
            if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
            box.appendChild(a); return a;
        }
        if (P.isExternal(p)) {
            var ext = P.externalUrl(p);
            if (ext) { addBtn(cta, (p.source_name ? p.source_name + ' ' : '') + '원본 사이트로 이동 ↗', ext, 'btn btn-primary btn-lg', true); addBtn(sticky, '원본 사이트로 이동 ↗', ext, 'btn', true); }
        } else if (es !== 'closed') {
            addBtn(cta, '신청하기 →', P.applyUrl(p), 'btn btn-primary btn-lg');
            addBtn(sticky, '신청하기 →', P.applyUrl(p), 'btn');
        } else {
            cta.appendChild(el('span', 'tag tag-on-dark', '신청이 마감되었습니다'));
        }
        sticky.hidden = !sticky.children.length;

        var po = $('pg-poster'); po.textContent = '';
        if (P.safeSrc(p.poster || p.thumb)) po.appendChild(P.posterNode(p, false, true));

        // 탭 제목·설명·OG(클라이언트 보정; 공유 카드 크롤러는 JS 를 실행하지 않는다)
        document.title = p.title + ' | 이룸아카데미';
        var desc = [p.subtitle, p.summary].filter(isStr).join(' — ') || document.title;
        var dm = document.querySelector('meta[name="description"]'); if (dm) dm.setAttribute('content', desc);
        var ot = document.querySelector('meta[property="og:title"]'); if (ot) ot.setAttribute('content', document.title);
        var od = document.querySelector('meta[property="og:description"]'); if (od) od.setAttribute('content', desc);
        $('pg-hero').hidden = false;
    }

    function buildToc() {
        if (sections.length < 2) return;
        var ul = $('pg-toc-list'); ul.textContent = '';
        sections.forEach(function (s) {
            var li = document.createElement('li'); var a = el('a', null, s.label); a.href = '#' + s.id; li.appendChild(a); ul.appendChild(li);
        });
        $('pg-toc').hidden = false;
        if (!('IntersectionObserver' in window)) return;
        var links = Array.prototype.slice.call(ul.querySelectorAll('a'));
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
            });
        }, { rootMargin: '-35% 0px -60% 0px' });
        sections.forEach(function (s) { io.observe($(s.id)); });
    }

    function boot() {
        if (!slug) { notFound('pg-notfound'); return; }
        status('과정 정보를 불러오는 중');
        P.loadOne(slug).then(function (p) {
            if (!p) { notFound('pg-notfound'); status('과정을 찾을 수 없습니다'); return null; }
            renderTop(p);
            var needCourse = !P.isExternal(p) && (p.apply_course_slug || p.slug);
            return (needCourse ? P.loadCourse(p.apply_course_slug || p.slug) : Promise.resolve(null)).then(function (course) {
                renderDetail(p, p.detail || {}, course);
                buildToc();
                status(p.title + ' 상세 정보를 불러왔습니다');
                if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t && !t.hidden) t.scrollIntoView(); }
            });
        }).catch(function () { notFound('pg-error'); status('과정 정보를 불러오지 못했습니다'); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
