/**
 * IRUM — 데이터 · 인증 계층 (단일 진입점)
 *
 * 페이지 코드는 Supabase 를 직접 부르지 않고 전부 이 모듈을 거친다.
 * 키 교체나 백엔드 전환이 이 파일 하나 수정으로 끝나야 하기 때문이다.
 *
 * 두 가지 모드로 동작한다.
 *   supabase : js/config.js 에 URL·anon key 가 채워져 있을 때. 실제 Google 로그인 + DB.
 *   local    : 설정이 비어 있을 때. localStorage 에 저장하고 로그인은 이메일 입력으로 대체.
 *              화면 확인용이며, 이 모드의 신청 데이터는 관리자가 볼 수 없다.
 *
 * 공개 API
 *   IRUM.mode                      'supabase' | 'local'
 *   IRUM.ready()                   세션 복원이 끝난 뒤 resolve 되는 Promise
 *   IRUM.getUser()                 { email, name } | null
 *   IRUM.isAdmin()                 Promise<boolean>
 *   IRUM.signInWithGoogle(returnTo)
 *   IRUM.signOut()
 *   IRUM.listOpenCourses()         Promise<Course[]>
 *   IRUM.getCourse(slug)           Promise<Course|null>
 *   IRUM.createApplication(data)   Promise<{ok, error}>
 *   IRUM.listMyApplications()      Promise<App[]>
 *   IRUM.listAllApplications()     Promise<App[]>   (관리자)
 *   IRUM.updateApplicationStatus(id, status)
 *   IRUM.STATUS_LABEL / STATUS_CLASS
 */
(function (global) {
    'use strict';

    var cfg = global.IRUM_CONFIG || {};
    var useSupabase = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);

    var sb = null;
    var currentUser = null;
    var readyPromise = null;

    // ── 상태 라벨 ────────────────────────────────────────────────────────────
    var STATUS_LABEL = {
        received: '접수',
        payment_confirmed: '입금확인',
        confirmed: '확정',
        cancelled: '취소'
    };
    var STATUS_CLASS = {
        received: 'tag tag-neutral',
        payment_confirmed: 'tag tag-outline',
        confirmed: 'tag tag-accent',
        cancelled: 'tag tag-neutral'
    };

    // ── 폴백 강의 카탈로그 ───────────────────────────────────────────────────
    // Supabase 가 붙기 전, 그리고 DB 응답이 실패했을 때 화면이 비지 않도록 하는 기본값.
    // 실제 운영 데이터는 courses 테이블이 소유한다.
    var FALLBACK_COURSES = [{
        slug: 'ai-automation-vibecoding-2026h2',
        title: 'AI업무자동화 & 바이브코딩 통합 전문가 과정',
        subtitle: '업무자동화에서 실제 서비스까지',
        level: '심화 · 6주',
        duration: '60시간 (12회 × 5시간)',
        schedule: '2026.08.08 ZOOM 개강 · 주 2회',
        host: 'KECA · 이룸아카데미',
        price_text: '기초 30만 · 심화 30만 · 전체 50만 (KECA 20%↓)',
        capacity_text: '20명 · 접수중',
        status: 'open',
        options: [
            { name: '기초', label: '기초 (8.8~8.29) · 30만원', price: 300000 },
            { name: '심화', label: '심화 (9.2~9.19) · 30만원', price: 300000 },
            { name: '전체', label: '전체 · 50만원 (KECA 20% 할인)', price: 500000 }
        ]
    }];

    // ── 로컬 모드 저장소 ─────────────────────────────────────────────────────
    var LS_APPS = 'irum:applications';
    var LS_USER = 'irum:user';

    function lsRead(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }
    function lsWrite(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 용량 초과 등 */ }
    }

    // supabase-js 는 설정이 채워졌을 때만 받아온다. 로컬 모드에서 쓰지도 않을
    // 120KB 를 모든 페이지가 내려받게 하지 않기 위해서다.
    // 버전은 정확히 고정한다 — '@2' 같은 범위 지정은 업스트림이 회귀하면
    // 아무도 배포하지 않았는데 사이트가 죽는다.
    var SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.58.0/dist/umd/supabase.js';

    function loadSdk() {
        if (global.supabase && global.supabase.createClient) return Promise.resolve(true);
        return new Promise(function (resolve) {
            var s = document.createElement('script');
            s.src = SDK_URL;
            s.crossOrigin = 'anonymous';
            s.onload = function () { resolve(!!(global.supabase && global.supabase.createClient)); };
            s.onerror = function () { resolve(false); };
            document.head.appendChild(s);
        });
    }

    // ── 초기화 ───────────────────────────────────────────────────────────────
    function init() {
        if (readyPromise) return readyPromise;

        readyPromise = new Promise(function (resolve) {
            if (!useSupabase) {
                currentUser = lsRead(LS_USER, null);
                resolve();
                return;
            }

            loadSdk().then(function (ok) {
            if (!ok) {
                console.error('[IRUM] supabase-js 를 불러오지 못했습니다. 로컬 모드로 되돌립니다.');
                useSupabase = false;
                currentUser = lsRead(LS_USER, null);
                resolve();
                return;
            }

            sb = global.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true,   // PKCE 코드 교환을 SDK 가 알아서 처리한다
                    flowType: 'pkce',
                    storageKey: 'irum-auth'
                }
            });

            sb.auth.getSession().then(function (res) {
                var session = res && res.data && res.data.session;
                currentUser = session ? mapUser(session.user) : null;
                sb.auth.onAuthStateChange(function (_evt, s) {
                    currentUser = s ? mapUser(s.user) : null;
                });
                resolve();
            }).catch(function (err) {
                console.error('[IRUM] 세션 복원 실패', err);
                resolve();
            });
            });
        });

        return readyPromise;
    }

    function mapUser(u) {
        if (!u) return null;
        var meta = u.user_metadata || {};
        return {
            id: u.id,
            email: u.email || '',
            name: meta.full_name || meta.name || (u.email ? u.email.split('@')[0] : '')
        };
    }

    // ── 인증 ─────────────────────────────────────────────────────────────────
    function signInWithGoogle(returnTo) {
        if (!useSupabase) {
            // 로컬 모드: 실제 Google 인증이 불가능하므로 이메일을 직접 받는다.
            var email = global.prompt('로컬(데모) 모드입니다.\nSupabase 설정 전에는 실제 Google 로그인이 동작하지 않습니다.\n\n확인용 이메일을 입력하세요.', '');
            if (!email) return Promise.resolve(false);
            currentUser = { id: 'local:' + email, email: email.trim(), name: email.split('@')[0] };
            lsWrite(LS_USER, currentUser);
            return Promise.resolve(true);
        }
        return sb.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: returnTo || window.location.href.split('#')[0] }
        }).then(function () { return true; });
    }

    function signOut() {
        if (!useSupabase) {
            currentUser = null;
            try { localStorage.removeItem(LS_USER); } catch (e) {}
            return Promise.resolve();
        }
        return sb.auth.signOut().then(function () { currentUser = null; });
    }

    function isAdmin() {
        if (!currentUser) return Promise.resolve(false);
        if (!useSupabase) {
            // 로컬 모드에는 권한 개념이 없다. 화면 확인 목적으로만 통과시킨다.
            return Promise.resolve(true);
        }
        // admins 테이블은 RLS 로 잠겨 있으므로 직접 조회하지 않는다.
        // 관리자만 읽을 수 있는 자원을 실제로 읽어 보는 것으로 판정한다.
        return sb.from('applications').select('id', { count: 'exact', head: true })
            .then(function (res) { return !res.error; })
            .catch(function () { return false; });
    }

    // ── 강의 ─────────────────────────────────────────────────────────────────
    function listOpenCourses() {
        if (!useSupabase) return Promise.resolve(FALLBACK_COURSES.slice());
        return sb.from('courses')
            .select('*, course_options(*)')
            .eq('status', 'open')
            .order('sort_order', { ascending: true })
            .then(function (res) {
                if (res.error || !res.data || !res.data.length) {
                    if (res.error) console.warn('[IRUM] courses 조회 실패, 폴백 사용', res.error);
                    return FALLBACK_COURSES.slice();
                }
                return res.data.map(normalizeCourse);
            })
            .catch(function () { return FALLBACK_COURSES.slice(); });
    }

    function normalizeCourse(row) {
        var opts = (row.course_options || [])
            .filter(function (o) { return o.active !== false; })
            .sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); })
            .map(function (o) {
                return { name: o.name, label: o.description || o.name, price: o.price };
            });
        return Object.assign({}, row, { options: opts.length ? opts : FALLBACK_COURSES[0].options });
    }

    function getCourse(slug) {
        return listOpenCourses().then(function (list) {
            return list.filter(function (c) { return c.slug === slug; })[0] || list[0] || null;
        });
    }

    // ── 신청 ─────────────────────────────────────────────────────────────────
    function createApplication(data) {
        if (!currentUser) {
            return Promise.resolve({ ok: false, error: '로그인이 필요합니다.' });
        }

        if (!useSupabase) {
            var apps = lsRead(LS_APPS, []);
            var dup = apps.some(function (a) {
                return a.course_slug === data.course_slug &&
                       a.account_email === currentUser.email &&
                       a.status !== 'cancelled';
            });
            if (dup) return Promise.resolve({ ok: false, error: '이미 신청하신 과정입니다.' });

            apps.unshift({
                id: 'local-' + Date.now(),
                course_slug: data.course_slug,
                course_title: data.course_title,
                name: data.name,
                phone: data.phone,
                account_email: currentUser.email,
                organization: data.organization || '-',
                option_name: data.option_name,
                agreed_privacy: true,
                status: 'received',
                created_at: new Date().toISOString()
            });
            lsWrite(LS_APPS, apps);
            return Promise.resolve({ ok: true });
        }

        return sb.from('applications').insert({
            course_id: data.course_id,
            option_id: data.option_id || null,
            name: data.name,
            phone: data.phone,
            organization: data.organization || null,
            option_name: data.option_name,
            agreed_privacy: true
        }).then(function (res) {
            if (res.error) return { ok: false, error: humanError(res.error) };
            return { ok: true };
        });
    }

    // Postgres 트리거·제약이 던지는 에러를 사용자 문구로 바꾼다.
    function humanError(err) {
        var msg = (err && err.message) || '';
        if (err && err.code === '23505') return '이미 신청하신 과정입니다.';
        if (msg.indexOf('AUTH_REQUIRED') > -1) return '로그인이 필요합니다.';
        if (msg.indexOf('COURSE_CLOSED') > -1) return '현재 신청을 받지 않는 강의입니다.';
        if (msg.indexOf('APPLY_CLOSED') > -1) return '신청이 마감되었습니다.';
        if (msg.indexOf('APPLY_NOT_STARTED') > -1) return '아직 신청 기간이 아닙니다.';
        if (msg.indexOf('CAPACITY_FULL') > -1) return '정원이 마감되었습니다.';
        if (msg.indexOf('OPTION_INVALID') > -1) return '선택한 수강 옵션이 올바르지 않습니다.';
        console.error('[IRUM] 신청 실패', err);
        return '신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    }

    function listMyApplications() {
        if (!currentUser) return Promise.resolve([]);
        if (!useSupabase) {
            return Promise.resolve(lsRead(LS_APPS, []).filter(function (a) {
                return a.account_email === currentUser.email;
            }));
        }
        return sb.from('applications')
            .select('*, courses(title, slug)')
            .order('created_at', { ascending: false })
            .then(function (res) { return res.error ? [] : res.data.map(flattenApp); });
    }

    function listAllApplications() {
        if (!useSupabase) return Promise.resolve(lsRead(LS_APPS, []));
        return sb.from('applications')
            .select('*, courses(title, slug)')
            .order('created_at', { ascending: false })
            .then(function (res) {
                if (res.error) { console.error('[IRUM] 신청 조회 실패', res.error); return []; }
                return res.data.map(flattenApp);
            });
    }

    function flattenApp(row) {
        return Object.assign({}, row, {
            course_title: (row.courses && row.courses.title) || row.course_title || '강의',
            course_slug: (row.courses && row.courses.slug) || row.course_slug || ''
        });
    }

    function updateApplicationStatus(id, status) {
        if (!useSupabase) {
            var apps = lsRead(LS_APPS, []).map(function (a) {
                return a.id === id ? Object.assign({}, a, { status: status }) : a;
            });
            lsWrite(LS_APPS, apps);
            return Promise.resolve({ ok: true });
        }
        return sb.from('applications').update({ status: status }).eq('id', id)
            .then(function (res) {
                return res.error ? { ok: false, error: humanError(res.error) } : { ok: true };
            });
    }

    // ── CSV ──────────────────────────────────────────────────────────────────
    function toCsv(rows) {
        var head = ['신청일', '이름', '연락처', '이메일', '소속', '과정', '수강옵션', '상태'];
        var body = rows.map(function (a) {
            return [
                (a.created_at || '').slice(0, 10),
                a.name, a.phone, a.account_email,
                a.organization || '-',
                a.course_title || '',
                a.option_name || '',
                STATUS_LABEL[a.status] || a.status
            ];
        });
        // BOM 을 붙여야 Excel 이 UTF-8 한글을 깨지 않고 연다.
        return '﻿' + [head].concat(body)
            .map(function (r) {
                return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(',');
            })
            .join('\n');
    }

    function downloadCsv(rows, filename) {
        var blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename || 'applications.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    global.IRUM = {
        get mode() { return useSupabase ? 'supabase' : 'local'; },
        ready: init,
        getUser: function () { return currentUser; },
        isAdmin: isAdmin,
        signInWithGoogle: signInWithGoogle,
        signOut: signOut,
        listOpenCourses: listOpenCourses,
        getCourse: getCourse,
        createApplication: createApplication,
        listMyApplications: listMyApplications,
        listAllApplications: listAllApplications,
        updateApplicationStatus: updateApplicationStatus,
        downloadCsv: downloadCsv,
        STATUS_LABEL: STATUS_LABEL,
        STATUS_CLASS: STATUS_CLASS
    };

    init();
})(window);
