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
 * ── 두 모드의 레코드 모양은 항상 같다 ──────────────────────────────────────
 * normalizeApp() / normalizeMember() 를 **양쪽 경로 모두** 통과시킨다.
 * 예전에는 local 경로가 raw 를 그대로 반환해서, supabase 모드에서만 CSV 이메일
 * 열이 비는 식의 "한쪽에서만 나는 버그"가 생겼다. 정규화 함수가 그 계약을 쥔다.
 * 값이 없으면 undefined 가 아니라 null / '' 로 채운다 — undefined 는 CSV·템플릿에서
 * "undefined" 라는 글자로 새어 나온다.
 */
(function (global) {
    'use strict';

    var cfg = global.IRUM_CONFIG || {};
    var useSupabase = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);

    var sb = null;
    var currentUser = null;
    var readyPromise = null;
    var adminCache = null;          // null = 아직 판정 전

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

    // ── 코드 → 표시 라벨 ─────────────────────────────────────────────────────
    // 화면·CSV·메일 세그먼트가 각자 하드코딩하면 반드시 어긋난다. 여기가 유일한 출처다.
    // DB 쪽 정본은 public.occupation / public.offline_pref 도메인이다.
    var JOB_LABEL = {
        instructor: '강사',
        aspiring: '강사희망자',
        other: '기타'
    };
    var OFFLINE_LABEL = {
        yes: '오프라인 참여 가능',
        online_only: '온라인만 참여',
        undecided: '미정'
    };
    var EMAIL_KIND = {
        notice: '안내',
        ad: '광고',
        test: '테스트'
    };

    // 시·도 1단. DB 의 public.regions 와 같은 내용이며 정본은 DB 다.
    // listRegions() 가 supabase 모드에서 DB 값으로 갱신한다.
    var REGIONS = [
        { code: 'seoul',     name: '서울특별시' },
        { code: 'busan',     name: '부산광역시' },
        { code: 'daegu',     name: '대구광역시' },
        { code: 'incheon',   name: '인천광역시' },
        { code: 'gwangju',   name: '광주광역시' },
        { code: 'daejeon',   name: '대전광역시' },
        { code: 'ulsan',     name: '울산광역시' },
        { code: 'sejong',    name: '세종특별자치시' },
        { code: 'gyeonggi',  name: '경기도' },
        { code: 'gangwon',   name: '강원특별자치도' },
        { code: 'chungbuk',  name: '충청북도' },
        { code: 'chungnam',  name: '충청남도' },
        { code: 'jeonbuk',   name: '전북특별자치도' },
        { code: 'jeonnam',   name: '전라남도' },
        { code: 'gyeongbuk', name: '경상북도' },
        { code: 'gyeongnam', name: '경상남도' },
        { code: 'jeju',      name: '제주특별자치도' },
        { code: 'overseas',  name: '기타 / 해외' }
    ];

    function regionLabel(code) {
        for (var i = 0; i < REGIONS.length; i++) {
            if (REGIONS[i].code === code) return REGIONS[i].name;
        }
        return code || '';
    }

    // ── 폴백 강의 카탈로그 ───────────────────────────────────────────────────
    // Supabase 가 붙기 전, 그리고 DB 응답이 실패했을 때 화면이 비지 않도록 하는 기본값.
    // 실제 운영 데이터는 courses 테이블이 소유한다.
    //
    // ⚠ 옵션에 id 가 반드시 있어야 한다. 없으면 local 모드에서 option_id 가
    //   undefined 가 되어 신청 레코드가 어떤 옵션인지 잃어버린다.
    var FALLBACK_COURSES = [{
        id: 'fallback-ai-automation-vibecoding-2026h2',
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
            { id: 'fallback-opt-basic', name: '기초', label: '기초 (8.8~8.29) · 30만원', price: 300000 },
            { id: 'fallback-opt-adv',   name: '심화', label: '심화 (9.2~9.19) · 30만원', price: 300000 },
            { id: 'fallback-opt-all',   name: '전체', label: '전체 · 50만원 (KECA 20% 할인)', price: 500000 }
        ]
    }];

    // ── 로컬 모드 저장소 ─────────────────────────────────────────────────────
    var LS_APPS = 'irum:applications';
    var LS_USER = 'irum:user';
    var LS_PROFILE = 'irum:profile';

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

    // ── supabase 전용 기능 가드 ──────────────────────────────────────────────
    // local 모드에서 메일 발송 같은 기능이 조용히 "성공"을 반환하면
    // "보냈는데 안 왔다"는 최악의 오해를 만든다. 시끄럽게 거부한다.
    function requireSupabase(what) {
        if (useSupabase) return null;
        var msg = '[IRUM] ' + what + ' 은(는) local 모드에서 동작하지 않습니다. ' +
                  'js/config.js 에 Supabase URL·anon key 를 채우세요.';
        console.error(msg);
        return { ok: false, error: what + ' 은(는) Supabase 설정 후에만 사용할 수 있습니다.' };
    }

    // supabase-js 는 설정이 채워졌을 때만 받아온다. 로컬 모드에서 쓰지도 않을
    // 130KB 를 모든 페이지가 내려받게 하지 않기 위해서다.
    //
    // 버전은 정확히 고정한다 — '@2' 같은 범위 지정은 업스트림이 회귀하면
    // 아무도 배포하지 않았는데 사이트가 죽는다.
    //
    // ⚠ integrity 는 선택이 아니다. 이 스크립트는 로그인 세션 토큰을 다룬다.
    //   CDN 이 침해되면 전 회원의 세션이 공격자에게 넘어간다. 해시가 어긋나면
    //   브라우저가 실행 자체를 거부하고, 아래 onerror 가 local 모드로 되돌린다.
    //   ⚠ 버전을 올릴 때 integrity 도 반드시 같이 갱신해야 한다:
    //      curl -sL <URL> | openssl dgst -sha384 -binary | openssl base64 -A
    var SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.58.0/dist/umd/supabase.js';
    var SDK_SRI = 'sha384-KX6Y/AMIv9qA8TLCDul2JatZWeyrJVgj3Xu/0r30Nr05xO8md1+wHAgtdsRV9LoE';

    function loadSdk() {
        if (global.supabase && global.supabase.createClient) return Promise.resolve(true);
        return new Promise(function (resolve) {
            var s = document.createElement('script');
            s.src = SDK_URL;
            s.integrity = SDK_SRI;
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
                console.warn('[IRUM] local 모드로 동작합니다. 신청 데이터는 이 브라우저에만 저장되며 ' +
                             '관리자가 볼 수 없고, 권한 검증도 동작하지 않습니다.');
                currentUser = lsRead(LS_USER, null);
                resolve();
                return;
            }

            loadSdk().then(function (ok) {
            if (!ok) {
                console.error('[IRUM] supabase-js 를 불러오지 못했습니다 (네트워크 또는 SRI 불일치). ' +
                              '로컬 모드로 되돌립니다.');
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
                    adminCache = null;      // 계정이 바뀌면 권한 판정을 다시 한다
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
        adminCache = null;
        if (!useSupabase) {
            currentUser = null;
            try { localStorage.removeItem(LS_USER); } catch (e) {}
            return Promise.resolve();
        }
        return sb.auth.signOut().then(function () { currentUser = null; });
    }

    /**
     * 관리자 여부.
     *
     * ⚠⚠ 이 값은 UI 힌트일 뿐 보안 경계가 아니다.
     *     네트워크 응답을 조작해 true 를 만들면 관리자 "화면"은 열리지만,
     *     그 화면이 요청하는 데이터는 전부 Postgres RLS 가 막는다.
     *     화면이 열리는 것과 데이터가 보이는 것은 별개다.
     *
     * 예전 구현은 "applications 를 읽을 수 있으면 관리자"로 판정했다.
     * RLS 가 '본인 건 select 허용'인 이상 일반 회원도 통과한다 — 설계상 뚫려 있었다.
     * 이제는 admins 테이블을 SECURITY DEFINER 로 읽는 RPC 하나만 신뢰한다.
     */
    function isAdmin() {
        if (!currentUser) return Promise.resolve(false);
        if (!useSupabase) {
            // 로컬 모드에는 권한 개념이 없다. 화면 확인 목적으로만 통과시킨다.
            console.warn('[IRUM] local 모드에서는 isAdmin() 이 무조건 true 입니다. ' +
                         '이 상태로 배포하면 관리자 화면이 누구에게나 열립니다.');
            return Promise.resolve(true);
        }
        if (adminCache !== null) return Promise.resolve(adminCache);

        return sb.rpc('is_admin')
            .then(function (res) {
                if (res.error) {
                    console.error('[IRUM] 권한 판정 실패', res.error);
                    adminCache = false;
                    return false;
                }
                adminCache = res.data === true;
                return adminCache;
            })
            .catch(function () { adminCache = false; return false; });
    }

    // ── 지역 ─────────────────────────────────────────────────────────────────
    function listRegions() {
        if (!useSupabase) return Promise.resolve(REGIONS.slice());
        return sb.from('regions').select('code, name')
            .eq('active', true)
            .order('sort_order', { ascending: true })
            .then(function (res) {
                if (res.error || !res.data || !res.data.length) return REGIONS.slice();
                REGIONS = res.data;      // 라벨 조회가 DB 와 어긋나지 않도록 갱신
                return res.data.slice();
            })
            .catch(function () { return REGIONS.slice(); });
    }

    // ── 강의 ─────────────────────────────────────────────────────────────────
    function normalizeCourse(row) {
        var opts = (row.course_options || [])
            .filter(function (o) { return o.active !== false; })
            .sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); })
            .map(function (o) {
                // ⚠ id 를 반드시 보존한다. 여기서 버리면 신청 레코드의 option_id 가
                //   영원히 null 이 된다 (apply.html · createApplication 과 3단 연쇄).
                return {
                    id: o.id,
                    name: o.name,
                    label: o.description || o.name,
                    price: o.price == null ? 0 : o.price
                };
            });
        return Object.assign({}, row, {
            options: opts.length ? opts : FALLBACK_COURSES[0].options
        });
    }

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

    /**
     * 관리자용 — draft·closed 를 포함한 전체 강의.
     * 관리자 화면이 listOpenCourses() 를 쓰면 "draft→open→closed 를 관리한다"는
     * 안내와 실제로 보이는 목록이 어긋난다.
     */
    function listAllCourses() {
        if (!useSupabase) return Promise.resolve(FALLBACK_COURSES.slice());
        return sb.from('courses')
            .select('*, course_options(*)')
            .order('sort_order', { ascending: true })
            .then(function (res) {
                if (res.error) { console.error('[IRUM] 강의 조회 실패', res.error); return []; }
                return (res.data || []).map(normalizeCourse);
            });
    }

    function getCourse(slug) {
        return listOpenCourses().then(function (list) {
            return list.filter(function (c) { return c.slug === slug; })[0] || list[0] || null;
        });
    }

    function createCourse(data) {
        var guard = requireSupabase('강의 등록');
        if (guard) return Promise.resolve(guard);
        return sb.from('courses').insert(data).select().single()
            .then(function (res) {
                return res.error ? { ok: false, error: humanError(res.error) }
                                 : { ok: true, course: res.data };
            });
    }

    function updateCourse(id, patch) {
        var guard = requireSupabase('강의 수정');
        if (guard) return Promise.resolve(guard);
        // slug 는 생성 후 변경 금지다. ?course=slug 링크와 sessionStorage 가 참조하므로
        // 바꾸면 이미 공유된 신청 링크가 죽는다.
        if (patch && Object.prototype.hasOwnProperty.call(patch, 'slug')) {
            delete patch.slug;
        }
        return sb.from('courses').update(patch).eq('id', id)
            .then(function (res) {
                return res.error ? { ok: false, error: humanError(res.error) } : { ok: true };
            });
    }

    function setCourseStatus(id, status) {
        return updateCourse(id, { status: status });
    }

    /**
     * 옵션 일괄 저장. 화면에서 지운 옵션은 삭제하지 않고 active=false 로 내린다.
     * 하드 삭제하면 그 옵션으로 접수된 과거 신청의 참조가 깨진다.
     */
    function saveCourseOptions(courseId, options) {
        var guard = requireSupabase('수강 옵션 저장');
        if (guard) return Promise.resolve(guard);

        var keep = (options || []).map(function (o) { return o.name; });

        return sb.from('course_options')
            .upsert((options || []).map(function (o, i) {
                return {
                    id: o.id || undefined,
                    course_id: courseId,
                    name: o.name,
                    description: o.label || o.description || o.name,
                    price: o.price || 0,
                    sort_order: (i + 1) * 10,
                    active: true
                };
            }), { onConflict: 'course_id,name' })
            .then(function (res) {
                if (res.error) return { ok: false, error: humanError(res.error) };
                if (!keep.length) return { ok: true };
                return sb.from('course_options')
                    .update({ active: false })
                    .eq('course_id', courseId)
                    .not('name', 'in', '(' + keep.map(function (n) {
                        return '"' + String(n).replace(/"/g, '') + '"';
                    }).join(',') + ')')
                    .then(function () { return { ok: true }; });
            });
    }

    // ── 신청 ─────────────────────────────────────────────────────────────────
    /**
     * 신청 레코드 정규화. **local · supabase 두 경로 모두** 이걸 통과한다.
     * 두 모드의 키 집합이 항상 같다는 계약을 이 함수 하나가 보장한다.
     */
    function normalizeApp(row) {
        row = row || {};
        var courses = row.courses || {};
        return {
            id: row.id == null ? '' : row.id,
            user_id: row.user_id || null,
            created_at: row.created_at || '',
            status: row.status || 'received',

            course_id: row.course_id || null,
            course_slug: courses.slug || row.course_slug || '',
            course_title: courses.title || row.course_title || '강의',

            option_id: row.option_id || null,
            option_name: row.option_name || '',
            option_price: row.option_price == null ? null : row.option_price,

            name: row.name || '',
            phone: row.phone || '',
            account_email: row.account_email || '',
            contact_email: row.contact_email || row.account_email || '',
            organization: row.organization || '',

            occupation: row.occupation || '',
            occupation_label: JOB_LABEL[row.occupation] || '',
            region_code: row.region_code || '',
            region_label: regionLabel(row.region_code),
            offline_available: row.offline_available || '',
            offline_label: OFFLINE_LABEL[row.offline_available] || '',

            agreed_privacy: !!row.agreed_privacy,
            agreed_privacy_at: row.agreed_privacy_at || '',
            agreed_marketing: !!row.agreed_marketing,
            agreed_marketing_at: row.agreed_marketing_at || ''
        };
    }

    function createApplication(data) {
        if (!currentUser) {
            return Promise.resolve({ ok: false, error: '로그인이 필요합니다.' });
        }
        data = data || {};

        var contactEmail = String(data.contact_email || currentUser.email || '')
                             .trim().toLowerCase();

        if (!useSupabase) {
            var apps = lsRead(LS_APPS, []);
            var dup = apps.some(function (a) {
                return a.course_slug === data.course_slug &&
                       a.account_email === currentUser.email &&
                       a.status !== 'cancelled';
            });
            if (dup) return Promise.resolve({ ok: false, error: '이미 신청하신 과정입니다.' });

            var now = new Date().toISOString();
            apps.unshift(normalizeApp({
                id: 'local-' + Date.now(),
                user_id: currentUser.id,
                course_id: data.course_id || null,
                course_slug: data.course_slug,
                course_title: data.course_title,
                option_id: data.option_id || null,
                option_name: data.option_name,
                option_price: data.option_price,
                name: data.name,
                phone: data.phone,
                account_email: currentUser.email,
                contact_email: contactEmail,
                organization: data.organization,
                occupation: data.occupation,
                region_code: data.region_code,
                offline_available: data.offline_available,
                agreed_privacy: !!data.agreed_privacy,
                agreed_privacy_at: data.agreed_privacy ? now : '',
                agreed_marketing: !!data.agreed_marketing,
                agreed_marketing_at: data.agreed_marketing ? now : '',
                status: 'received',
                created_at: now
            }));
            lsWrite(LS_APPS, apps);

            // local 모드에도 프로필 최신값을 유지해 두어야 마이페이지·재신청 prefill 이
            // supabase 모드와 같은 코드로 동작한다.
            lsWrite(LS_PROFILE, normalizeMember({
                id: currentUser.id,
                account_email: currentUser.email,
                contact_email: contactEmail,
                name: data.name,
                phone: data.phone,
                occupation: data.occupation,
                region_code: data.region_code,
                offline_available: data.offline_available,
                marketing_opt_in: !!data.agreed_marketing,
                marketing_opt_in_at: data.agreed_marketing ? now : ''
            }));

            return Promise.resolve({ ok: true });
        }

        // course_title · option_name · option_price · account_email · user_id · status 는
        // 서버의 BEFORE INSERT 트리거가 권위 있게 채운다. 여기서 보내는 값은
        // 트리거가 덮어쓰므로 위조 위험이 없고, 두 모드의 모양을 맞추는 역할만 한다.
        return sb.from('applications').insert({
            course_id: data.course_id,
            option_id: data.option_id || null,
            name: data.name,
            phone: data.phone,
            account_email: currentUser.email,
            contact_email: contactEmail,
            organization: data.organization || null,
            occupation: data.occupation || null,
            region_code: data.region_code || null,
            offline_available: data.offline_available || null,
            agreed_privacy: !!data.agreed_privacy,
            agreed_marketing: !!data.agreed_marketing
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
        if (msg.indexOf('FORBIDDEN') > -1) return '권한이 없습니다.';
        if (msg.indexOf('COURSE_CLOSED') > -1) return '현재 신청을 받지 않는 강의입니다.';
        if (msg.indexOf('APPLY_CLOSED') > -1) return '신청이 마감되었습니다.';
        if (msg.indexOf('APPLY_NOT_STARTED') > -1) return '아직 신청 기간이 아닙니다.';
        if (msg.indexOf('CAPACITY_FULL') > -1) return '정원이 마감되었습니다.';
        if (msg.indexOf('OPTION_INVALID') > -1) return '선택한 수강 옵션이 올바르지 않습니다.';
        if (msg.indexOf('applications_privacy_required') > -1) return '개인정보 수집·이용 동의가 필요합니다.';
        if (msg.indexOf('email_logs_ad_prefix') > -1 ||
            msg.indexOf('email_campaigns_ad_prefix') > -1) {
            return '광고성 메일의 제목은 "(광고)" 로 시작해야 합니다.';
        }
        console.error('[IRUM] 요청 실패', err);
        return '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    }

    function listMyApplications() {
        if (!currentUser) return Promise.resolve([]);
        if (!useSupabase) {
            return Promise.resolve(lsRead(LS_APPS, [])
                .filter(function (a) { return a.account_email === currentUser.email; })
                .map(normalizeApp));
        }
        // 어느 행이 보이는지는 RLS 가 정한다. 여기서 user_id 로 한 번 더 좁히는 이유는
        // 관리자 계정으로 마이페이지를 열었을 때 전 회원 신청이 쏟아지지 않게 하기 위해서다.
        return sb.from('applications')
            .select('*, courses(title, slug)')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .then(function (res) {
                if (res.error) { console.error('[IRUM] 내 신청 조회 실패', res.error); return []; }
                return (res.data || []).map(normalizeApp);
            });
    }

    function listAllApplications() {
        if (!useSupabase) return Promise.resolve(lsRead(LS_APPS, []).map(normalizeApp));
        return sb.from('applications')
            .select('*, courses(title, slug)')
            .order('created_at', { ascending: false })
            .then(function (res) {
                if (res.error) { console.error('[IRUM] 신청 조회 실패', res.error); return []; }
                return (res.data || []).map(normalizeApp);
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

    // ── 회원 ─────────────────────────────────────────────────────────────────
    function normalizeMember(row) {
        row = row || {};
        return {
            id: row.id || '',
            account_email: row.account_email || '',
            contact_email: row.contact_email || row.account_email || '',
            name: row.name || '',
            phone: row.phone || '',

            occupation: row.occupation || '',
            occupation_label: JOB_LABEL[row.occupation] || '',
            region_code: row.region_code || '',
            region_label: regionLabel(row.region_code),
            offline_available: row.offline_available || '',
            offline_label: OFFLINE_LABEL[row.offline_available] || '',

            marketing_opt_in: !!row.marketing_opt_in,
            marketing_opt_in_at: row.marketing_opt_in_at || '',
            marketing_opt_out_at: row.marketing_opt_out_at || '',

            application_count: row.application_count == null ? 0 : row.application_count,
            created_at: row.created_at || ''
        };
    }

    function getProfile() {
        if (!currentUser) return Promise.resolve(null);
        if (!useSupabase) {
            var p = lsRead(LS_PROFILE, null);
            return Promise.resolve(p ? normalizeMember(p) : normalizeMember({
                id: currentUser.id,
                account_email: currentUser.email,
                name: currentUser.name
            }));
        }
        return sb.from('profiles').select('*').eq('id', currentUser.id).maybeSingle()
            .then(function (res) {
                if (res.error) { console.error('[IRUM] 프로필 조회 실패', res.error); return null; }
                return res.data ? normalizeMember(res.data) : null;
            });
    }

    function updateProfile(patch) {
        if (!currentUser) return Promise.resolve({ ok: false, error: '로그인이 필요합니다.' });
        if (!useSupabase) {
            var cur = lsRead(LS_PROFILE, {}) || {};
            lsWrite(LS_PROFILE, Object.assign({}, cur, patch));
            return Promise.resolve({ ok: true });
        }
        // account_email 은 서버 트리거가 되돌린다. 보내지 않는 편이 의도가 분명하다.
        var safe = Object.assign({}, patch);
        delete safe.account_email;
        delete safe.id;
        delete safe.marketing_opt_in;   // 동의 변경은 setMarketingConsent 만 쓴다

        return sb.from('profiles').update(safe).eq('id', currentUser.id)
            .then(function (res) {
                return res.error ? { ok: false, error: humanError(res.error) } : { ok: true };
            });
    }

    /**
     * 광고성 정보 수신동의 변경.
     * 동의·철회 사실은 증빙 테이블에도 남긴다 — 입증 책임이 사업자에게 있다.
     */
    function setMarketingConsent(optIn, source) {
        if (!currentUser) return Promise.resolve({ ok: false, error: '로그인이 필요합니다.' });
        if (!useSupabase) {
            var cur = lsRead(LS_PROFILE, {}) || {};
            cur.marketing_opt_in = !!optIn;
            cur[optIn ? 'marketing_opt_in_at' : 'marketing_opt_out_at'] = new Date().toISOString();
            lsWrite(LS_PROFILE, cur);
            return Promise.resolve({ ok: true });
        }

        return sb.from('profiles')
            .update({ marketing_opt_in: !!optIn })
            .eq('id', currentUser.id)
            .then(function (res) {
                if (res.error) return { ok: false, error: humanError(res.error) };
                return sb.from('marketing_consent_log').insert({
                    user_id: currentUser.id,
                    email: currentUser.email,
                    action: optIn ? 'opt_in' : 'opt_out',
                    source: source || 'mypage'
                }).then(function () { return { ok: true }; });
            });
    }

    /**
     * 관리자용 회원 목록.
     * 필터는 클라이언트가 건다 — 이 목록이 그대로 메일 발송 모수가 되므로,
     * 관리자가 화면에서 본 건수와 실제 발송 대상이 반드시 같아야 한다.
     */
    function listMembers() {
        if (!useSupabase) {
            var p = lsRead(LS_PROFILE, null);
            return Promise.resolve(p ? [normalizeMember(p)] : []);
        }
        return Promise.all([
            sb.from('profiles').select('*').order('created_at', { ascending: false }),
            sb.from('applications').select('user_id')
        ]).then(function (r) {
            if (r[0].error) { console.error('[IRUM] 회원 조회 실패', r[0].error); return []; }

            var counts = {};
            ((r[1] && r[1].data) || []).forEach(function (a) {
                counts[a.user_id] = (counts[a.user_id] || 0) + 1;
            });

            return (r[0].data || []).map(function (row) {
                return normalizeMember(Object.assign({}, row, {
                    application_count: counts[row.id] || 0
                }));
            });
        });
    }

    function getMember(id) {
        if (!useSupabase) return getProfile();
        return sb.from('profiles').select('*').eq('id', id).maybeSingle()
            .then(function (res) {
                return res.error || !res.data ? null : normalizeMember(res.data);
            });
    }

    // ── 메일 ─────────────────────────────────────────────────────────────────
    /**
     * 메일 발송 요청. 실제 SMTP 는 치지 않는다 — Edge Function 이 큐에 넣고
     * 별도 워커가 보낸다. 여기서 성공은 "큐에 들어갔다"는 뜻이다.
     *
     * @param {object} payload
     *   kind        'notice' | 'ad' | 'test'
     *   subject     제목. kind='ad' 이면 '(광고)' 로 시작해야 한다 (DB CHECK 로도 강제됨)
     *   body        플레인 텍스트. {{이름}} 치환 지원
     *   recipients  [{ email, name, user_id }]  ← 클라이언트가 계산해 넘긴다
     *   dedupeKey   같은 요청의 재시도를 서버가 한 건으로 취급하게 하는 키
     *
     * 왜 수신자를 클라이언트가 넘기는가: 서버가 세그먼트로 다시 쿼리하면
     * 관리자가 미리보기에서 본 41명과 실제 발송된 42명이 달라진다(그 사이 신규 가입).
     * 광고 메일에서 이 불일치는 사고다.
     *
     * ⚠ 그렇다고 서버가 이 명단을 그대로 믿지는 않는다. Edge Function 이
     *   ① JWT 로 관리자를 재판정하고 ② kind='ad' 면 각 수신자의 수신동의를
     *   DB 에서 재확인한다. 그러지 않으면 anon key 를 가진 누구나
     *   이룸아카데미 이름으로 전 회원에게 스팸을 쏠 수 있다.
     */
    function sendEmail(payload) {
        var guard = requireSupabase('메일 발송');
        if (guard) return Promise.resolve(guard);

        payload = payload || {};
        if (payload.kind === 'ad' && String(payload.subject || '').indexOf('(광고)') !== 0) {
            return Promise.resolve({
                ok: false,
                error: '광고성 메일의 제목은 "(광고)" 로 시작해야 합니다.'
            });
        }

        return sb.functions.invoke('send-email', { body: payload })
            .then(function (res) {
                if (res.error) {
                    console.error('[IRUM] 메일 발송 실패', res.error);
                    return { ok: false, error: '메일 발송 요청에 실패했습니다.' };
                }
                return Object.assign({ ok: true }, res.data || {});
            });
    }

    function listEmailLogs(campaignId) {
        if (!useSupabase) return Promise.resolve([]);
        var q = sb.from('email_logs').select('*').order('created_at', { ascending: false });
        if (campaignId) q = q.eq('campaign_id', campaignId);
        return q.then(function (res) {
            if (res.error) { console.error('[IRUM] 메일 이력 조회 실패', res.error); return []; }
            return res.data || [];
        });
    }

    function listEmailBatches() {
        if (!useSupabase) return Promise.resolve([]);
        return sb.from('email_campaigns').select('*')
            .order('created_at', { ascending: false })
            .then(function (res) {
                if (res.error) { console.error('[IRUM] 캠페인 조회 실패', res.error); return []; }
                // kind='test' 는 통계에서 분리한다. 안 하면 발송 건수가 오염된다.
                return res.data || [];
            });
    }

    // 수신거부는 Edge Function 이 HTML 을 직접 반환한다 (정적 페이지를 두지 않는다).
    // 메일 앱 내장 브라우저에서 JS 가 꺼져 있어도 동작해야 하고, 링크 도메인과
    // 처리 주체가 갈리면 안 되기 때문이다. 따라서 이 모듈에는 대응 API 가 없다.

    // ── CSV ──────────────────────────────────────────────────────────────────
    // 표에 보이는 것과 CSV 열이 어긋나면 "다운로드했는데 그 열이 없다"가 된다.
    // 종류별 스키마를 한곳에 둔다.
    var CSV_SCHEMA = {
        applications: [
            ['신청일',    function (r) { return (r.created_at || '').slice(0, 10); }],
            ['이름',      function (r) { return r.name; }],
            ['연락처',    function (r) { return r.phone; }],
            ['이메일',    function (r) { return r.contact_email; }],
            ['계정이메일', function (r) { return r.account_email; }],
            ['소속',      function (r) { return r.organization; }],
            ['과정',      function (r) { return r.course_title; }],
            ['수강옵션',  function (r) { return r.option_name; }],
            ['직업',      function (r) { return r.occupation_label; }],
            ['지역',      function (r) { return r.region_label; }],
            ['오프라인',  function (r) { return r.offline_label; }],
            ['광고동의',  function (r) { return r.agreed_marketing ? 'Y' : 'N'; }],
            ['상태',      function (r) { return STATUS_LABEL[r.status] || r.status; }]
        ],
        members: [
            ['가입일',    function (r) { return (r.created_at || '').slice(0, 10); }],
            ['이름',      function (r) { return r.name; }],
            ['연락처',    function (r) { return r.phone; }],
            ['이메일',    function (r) { return r.contact_email; }],
            ['계정이메일', function (r) { return r.account_email; }],
            ['직업',      function (r) { return r.occupation_label; }],
            ['지역',      function (r) { return r.region_label; }],
            ['오프라인',  function (r) { return r.offline_label; }],
            ['신청수',    function (r) { return r.application_count; }],
            ['광고동의',  function (r) { return r.marketing_opt_in ? 'Y' : 'N'; }],
            ['동의일시',  function (r) { return (r.marketing_opt_in_at || '').slice(0, 10); }]
        ],
        email_logs: [
            ['발송일',    function (r) { return (r.created_at || '').slice(0, 10); }],
            ['종류',      function (r) { return EMAIL_KIND[r.kind] || r.kind; }],
            ['수신',      function (r) { return r.to_email; }],
            ['제목',      function (r) { return r.subject; }],
            ['상태',      function (r) { return r.status; }],
            ['완료시각',  function (r) { return r.sent_at || ''; }],
            ['오류',      function (r) { return r.error || ''; }]
        ]
    };

    function toCsv(rows, kind) {
        var schema = CSV_SCHEMA[kind] || CSV_SCHEMA.applications;
        var head = schema.map(function (c) { return c[0]; });
        var body = (rows || []).map(function (r) {
            return schema.map(function (c) {
                var v = c[1](r);
                return v == null ? '' : v;
            });
        });
        // BOM 을 붙여야 Excel 이 UTF-8 한글을 깨지 않고 연다.
        return '﻿' + [head].concat(body)
            .map(function (r) {
                return r.map(function (c) {
                    return '"' + String(c).replace(/"/g, '""') + '"';
                }).join(',');
            })
            .join('\r\n');
    }

    function downloadCsv(rows, filename, kind) {
        var blob = new Blob([toCsv(rows, kind)], { type: 'text/csv;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename || 'irum-export.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    // ── 공개 API ─────────────────────────────────────────────────────────────
    global.IRUM = {
        get mode() { return useSupabase ? 'supabase' : 'local'; },
        ready: init,

        // 인증
        getUser: function () { return currentUser; },
        isAdmin: isAdmin,
        signInWithGoogle: signInWithGoogle,
        signOut: signOut,

        // 강의
        listOpenCourses: listOpenCourses,
        listAllCourses: listAllCourses,
        getCourse: getCourse,
        createCourse: createCourse,
        updateCourse: updateCourse,
        setCourseStatus: setCourseStatus,
        saveCourseOptions: saveCourseOptions,

        // 신청
        createApplication: createApplication,
        listMyApplications: listMyApplications,
        listAllApplications: listAllApplications,
        updateApplicationStatus: updateApplicationStatus,

        // 회원
        getProfile: getProfile,
        updateProfile: updateProfile,
        setMarketingConsent: setMarketingConsent,
        listMembers: listMembers,
        getMember: getMember,

        // 메일
        sendEmail: sendEmail,
        listEmailLogs: listEmailLogs,
        listEmailBatches: listEmailBatches,

        // 조회·상수
        listRegions: listRegions,
        downloadCsv: downloadCsv,
        // getter 로 노출한다. listRegions() 가 DB 값으로 REGIONS 를 갈아끼우는데
        // 값을 그대로 붙여두면 소비자가 갱신 전의 배열을 계속 붙들고 있게 된다.
        get REGIONS() { return REGIONS.slice(); },
        JOB_LABEL: JOB_LABEL,
        OFFLINE_LABEL: OFFLINE_LABEL,
        EMAIL_KIND: EMAIL_KIND,
        STATUS_LABEL: STATUS_LABEL,
        STATUS_CLASS: STATUS_CLASS
    };

    init();
})(window);
