/**
 * Components — 공통 헤더(GNB)/푸터
 * ax.irumcompany.co.kr 웹진 디자인 언어 기준 (css/tokens.css, css/webzine.css 필요).
 * AJAX 없이 문자열 주입이라 file:// 에서도 동작한다.
 *
 * 메뉴 모드
 *   - 앵커 모드(기본값): 메인 섹션 앵커(과정소개·커리큘럼·수강안내·강사·FAQ) + 회사소개
 *   - window.IRUM_ANCHOR_NAV = false 로 끄면 기존 페이지 링크(홈·회사소개·전문강사성장프로그램)
 *     메인에서는 #앵커, 다른 페이지에서는 index.html#앵커 로 연결한다.
 *     메인은 섹션이 없거나 숨겨져 있으면 해당 메뉴를 자동으로 숨긴다(window.IRUM_refreshNav).
 */

// 현재 페이지 위치에 따른 상대경로 계산
function getPathInfo() {
    const pathname = window.location.pathname.replace(/\\/g, '/');
    const href = window.location.href.replace(/\\/g, '/');
    const filename = pathname.split('/').pop() || 'index.html';

    const pathParts = pathname.split('/').filter(p => p);
    const htmlIndex = pathParts.indexOf('html');

    const isRoot = (filename === 'index.html' && htmlIndex === -1) ||
                   (href.endsWith('index.html') && htmlIndex === -1) ||
                   (pathname === '/' || pathname.endsWith('/')) ||
                   (href.includes('file://') && htmlIndex === -1 && filename === 'index.html');

    const isInHtmlFolder = htmlIndex !== -1 && htmlIndex === pathParts.length - 2;
    const isInHtmlSubfolder = htmlIndex !== -1 && htmlIndex < pathParts.length - 2;

    // 스테이징(/v2/index.html): 메인과 같은 화면이지만 한 단계 아래 폴더
    const inV2 = pathParts.length >= 2 && pathParts[pathParts.length - 2] === 'v2';

    // 루트 기준 상대 접두사: 루트에서는 'html/', html/ 안에서는 '', html/xxx/ 안에서는 '../'
    let toHtml, toRoot;
    if (inV2) {
        toHtml = '../html/';
        toRoot = '../';
    } else if (isRoot) {
        toHtml = 'html/';
        toRoot = '';
    } else if (isInHtmlSubfolder) {
        const depth = pathParts.length - htmlIndex - 2;
        toHtml = '../'.repeat(depth);
        toRoot = toHtml + '../';
    } else if (isInHtmlFolder) {
        toHtml = '';
        toRoot = '../';
    } else {
        toHtml = '';
        toRoot = '../';
    }

    return {
        homeUrl: toRoot + 'index.html',
        aboutUrl: toHtml + 'about.html',
        programsUrl: toHtml + 'instructor-growth.html',
        applyUrl: toHtml + 'apply.html',
        adminUrl: toHtml + 'admin.html',
        privacyUrl: toHtml + 'privacy.html',
        termsUrl: toHtml + 'terms.html',
        logoUrl: toRoot + 'images/logo/이룸아카데미_logo.png',
        filename: filename,
        isHome: isRoot || inV2
    };
}

// 메인 섹션 앵커 메뉴 (앵커 모드). 페이지가 window.IRUM_ANCHORS = [{id,label,always}] 로 바꿀 수 있다.
const ANCHOR_ITEMS = [
    { id: 'tracks',     label: '과정소개', always: true  },
    { id: 'curriculum', label: '커리큘럼', always: true  },
    { id: 'enroll',     label: '수강안내', always: true  },
    { id: 'instructor', label: '강사',     always: false },
    { id: 'faq',        label: 'FAQ',      always: false }
];

// 브랜드 마크 — "이룸" + 악센트 "아카데미" + 영문 라벨
function brandMarkup(href, extraClass) {
    return `<a href="${href}" class="gnb-brand${extraClass ? ' ' + extraClass : ''}" aria-label="이룸아카데미 홈"><b>이룸<em>아카데미</em></b><small>Irum Academy</small></a>`;
}

// 현재 페이지 판별 (aria-current)
function currentPage(pathInfo) {
    const f = pathInfo.filename;
    if (f === 'index.html' || f === '') return 'home';
    if (f === 'about.html') return 'about';
    if (f === 'instructor-growth.html') return 'programs';
    if (f === 'apply.html') return 'apply';
    return '';
}

function menuLinks(p, cur) {
    if (window.IRUM_ANCHOR_NAV === undefined) window.IRUM_ANCHOR_NAV = true;
    const mark = (key) => cur === key ? ' aria-current="page"' : '';
    if (window.IRUM_ANCHOR_NAV) {
        const base = p.isHome ? '' : p.homeUrl;
        return (window.IRUM_ANCHORS || ANCHOR_ITEMS).map(it =>
            `<a href="${base}#${it.id}" data-anchor="${it.id}"${(!p.isHome && !it.always) ? ' hidden' : ''}>${it.label}</a>`
        ).join('') + `<a href="${p.aboutUrl}"${mark('about')}>회사소개</a>`;
    }
    return `<a href="${p.homeUrl}"${mark('home')}>홈</a>` +
           `<a href="${p.aboutUrl}"${mark('about')}>회사소개</a>` +
           `<a href="${p.programsUrl}"${mark('programs')}>전문강사성장프로그램</a>`;
}

function generateHeader() {
    const p = getPathInfo();
    const cur = currentPage(p);
    const links = menuLinks(p, cur);
    const cta = `<a href="${p.applyUrl}"${cur === 'apply' ? ' aria-current="page"' : ''} class="btn btn-primary gnb-cta">강의 신청하기 →</a>`;

    // 신청 진입점은 CTA 버튼 하나뿐이다. 예전에는 같은 링크를 텍스트 메뉴로도
    // 함께 걸어 헤더에 "강의신청하기"가 두 번 보였다. aria-current 는 버튼이 넘겨받는다.
    return `
<a href="#main" class="skip-link">본문 바로가기</a>
<header class="gnb" id="gnb">
    <div class="gnb-inner">
        ${brandMarkup(p.homeUrl)}
        <nav class="gnb-menu" aria-label="주 메뉴">${links}</nav>
        ${cta}
        <button type="button" class="gnb-toggle" id="gnb-toggle" aria-expanded="false" aria-controls="gnb-drawer" aria-label="메뉴 열기"><span></span></button>
    </div>
    <nav class="gnb-drawer" id="gnb-drawer" aria-label="모바일 메뉴" hidden>
        ${links}
        ${cta}
    </nav>
</header>`;
}

function generateFooter() {
    const p = getPathInfo();
    const year = new Date().getFullYear();

    return `
<footer class="site-footer">
    <div class="wrap inner">
        ${brandMarkup(p.homeUrl)}
        <a href="${p.homeUrl}">홈</a>
        <a href="${p.aboutUrl}">회사소개</a>
        <a href="${p.programsUrl}">전문강사성장프로그램</a>
        <a href="${p.applyUrl}">강의신청하기</a>
        <!-- '강의코스'(courses.html) · '문의하기'(inquiry.html) 링크를 뺐다.
             전자는 더 이상 운영하지 않는 옛 AI 코스 9개를 노출했고,
             후자는 삭제된 회원가입 시스템으로 유도해 방문자를 막다른 길에 가뒀다.
             문의는 아래 이메일 주소가 받는다. -->
        <span class="family">
            <label for="family-site">FAMILY SITE</label>
            <select id="family-site" aria-label="패밀리 사이트 바로가기">
                <option value="">바로가기…</option>
                <option value="https://ax.irumcompany.co.kr/">AX 교육프로그램 웹진 (대학·기관)</option>
                <option value="https://keca.vercel.app/">KECA 한국교육컨설팅협회</option>
            </select>
        </span>
        <a href="${p.adminUrl}" class="admin-link">관리자 →</a>
        <!-- 사업자 정보는 전자상거래법상 표기 의무이자, 광고성 메일에 넣어야 하는
             법정 기재사항(발신자 명칭·주소·연락처)과 같은 값이다.
             ⚠ 바꿀 때는 여기만 고치면 안 된다 — html/privacy.html, 개인정보처리방침.txt,
                html/terms.html, 이용약관.txt, Supabase Secrets(SENDER_*)가 같은 값을 쓴다. -->
        <div class="legal" style="line-height:1.9">
            <div>
                <b style="font-weight:600">이룸아카데미</b> (상호: 이룸) ·
                대표 박민욱 ·
                사업자등록번호 532-56-00372
            </div>
            <div>
                서울특별시 강남구 도산대로54길 41, B1호(논현동) ·
                <a href="mailto:irum.ceo@gmail.com">irum.ceo@gmail.com</a>
            </div>
            <div style="margin-top:8px">
                © ${year} 이룸아카데미. ·
                <a href="${p.privacyUrl}">개인정보처리방침</a> ·
                <a href="${p.termsUrl}">이용약관</a>
            </div>
        </div>
    </div>
</footer>`;
}

// 하단 고정 신청 바 · 맨 위로 버튼
function generateExtras() {
    const p = getPathInfo();
    const noBar = ['apply.html', 'admin.html'].indexOf(p.filename) !== -1 || window.IRUM_NO_MOBILE_CTA === true;
    return (noBar ? '' : `<div class="mobile-cta"><a href="${p.applyUrl}" class="btn">강의 신청하기 →</a></div>`) +
           `<button type="button" class="to-top" id="to-top" aria-label="맨 위로">↑</button>`;
}

/** 메뉴 상호작용: 스크롤 축소 · 드로어 · 스크롤 스파이 · 맨 위로 · 패밀리 사이트 */
function initShell() {
    const gnb = document.getElementById('gnb');
    const toggle = document.getElementById('gnb-toggle');
    const drawer = document.getElementById('gnb-drawer');
    const toTop = document.getElementById('to-top');
    if (!gnb) return;

    // 본문 바로가기 대상
    const main = document.querySelector('main');
    if (main && !main.id) main.id = 'main';
    if (main) main.setAttribute('tabindex', '-1');

    const onScroll = () => {
        gnb.classList.toggle('is-scrolled', window.scrollY > 24);
        if (toTop) toTop.classList.toggle('is-visible', window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0 }));

    const closeDrawer = () => {
        if (!drawer || drawer.hidden) return;
        drawer.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', '메뉴 열기');
    };
    if (toggle && drawer) {
        toggle.addEventListener('click', () => {
            const open = drawer.hidden;
            drawer.hidden = !open;
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
        });
        drawer.addEventListener('click', (e) => { if (e.target.closest('a')) closeDrawer(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !drawer.hidden) { closeDrawer(); toggle.focus(); }
        });
        window.addEventListener('resize', () => { if (window.innerWidth > 980) closeDrawer(); });
    }

    const family = document.getElementById('family-site');
    if (family) {
        family.addEventListener('change', () => {
            if (family.value) window.open(family.value, '_blank', 'noopener');
            family.value = '';
        });
    }

    // 메인 전용: 앵커 메뉴 노출·강조 (섹션이 없거나 숨겨져 있으면 메뉴도 숨김)
    let observer = null;
    window.IRUM_refreshNav = function () {
        if (window.IRUM_ANCHOR_NAV === false || !getPathInfo().isHome) return;
        const links = document.querySelectorAll('[data-anchor]');
        const visible = [];
        links.forEach((a) => {
            const sec = document.getElementById(a.getAttribute('data-anchor'));
            const ok = !!sec && !sec.hidden && sec.offsetParent !== null;
            a.hidden = !ok;
            if (ok && visible.indexOf(sec) === -1) visible.push(sec);
        });
        if (observer) observer.disconnect();
        if (!('IntersectionObserver' in window)) return;
        observer = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (!en.isIntersecting) return;
                links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('data-anchor') === en.target.id));
            });
        }, { rootMargin: '-40% 0px -55% 0px' });
        visible.forEach((s) => observer.observe(s));
    };
    window.IRUM_refreshNav();
}

function loadComponents() {
    const header = document.getElementById('header-container');
    const footer = document.getElementById('footer-container');
    if (header) header.innerHTML = generateHeader();
    if (footer) footer.innerHTML = generateFooter();
    if (header) {
        const extras = document.createElement('div');
        extras.innerHTML = generateExtras();
        while (extras.firstChild) document.body.appendChild(extras.firstChild);
        if (document.querySelector('.mobile-cta')) document.body.classList.add('has-mobile-cta');
        initShell();
    }
}

document.addEventListener('DOMContentLoaded', loadComponents);
