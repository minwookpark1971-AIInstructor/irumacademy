/**
 * Components — 공통 헤더/푸터
 * Modernist 디자인 시스템 기준. AJAX 없이 문자열 주입이라 file:// 에서도 동작한다.
 * 마크업 출처: Claude Design "이룸아카데미 화면설계" 의 nav / footer
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

    // 루트 기준 상대 접두사: 루트에서는 'html/', html/ 안에서는 '', html/xxx/ 안에서는 '../'
    let toHtml, toRoot;
    if (isRoot) {
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
        filename: filename
    };
}

// 브랜드 마크 — "이룸" + 악센트 "아카데미"
function brandMarkup(href, extraClass) {
    return `<a href="${href}" class="nav-brand${extraClass ? ' ' + extraClass : ''}">이룸<em>아카데미</em></a>`;
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

function generateHeader() {
    const p = getPathInfo();
    const cur = currentPage(p);
    const mark = (key) => cur === key ? ' aria-current="page"' : '';

    return `
<nav class="nav" aria-label="주 메뉴">
    ${brandMarkup(p.homeUrl)}
    <a href="${p.homeUrl}"${mark('home')}>홈</a>
    <a href="${p.aboutUrl}"${mark('about')}>회사소개</a>
    <a href="${p.programsUrl}"${mark('programs')}>전문강사성장프로그램</a>
    <!-- 신청 진입점은 CTA 버튼 하나뿐이다. 예전에는 같은 링크를 텍스트 메뉴로도
         함께 걸어 헤더에 "강의신청하기"가 두 번 보였다. aria-current 는 버튼이 넘겨받는다. -->
    <a href="${p.applyUrl}"${mark('apply')} class="btn btn-primary" style="padding:9px 16px">강의 신청하기 →</a>
</nav>`;
}

function generateFooter() {
    const p = getPathInfo();
    const year = new Date().getFullYear();

    return `
<footer class="site-footer">
    <div class="wrap inner">
        ${brandMarkup(p.homeUrl).replace('class="nav-brand"', 'class="nav-brand" style="font-size:16px"')}
        <a href="${p.homeUrl}">홈</a>
        <a href="${p.aboutUrl}">회사소개</a>
        <a href="${p.programsUrl}">전문강사성장프로그램</a>
        <a href="${p.applyUrl}">강의신청하기</a>
        <!-- '강의코스'(courses.html) · '문의하기'(inquiry.html) 링크를 뺐다.
             전자는 더 이상 운영하지 않는 옛 AI 코스 9개를 노출했고,
             후자는 삭제된 회원가입 시스템으로 유도해 방문자를 막다른 길에 가뒀다.
             문의는 아래 이메일 주소가 받는다. -->
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

function loadComponents() {
    const header = document.getElementById('header-container');
    const footer = document.getElementById('footer-container');
    if (header) header.innerHTML = generateHeader();
    if (footer) footer.innerHTML = generateFooter();
}

document.addEventListener('DOMContentLoaded', loadComponents);
