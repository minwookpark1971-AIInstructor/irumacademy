/**
 * Components JavaScript
 * Generates header and footer dynamically without AJAX
 * This allows the site to work with file:// protocol
 */

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

// Get user email
function getUserEmail() {
    return localStorage.getItem('userEmail') || '';
}

// Generate header HTML
function generateHeader() {
    const pathInfo = getPathInfo();
    const loggedIn = isLoggedIn();
    const userEmail = getUserEmail();
    
    // 로그인 상태에 따른 버튼 HTML 생성
    let desktopActions, mobileActions;
    if (loggedIn) {
        desktopActions = `
            <div class="desktop-actions">
                <span style="margin-right: 1rem; color: var(--text); font-size: 0.875rem;">${userEmail}</span>
                <button id="logout-btn-header" class="btn btn-outline btn-sm">로그아웃</button>
            </div>`;
        mobileActions = `
            <div class="mobile-actions">
                <div style="padding: 0.75rem; color: var(--text); font-size: 0.875rem; text-align: center; margin-bottom: 0.5rem;">${userEmail}</div>
                <button id="logout-btn-mobile" class="btn btn-outline btn-sm btn-block">로그아웃</button>
            </div>`;
    } else {
        desktopActions = `
            <div class="desktop-actions">
                <a href="${pathInfo.loginUrl}" class="btn btn-ghost btn-sm">로그인</a>
                <a href="${pathInfo.signupUrl}" class="btn btn-primary btn-sm">회원가입</a>
            </div>`;
        mobileActions = `
            <div class="mobile-actions">
                <a href="${pathInfo.loginUrl}" class="btn btn-ghost btn-sm btn-block">로그인</a>
                <a href="${pathInfo.signupUrl}" class="btn btn-primary btn-sm btn-block">회원가입</a>
            </div>`;
    }
    
    return `
<header class="main-header" id="main-header">
    <div class="container">
        <div class="header-content">
            <a href="${pathInfo.homeUrl}" class="logo">
                <img src="${pathInfo.logoUrl}" alt="Irum Academy" class="logo-image" style="height: 60px; width: auto; display: block;">
            </a>

            <!-- Desktop Navigation -->
            <nav class="desktop-nav">
                <a href="${pathInfo.coursesUrl}" class="nav-link">강의코스</a>
                <a href="${pathInfo.instructorUrl}" class="nav-link">전문강사 성장 프로그램</a>
                <a href="${pathInfo.applyUrl}" class="nav-link">강의신청하기</a>
                <a href="${pathInfo.communityUrl}" class="nav-link">강사커뮤니티</a>
                <a href="${pathInfo.inquiryUrl}" class="nav-link">문의하기</a>
            </nav>

            <!-- Desktop Actions -->
            ${desktopActions}

            <!-- Mobile Menu Button -->
            <button class="mobile-menu-toggle" id="mobile-menu-toggle" aria-label="메뉴 열기">
                <span class="menu-icon"></span>
                <span class="menu-icon"></span>
                <span class="menu-icon"></span>
            </button>
        </div>

        <!-- Mobile Navigation -->
        <nav class="mobile-nav" id="mobile-nav">
            <a href="${pathInfo.coursesUrl}" class="mobile-nav-link">강의코스</a>
            <a href="${pathInfo.instructorUrl}" class="mobile-nav-link">전문강사 성장 프로그램</a>
            <a href="${pathInfo.applyUrl}" class="mobile-nav-link">강의신청하기</a>
            <a href="${pathInfo.communityUrl}" class="mobile-nav-link">강사커뮤니티</a>
            <a href="${pathInfo.inquiryUrl}" class="mobile-nav-link">문의하기</a>
            ${mobileActions}
        </nav>
    </div>
    
    <!-- Header Indicator (for interaction demo) -->
    <div class="header-indicator" id="header-indicator"></div>
</header>`;
}

// Generate footer HTML
function generateFooter() {
    const pathInfo = getPathInfo();
    const currentYear = new Date().getFullYear();
    
    return `
<footer class="main-footer">
    <div class="container">
        <!-- CTA Section -->
        <div class="footer-cta">
            <h3 class="footer-cta-title">지금 바로 시작하세요</h3>
            <p class="footer-cta-description">
                AI 실무 역량 강화와 취업 전략을 한 번에, 지금 신청하고 성장하세요.
            </p>
            <div class="footer-cta-buttons">
                <a href="${pathInfo.applyUrl}" class="btn btn-primary btn-lg">강의신청하기</a>
                <a href="${pathInfo.coursesUrl}" class="btn btn-outline btn-lg">강의코스 보기</a>
            </div>
        </div>

        <!-- Bottom Section -->
        <div class="footer-bottom">
            <p class="footer-copyright" style="display: flex; align-items: center; line-height: 1.5; margin: 0; font-size: var(--font-size-sm); color: var(--text-muted);">
                © ${currentYear} Irum Academy. All rights reserved.
            </p>
            <div class="footer-contact" style="text-align: center; margin: 0; display: flex; align-items: center;">
                <div style="display: flex; flex-direction: row; gap: 9rem; align-items: center; justify-content: center; flex-wrap: wrap; color: var(--text-muted); font-size: var(--font-size-sm); line-height: 1.5;">
                    <div style="display: flex; align-items: center;">
                        <a href="mailto:irum.ceo@gmail.com" style="color: var(--text-muted); text-decoration: none; display: flex; align-items: center; line-height: 1.5;">
                            <span style="margin-right: 0.5rem;">✉</span>
                            irum.ceo@gmail.com
                        </a>
                    </div>
                    <div style="display: flex; align-items: center; line-height: 1.5;">
                        서울특별시 강남구 도산대로 54길 41
                    </div>
                </div>
            </div>
            <div class="footer-legal" style="margin: 0; display: flex; align-items: center;">
                <a href="${pathInfo.privacyUrl}" style="font-size: var(--font-size-sm); color: var(--text-muted); line-height: 1.5;">개인정보처리방침</a>
                <a href="${pathInfo.termsUrl}" style="font-size: var(--font-size-sm); color: var(--text-muted); line-height: 1.5;">이용약관</a>
            </div>
        </div>
    </div>
</footer>`;
}

// Get path information for current page
function getPathInfo() {
    const href = window.location.href;
    const pathname = window.location.pathname;
    const filename = pathname.split('/').pop() || 'index.html';
    
    // Normalize path separators for Windows
    const normalizedHref = href.replace(/\\/g, '/');
    const normalizedPathname = pathname.replace(/\\/g, '/');
    
    // Extract directory path
    const pathParts = normalizedPathname.split('/').filter(p => p);
    const htmlIndex = pathParts.indexOf('html');
    
    // Check if we're in root directory (index.html at root)
    const isRoot = (filename === 'index.html' && htmlIndex === -1) ||
                   (normalizedHref.endsWith('index.html') && htmlIndex === -1) ||
                   (normalizedPathname === '/' || normalizedPathname.endsWith('/')) ||
                   (normalizedHref.includes('file://') && htmlIndex === -1 && filename === 'index.html');
    
    // Check if we're in html folder
    const isInHtmlFolder = htmlIndex !== -1 && htmlIndex === pathParts.length - 2;
    
    // Check if we're in html subfolder (like html/auth/ or html/courses/)
    const isInHtmlSubfolder = htmlIndex !== -1 && htmlIndex < pathParts.length - 2;
    
    // Check if we're in auth folder
    const isInAuth = pathParts.includes('auth');
    
    // Determine relative paths based on current location
    let homeUrl, coursesUrl, instructorUrl, applyUrl, communityUrl, inquiryUrl, loginUrl, signupUrl, logoUrl, privacyUrl, termsUrl;
    
    if (isRoot) {
        // From root: html files are in html/ folder
        homeUrl = 'index.html';
        coursesUrl = 'html/courses.html';
        instructorUrl = 'html/instructor-growth.html';
        applyUrl = 'html/apply.html';
        communityUrl = 'html/community.html';
        inquiryUrl = 'html/inquiry.html';
        loginUrl = 'html/auth/login.html';
        signupUrl = 'html/auth/signup.html';
        logoUrl = 'images/logo/이룸아카데미_logo.png';
        privacyUrl = 'html/privacy.html';
        termsUrl = 'html/terms.html';
    } else if (isInAuth) {
        // From auth folder in html/: go up 2 levels to root, then to html/
        homeUrl = '../../index.html';
        coursesUrl = '../../html/courses.html';
        instructorUrl = '../../html/instructor-growth.html';
        applyUrl = '../../html/apply.html';
        communityUrl = '../../html/community.html';
        inquiryUrl = '../../html/inquiry.html';
        loginUrl = 'login.html';
        signupUrl = 'signup.html';
        logoUrl = '../../images/logo/이룸아카데미_logo.png';
        privacyUrl = '../privacy.html';
        termsUrl = '../terms.html';
    } else if (isInHtmlSubfolder) {
        // From html subfolder (like html/courses/): go up 1 level to html/
        const depth = pathParts.length - htmlIndex - 2;
        const upPath = '../'.repeat(depth);
        homeUrl = upPath + '../index.html';
        coursesUrl = upPath + 'courses.html';
        instructorUrl = upPath + 'instructor-growth.html';
        applyUrl = upPath + 'apply.html';
        communityUrl = upPath + 'community.html';
        inquiryUrl = upPath + 'inquiry.html';
        loginUrl = upPath + 'auth/login.html';
        signupUrl = upPath + 'auth/signup.html';
        logoUrl = upPath + '../images/logo/이룸아카데미_logo.png';
        privacyUrl = upPath + 'privacy.html';
        termsUrl = upPath + 'terms.html';
    } else if (isInHtmlFolder) {
        // From html folder: same level
        homeUrl = '../index.html';
        coursesUrl = 'courses.html';
        instructorUrl = 'instructor-growth.html';
        applyUrl = 'apply.html';
        communityUrl = 'community.html';
        inquiryUrl = 'inquiry.html';
        loginUrl = 'auth/login.html';
        signupUrl = 'auth/signup.html';
        logoUrl = '../images/logo/이룸아카데미_logo.png';
        privacyUrl = 'privacy.html';
        termsUrl = 'terms.html';
    } else {
        // Default: assume in html folder
        homeUrl = '../index.html';
        coursesUrl = 'courses.html';
        instructorUrl = 'instructor-growth.html';
        applyUrl = 'apply.html';
        communityUrl = 'community.html';
        inquiryUrl = 'inquiry.html';
        loginUrl = 'auth/login.html';
        signupUrl = 'auth/signup.html';
        logoUrl = '../images/logo/이룸아카데미_logo.png';
        privacyUrl = 'privacy.html';
        termsUrl = 'terms.html';
    }
    
    return {
        homeUrl: homeUrl,
        coursesUrl: coursesUrl,
        instructorUrl: instructorUrl,
        applyUrl: applyUrl,
        communityUrl: communityUrl,
        inquiryUrl: inquiryUrl,
        loginUrl: loginUrl,
        signupUrl: signupUrl,
        logoUrl: logoUrl,
        privacyUrl: privacyUrl,
        termsUrl: termsUrl
    };
}

// Update header login status
function updateHeaderLoginStatus() {
    const $headerContainer = $('#header-container');
    if ($headerContainer.length) {
        $headerContainer.html(generateHeader());
        // Initialize header after a short delay to ensure DOM is ready
        setTimeout(function() {
            if (typeof initHeader === 'function') {
                initHeader();
            }
            // 로그아웃 버튼 이벤트 바인딩
            bindLogoutButtons();
        }, 100);
    }
}

// Bind logout button events
function bindLogoutButtons() {
    // 로그아웃 함수가 있는지 확인
    if (typeof logout === 'function') {
        $('#logout-btn-header, #logout-btn-mobile').on('click', function(e) {
            e.preventDefault();
            logout();
        });
    } else {
        // auth.js가 로드되지 않은 경우 직접 처리
        $('#logout-btn-header, #logout-btn-mobile').on('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userName');
            localStorage.removeItem('authProvider');
            localStorage.removeItem('authMethod');
            // 헤더 업데이트
            updateHeaderLoginStatus();
            // 현재 페이지가 로그인/회원가입 페이지가 아니면 홈으로 이동
            const currentPath = window.location.pathname;
            if (!currentPath.includes('login.html') && !currentPath.includes('signup.html')) {
                const pathInfo = getPathInfo();
                window.location.href = pathInfo.homeUrl;
            }
        });
    }
}

// Load header and footer
function loadComponents() {
    const $headerContainer = $('#header-container');
    const $footerContainer = $('#footer-container');
    
    if ($headerContainer.length) {
        $headerContainer.html(generateHeader());
        // Initialize header after a short delay to ensure DOM is ready
        setTimeout(function() {
            if (typeof initHeader === 'function') {
                initHeader();
            }
            // 로그아웃 버튼 이벤트 바인딩
            bindLogoutButtons();
        }, 100);
    }
    
    if ($footerContainer.length) {
        $footerContainer.html(generateFooter());
    }
}

// Auto-load on document ready
$(document).ready(function() {
    loadComponents();
});

