/**
 * OAuth Configuration
 * 각 SNS의 OAuth 설정을 여기에 입력하세요.
 * 
 * 설정 방법:
 * 
 * 1. Google OAuth 설정:
 *    - https://console.cloud.google.com/ 접속
 *    - 프로젝트 생성 또는 선택
 *    - APIs & Services > Credentials 이동
 *    - Create Credentials > OAuth client ID 선택
 *    - Application type: Web application 선택
 *    - Authorized redirect URIs에 콜백 URL 추가 (예: http://localhost:3000/auth/google/callback)
 *    - Client ID를 아래 google.clientId에 입력
 * 
 * 2. Naver OAuth 설정:
 *    - https://developers.naver.com/apps/#/register 접속
 *    - 애플리케이션 등록
 *    - Client ID와 Client Secret 발급
 *    - Callback URL 설정 (예: http://localhost:3000/auth/naver/callback)
 *    - Client ID를 아래 naver.clientId에 입력
 * 
 * 3. Kakao OAuth 설정:
 *    - https://developers.kakao.com/ 접속
 *    - 내 애플리케이션 > 애플리케이션 추가하기
 *    - 플랫폼 설정에서 Web 플랫폼 등록
 *    - Redirect URI 등록 (예: http://localhost:3000/auth/kakao/callback)
 *    - REST API 키를 아래 kakao.clientId에 입력
 * 
 * 4. Apple OAuth 설정:
 *    - https://developer.apple.com/account/resources/identifiers/list 접속
 *    - Services IDs 생성
 *    - Sign in with Apple 활성화
 *    - Return URLs 등록 (예: http://localhost:3000/auth/apple/callback)
 *    - Services ID를 아래 apple.clientId에 입력
 */

// 개발 모드 설정
// true로 설정하면 백엔드 없이도 소셜 로그인을 테스트할 수 있습니다
const OAUTH_DEV_MODE = true; // 개발 모드 활성화

const OAUTH_CONFIG = {
    google: {
        enabled: false, // true로 변경하여 활성화
        clientId: 'YOUR_GOOGLE_CLIENT_ID',
        redirectUri: 'http://localhost:3000/auth/google/callback', // 실제 도메인으로 변경 필요
        authUrl: function() {
            if (!this.enabled || this.clientId === 'YOUR_GOOGLE_CLIENT_ID') {
                return null;
            }
            const params = new URLSearchParams({
                client_id: this.clientId,
                redirect_uri: this.redirectUri,
                response_type: 'code',
                scope: 'openid email profile',
                access_type: 'offline',
                prompt: 'consent'
            });
            return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        }
    },
    naver: {
        enabled: false, // true로 변경하여 활성화
        clientId: 'YOUR_NAVER_CLIENT_ID',
        redirectUri: 'http://localhost:3000/auth/naver/callback', // 실제 도메인으로 변경 필요
        state: 'STATE_STRING_' + Date.now(), // CSRF 방지를 위한 랜덤 문자열
        authUrl: function() {
            if (!this.enabled || this.clientId === 'YOUR_NAVER_CLIENT_ID') {
                return null;
            }
            const params = new URLSearchParams({
                response_type: 'code',
                client_id: this.clientId,
                redirect_uri: this.redirectUri,
                state: this.state
            });
            return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
        }
    },
    kakao: {
        enabled: false, // true로 변경하여 활성화
        clientId: 'YOUR_KAKAO_REST_API_KEY',
        redirectUri: 'http://localhost:3000/auth/kakao/callback', // 실제 도메인으로 변경 필요
        authUrl: function() {
            if (!this.enabled || this.clientId === 'YOUR_KAKAO_REST_API_KEY') {
                return null;
            }
            const params = new URLSearchParams({
                client_id: this.clientId,
                redirect_uri: this.redirectUri,
                response_type: 'code'
            });
            return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
        }
    },
    apple: {
        enabled: false, // true로 변경하여 활성화
        clientId: 'YOUR_APPLE_SERVICES_ID',
        redirectUri: 'http://localhost:3000/auth/apple/callback', // 실제 도메인으로 변경 필요
        authUrl: function() {
            if (!this.enabled || this.clientId === 'YOUR_APPLE_SERVICES_ID') {
                return null;
            }
            const params = new URLSearchParams({
                client_id: this.clientId,
                redirect_uri: this.redirectUri,
                response_type: 'code',
                scope: 'email name',
                response_mode: 'form_post'
            });
            return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
        }
    }
};

// Helper function to get OAuth URL
function getOAuthUrl(provider) {
    const config = OAUTH_CONFIG[provider];
    if (!config) {
        return null;
    }
    return config.authUrl ? config.authUrl() : null;
}

// Check if OAuth is configured
function isOAuthConfigured(provider) {
    // 개발 모드에서는 항상 true 반환
    if (OAUTH_DEV_MODE) {
        return true;
    }
    const config = OAUTH_CONFIG[provider];
    return config && config.enabled && config.clientId && 
           !config.clientId.includes('YOUR_') && 
           config.authUrl() !== null;
}

// 개발 모드에서 소셜 로그인 시뮬레이션
function simulateSocialLogin(provider) {
    // 가상의 사용자 정보 생성
    const mockUsers = {
        google: {
            email: 'user.google@example.com',
            name: 'Google 사용자',
            provider: 'google'
        },
        naver: {
            email: 'user.naver@example.com',
            name: '네이버 사용자',
            provider: 'naver'
        },
        kakao: {
            email: 'user.kakao@example.com',
            name: '카카오 사용자',
            provider: 'kakao'
        },
        apple: {
            email: 'user.apple@example.com',
            name: 'Apple 사용자',
            provider: 'apple'
        }
    };
    
    const user = mockUsers[provider];
    if (!user) {
        return false;
    }
    
    // 회원 목록에 저장 (admin 페이지에서 확인 가능)
    try {
        let users = [];
        const stored = localStorage.getItem('users');
        if (stored) {
            users = JSON.parse(stored);
        }
        
        // 이미 존재하는 사용자인지 확인
        const existingUser = users.find(u => u.email === user.email);
        if (!existingUser) {
            const userData = {
                id: Date.now().toString(),
                email: user.email,
                name: user.name,
                registeredAt: new Date().toISOString(),
                status: 'active',
                authMethod: 'social',
                authProvider: user.provider
            };
            users.push(userData);
            localStorage.setItem('users', JSON.stringify(users));
            console.log('Social login user registered:', userData);
        }
    } catch (e) {
        console.error('Error saving social login user:', e);
    }
    
    // 로그인 처리
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('authProvider', user.provider);
    localStorage.setItem('authMethod', 'social');
    
    return true;
}

// 소셜 로그인 처리 (개발 모드 또는 실제 모드)
function handleSocialLogin(provider) {
    if (OAUTH_DEV_MODE) {
        // 개발 모드: 시뮬레이션
        if (simulateSocialLogin(provider)) {
            // 성공 메시지 표시
            if (typeof showSuccessMessage === 'function') {
                showSuccessMessage('소셜 로그인 성공! (개발 모드)');
            }
            
            // 헤더 업데이트 (같은 페이지에 있을 경우)
            if (typeof updateHeaderLoginStatus === 'function') {
                updateHeaderLoginStatus();
            }
            
            // 홈으로 리다이렉트
            setTimeout(function() {
                const currentPath = window.location.pathname;
                const isInAuth = currentPath.includes('/auth/');
                const redirectUrl = isInAuth ? '../../index.html' : '../index.html';
                window.location.href = redirectUrl;
            }, 1000);
            return true;
        }
        return false;
    } else {
        // 실제 모드: OAuth URL로 리다이렉트
        const oauthUrl = getOAuthUrl(provider);
        if (oauthUrl) {
            window.location.href = oauthUrl;
            return true;
        }
        return false;
    }
}

