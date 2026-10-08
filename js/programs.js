/**
 * Programs — 과정(기수) 카탈로그 데이터 + 카드/슬라이드 렌더러 (메인·상세·신청 페이지 공용)
 *
 * 원본: Supabase `site_programs` (공개 행만 익명 조회 가능). 수강료·옵션의 원본은 `courses`/`course_options`.
 * 실패·타임아웃이면 캐시(localStorage, 24h)로 먼저 그리고 백그라운드에서 갱신(stale-while-revalidate).
 * 값은 textContent / DOM 노드로만 넣는다(HTML 삽입 없음). 링크는 상대경로·https 만, 이미지는 상대경로·https 만.
 *
 * 전역: window.IRUM_PROGRAMS
 */
(function () {
    'use strict';

    var cfg = window.IRUM_CONFIG || {};
    var CACHE_KEY = 'irum:programs:v1';
    var CACHE_TTL = 24 * 60 * 60 * 1000;
    var TIMEOUT_MS = 5000;
    var LIST_COLS = 'slug,kind,status,published,featured,hero_order,sort_order,title,subtitle,summary,badge,tags,' +
        'start_date,end_date,schedule_label,format_label,duration_label,price_label,host_label,audience_label,location_label,' +
        'late_join,poster,poster_alt,thumb,apply_mode,apply_course_slug,external_url,source_name,checked_at';

    // 사이트 루트 기준 경로 접두사 (/v2/·/html/ 아래에서는 ../)
    var ROOT = /\/(v2|html)\/[^/]*$/.test(location.pathname) ? '../' : '';

    var KIND_LABEL = { live: '현장 · Zoom', online: '온라인 강좌', external: '외부 강의' };
    var STATUS_LABEL = { open: '모집중', ongoing: '진행중', upcoming: '예정', closed: '마감' };
    var STATUS_RANK = { ongoing: 0, open: 1, upcoming: 2, closed: 9 };

    // ── 유틸 ────────────────────────────────────────────────
    var isStr = function (x) { return typeof x === 'string' && x.trim() !== ''; };
    var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

    function rootRel(h) {
        return (h.charAt(0) === '#' || h.charAt(0) === '/' || h.indexOf('../') === 0) ? h : ROOT + h;
    }
    /** 상대 경로 또는 http(s) 링크만 허용 */
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
    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null && text !== '') n.textContent = text;
        return n;
    }
    function today() {
        var d = new Date();
        return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    }
    function md(d) {
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || '');
        return m ? (+m[2]) + '/' + (+m[3]) : '';
    }

    // ── 상태 ────────────────────────────────────────────────
    /** 선언된 status 를 날짜로 보정: 종료일이 지나면 마감, 예정인데 시작일이 지났으면 모집중 */
    function effStatus(p) {
        var s = p.status || 'open';
        if (s === 'closed') return 'closed';
        var t = today();
        if (p.end_date && p.end_date < t) return 'closed';
        if (s === 'upcoming' && p.start_date && p.start_date <= t) return 'open';
        return s;
    }
    function statusText(p) {
        var s = effStatus(p);
        if (s === 'ongoing' && p.late_join) return '진행중 · 중도 합류 가능';
        if (s === 'open' && p.start_date && p.start_date <= today() && p.late_join) return '모집중 · 진행 중 합류 가능';
        return STATUS_LABEL[s] || '';
    }
    function isLive(p) { var s = effStatus(p); return s === 'ongoing' || s === 'open'; }
    function isListed(p) { var s = effStatus(p); return s === 'ongoing' || s === 'open' || s === 'upcoming'; }

    function heroList(rows) {
        var feat = rows.filter(function (p) { return p.featured && isLive(p); });
        if (!feat.length) feat = rows.filter(isLive).slice(0, 3); // 대표 지정이 없으면 진행중 과정 상위 3개
        return feat.slice().sort(function (a, b) { return (a.hero_order - b.hero_order) || (a.sort_order - b.sort_order); });
    }
    function listedRows(rows) {
        return rows.filter(isListed).sort(function (a, b) {
            return (STATUS_RANK[effStatus(a)] - STATUS_RANK[effStatus(b)]) || (a.sort_order - b.sort_order) || (a.slug < b.slug ? -1 : 1);
        });
    }

    // ── 링크 ────────────────────────────────────────────────
    function detailUrl(p) { return ROOT + 'html/program.html?p=' + encodeURIComponent(p.slug); }
    function applyUrl(p) { return ROOT + 'html/apply.html?course=' + encodeURIComponent(p.apply_course_slug || p.slug); }
    function isExternal(p) { return p.apply_mode === 'external' || p.kind === 'external'; }
    function externalUrl(p) { return /^https:\/\//i.test(p.external_url || '') ? p.external_url : null; }

    // ── 정보 요약 ───────────────────────────────────────────
    function factRows(p) {
        var when = p.schedule_label || (p.start_date ? md(p.start_date) + (p.end_date ? ' ~ ' + md(p.end_date) : ' 개강') : '');
        var form = [p.format_label, p.duration_label].filter(isStr).join(' · ');
        var rows = [['일정', when], ['형태', form], ['수강료', p.price_label], ['주관', p.host_label]];
        return rows.filter(function (r) { return isStr(r[1]); });
    }

    // ── 포스터(없으면 종류별 타이포 카드) ───────────────────
    function posterNode(p, thumb, eager) {
        var src = safeSrc(thumb ? (p.thumb || p.poster) : (p.poster || p.thumb));
        if (src) {
            var fig = el('figure', 'poster');
            var img = el('img');
            img.src = src;
            img.alt = isStr(p.poster_alt) ? p.poster_alt : (p.title || '');
            img.width = 1080; img.height = 1350;
            img.loading = eager ? 'eager' : 'lazy';
            img.decoding = 'async';
            fig.appendChild(img);
            return fig;
        }
        var f = el('div', 'poster poster-fallback');
        f.setAttribute('data-kind', p.kind || 'live');
        f.setAttribute('role', 'img');
        f.setAttribute('aria-label', p.title || '');
        f.appendChild(el('span', 'pf-kind', KIND_LABEL[p.kind] || ''));
        f.appendChild(el('span', 'pf-title', p.title || ''));
        if (isStr(p.subtitle)) f.appendChild(el('span', 'pf-sub', p.subtitle));
        return f;
    }

    // ── 슬라이드(히어로) ────────────────────────────────────
    function slideNode(p, i, total) {
        var s = el('article', 'slide' + (i === 0 ? ' is-active' : ''));
        s.setAttribute('role', 'group');
        s.setAttribute('aria-roledescription', 'slide');
        s.setAttribute('aria-label', (i + 1) + ' / ' + total);

        var text = el('div', 'slide-text');
        text.appendChild(el('span', 'slide-label', [KIND_LABEL[p.kind], statusText(p)].filter(isStr).join(' · ')));
        var h = el('div', 'slide-title', p.title);
        h.setAttribute('role', 'heading'); h.setAttribute('aria-level', '2');
        text.appendChild(h);
        if (isStr(p.subtitle) || isStr(p.summary)) text.appendChild(el('p', 'slide-desc', [p.subtitle, p.summary].filter(isStr).join('\n')));
        var tags = el('div', 'slide-tags');
        [p.schedule_label, p.format_label, p.price_label].filter(isStr).slice(0, 3).forEach(function (t) { tags.appendChild(el('span', 'tag tag-on-dark', t)); });
        text.appendChild(tags);

        var act = el('div', 'slide-actions');
        if (isExternal(p)) {
            var ext = externalUrl(p);
            if (ext) {
                var a = el('a', 'btn btn-primary btn-lg', '원본 사이트로 이동 ↗');
                a.href = ext; a.target = '_blank'; a.rel = 'noopener noreferrer';
                act.appendChild(a);
            }
        } else {
            var apply = el('a', 'btn btn-primary btn-lg', '신청하기 →'); apply.href = applyUrl(p);
            var det = el('a', 'btn btn-lg btn-on-dark', '상세 보기'); det.href = detailUrl(p);
            act.appendChild(apply); act.appendChild(det);
        }
        text.appendChild(act);
        s.appendChild(text);

        var fig = posterNode(p, false, i === 0);
        fig.classList.add('slide-img');
        s.appendChild(fig);
        return s;
    }

    // ── 카드 ────────────────────────────────────────────────
    function cardNode(p) {
        var es = effStatus(p);
        var c = el('article', 'pcard');
        c.setAttribute('data-kind', p.kind || 'live');
        c.setAttribute('data-status', es);

        var th = posterNode(p, true, false);
        th.classList.add('pcard-thumb');
        c.appendChild(th);

        var body = el('div', 'pcard-body');
        var badges = el('div', 'pcard-badges');
        badges.appendChild(el('span', 'pbadge pbadge-kind', KIND_LABEL[p.kind] || ''));
        badges.appendChild(el('span', 'pbadge pbadge-status', statusText(p)));
        body.appendChild(badges);

        var h = el('h3', 'pcard-title', p.title);
        body.appendChild(h);
        if (isStr(p.subtitle)) body.appendChild(el('p', 'pcard-sub', p.subtitle));
        if (isStr(p.summary)) body.appendChild(el('p', 'pcard-sum', p.summary));

        var dl = el('dl', 'pcard-facts');
        factRows(p).forEach(function (r) {
            var d = el('div');
            d.appendChild(el('dt', null, r[0]));
            d.appendChild(el('dd', null, r[1]));
            dl.appendChild(d);
        });
        if (dl.children.length) body.appendChild(dl);

        var act = el('div', 'pcard-actions');
        if (isExternal(p)) {
            var ext = externalUrl(p);
            if (ext) {
                var a = el('a', 'btn btn-primary', (p.source_name ? p.source_name + ' ' : '') + '원본 사이트로 ↗');
                a.href = ext; a.target = '_blank'; a.rel = 'noopener noreferrer';
                a.setAttribute('aria-label', (p.title || '') + ' — 외부 사이트로 이동(새 탭)');
                act.appendChild(a);
            }
            var note = '외부 사이트 강의';
            if (p.checked_at) note += ' · ' + md(p.checked_at) + ' 확인 · 신청 전 원본에서 다시 확인하세요';
            body.appendChild(el('p', 'pcard-note', note));
        } else {
            var d1 = el('a', 'btn btn-secondary', '상세 보기'); d1.href = detailUrl(p);
            var d2 = el('a', 'btn btn-primary', '신청하기 →'); d2.href = applyUrl(p);
            act.appendChild(d1); act.appendChild(d2);
        }
        body.appendChild(act);
        c.appendChild(body);
        return c;
    }

    // ── 데이터 로드 ─────────────────────────────────────────
    function rest(path) {
        var ctrl = window.AbortController ? new AbortController() : null;
        var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT_MS);
        return fetch(cfg.supabaseUrl + '/rest/v1/' + path, {
            headers: { apikey: cfg.supabaseAnonKey },
            signal: ctrl ? ctrl.signal : undefined
        }).then(function (r) {
            clearTimeout(timer);
            if (!r.ok) throw new Error('http ' + r.status);
            return r.json();
        }, function (e) { clearTimeout(timer); throw e; });
    }
    function readCache() {
        try {
            var raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            var o = JSON.parse(raw);
            return (o && Array.isArray(o.rows) && Date.now() - o.t < CACHE_TTL) ? o : null;
        } catch (e) { return null; }
    }
    function writeCache(rows) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), rows: rows })); } catch (e) { /* 저장 불가 환경은 무시 */ }
    }

    /**
     * 목록 조회(SWR). onData(rows, source) 를 최대 두 번 부른다: 캐시('cache') → 네트워크('network').
     * 캐시도 없고 네트워크도 실패하면 onData(null, 'error').
     */
    function loadList(onData) {
        if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.fetch) { onData(null, 'error'); return Promise.resolve(null); }
        var cached = readCache();
        var cachedKey = null;
        if (cached) { cachedKey = JSON.stringify(cached.rows); onData(cached.rows, 'cache'); }
        return rest('site_programs?select=' + LIST_COLS + '&published=eq.true&order=sort_order.asc,slug.asc')
            .then(function (rows) {
                if (!Array.isArray(rows)) throw new Error('bad rows');
                writeCache(rows);
                if (JSON.stringify(rows) !== cachedKey) onData(rows, 'network');
                return rows;
            })
            .catch(function () { if (!cached) onData(null, 'error'); return null; });
    }

    var SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
    /** 상세(detail 포함) */
    function loadOne(slug) {
        if (!SLUG_RE.test(slug || '')) return Promise.resolve(null);
        return rest('site_programs?select=*&slug=eq.' + encodeURIComponent(slug) + '&limit=1').then(function (r) { return r[0] || null; });
    }
    /** 연결된 신청 과정(수강료·옵션 원본). 모집중(open)이 아니면 익명에게 보이지 않아 null */
    function loadCourse(courseSlug) {
        if (!SLUG_RE.test(courseSlug || '')) return Promise.resolve(null);
        return rest('courses?select=slug,title,status,price_text,course_options(id,name,description,price,sort_order,active)&slug=eq.' +
            encodeURIComponent(courseSlug) + '&limit=1').then(function (r) { return r[0] || null; }).catch(function () { return null; });
    }

    window.IRUM_PROGRAMS = {
        ROOT: ROOT, KIND_LABEL: KIND_LABEL, STATUS_LABEL: STATUS_LABEL,
        isStr: isStr, el: el, md: md, today: today, safeHref: safeHref, safeSrc: safeSrc,
        effStatus: effStatus, statusText: statusText, isLive: isLive, isListed: isListed,
        heroList: heroList, listedRows: listedRows,
        detailUrl: detailUrl, applyUrl: applyUrl, isExternal: isExternal, externalUrl: externalUrl, factRows: factRows,
        posterNode: posterNode, slideNode: slideNode, cardNode: cardNode,
        loadList: loadList, loadOne: loadOne, loadCourse: loadCourse
    };
})();
