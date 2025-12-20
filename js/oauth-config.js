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
// false로 설정하면 실제 OAuth 제공자 페이지로 이동합니다
// 실제 OAuth 설정이 완료되면 false로 변경해야 합니다
const OAUTH_DEV_MODE = false; // 개발 모드 비활성화 (실제 OAuth 사용)

// 웹사이트 도메인
const SITE_DOMAIN = 'https://www.irumcompany.co.kr';

// 백엔드 API 설정
// GitHub Pages는 정적 호스팅이므로 별도의 백엔드 서버가 필요합니다.
// 옵션 1: Vercel 서버리스 함수 사용 시
// const API_CONFIG = {
//     baseURL: 'https://your-vercel-app.vercel.app/api', // Vercel 배포 URL
//     timeout: 10000,
//     retryCount: 2
// };

// 옵션 2: 별도 백엔드 서버 사용 시 (예: Railway, Render, Heroku)
// const API_CONFIG = {
//     baseURL: 'https://api.irumcompany.co.kr/api', // 백엔드 서버 URL
//     timeout: 10000,
//     retryCount: 2
// };

// 옵션 3: 같은 도메인의 서브도메인 사용 시
const API_CONFIG = {
    baseURL: '/api', // 상대 경로 (프록시 또는 서브도메인 설정 필요)
    timeout: 10000, // 10초 타임아웃
    retryCount: 2 // 재시도 횟수
};

const OAUTH_CONFIG = {
    google: {
        enabled: false, // true로 변경하여 활성화 (clientId 설정 후)
        clientId: 'YOUR_GOOGLE_CLIENT_ID', // Google Cloud Console에서 발급받은 Client ID로 변경 필요
        redirectUri: SITE_DOMAIN + '/html/auth/oauth-callback.html?provider=google',
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
        enabled: false, // true로 변경하여 활성화 (clientId 설정 후)
        clientId: 'YOUR_NAVER_CLIENT_ID', // Naver Developers에서 발급받은 Client ID로 변경 필요
        redirectUri: SITE_DOMAIN + '/html/auth/oauth-callback.html?provider=naver',
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
        enabled: false, // true로 변경하여 활성화 (clientId 설정 후)
        clientId: 'YOUR_KAKAO_REST_API_KEY', // Kakao Developers에서 발급받은 REST API 키로 변경 필요
        redirectUri: SITE_DOMAIN + '/html/auth/oauth-callback.html?provider=kakao',
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
        enabled: false, // true로 변경하여 활성화 (clientId 설정 후)
        clientId: 'YOUR_APPLE_SERVICES_ID', // Apple Developer에서 발급받은 Services ID로 변경 필요
        redirectUri: SITE_DOMAIN + '/html/auth/oauth-callback.html?provider=apple',
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
    // 가상의 사용자 정보 생성 (각 provider마다 고유한 사용자)
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
        console.error('Unknown provider:', provider);
        return false;
    }
    
    try {
        // 회원 목록에 저장 (admin 페이지에서 확인 가능)
        let users = [];
        const stored = localStorage.getItem('users');
        if (stored) {
            users = JSON.parse(stored);
        }
        
        // 이미 존재하는 사용자인지 확인 (이메일과 provider로 확인)
        const existingUser = users.find(u => u.email === user.email && u.authProvider === user.provider);
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
        } else {
            console.log('Existing social login user:', existingUser);
        }
        
        // 기존 로그인 정보 초기화 (다른 사용자로 로그인된 경우 대비)
        // 현재 provider의 사용자로만 로그인 처리
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userName', user.name);
        localStorage.setItem('authProvider', user.provider);
        localStorage.setItem('authMethod', 'social');
        
        console.log('Social login successful for provider:', provider, 'User:', user.email);
        return true;
    } catch (e) {
        console.error('Error in simulateSocialLogin:', e);
        return false;
    }
}

// 소셜 로그인 처리 (개발 모드 또는 실제 모드)
function handleSocialLogin(provider) {
    // 실제 OAuth URL이 설정되어 있는지 확인
    const config = OAUTH_CONFIG[provider];
    const hasRealOAuthConfig = config && config.enabled && 
                               config.clientId && 
                               !config.clientId.includes('YOUR_') && 
                               config.authUrl && config.authUrl() !== null;
    
    // 실제 OAuth 설정이 있으면 항상 실제 OAuth 플로우 사용 (개발 모드 여부와 무관)
    if (hasRealOAuthConfig) {
        const oauthUrl = getOAuthUrl(provider);
        if (oauthUrl) {
            console.log('Redirecting to OAuth provider:', provider, oauthUrl);
            // 실제 OAuth 제공자 페이지로 리다이렉트
            window.location.href = oauthUrl;
            return true;
        }
    }
    
    // 실제 OAuth 설정이 없고 개발 모드인 경우: 시뮬레이션
    if (OAUTH_DEV_MODE) {
        const success = simulateSocialLogin(provider);
        if (success) {
            // 성공 메시지 표시
            if (typeof showSuccessMessage === 'function') {
                const providerNames = {
                    google: 'Google',
                    naver: 'Naver',
                    kakao: 'Kakao',
                    apple: 'Apple'
                };
                const providerName = providerNames[provider] || provider;
                showSuccessMessage(providerName + ' 로그인 성공! (시뮬레이션 모드)');
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
        } else {
            // 실패 시 에러 메시지
            if (typeof showError === 'function') {
                showError('소셜 로그인 처리 중 오류가 발생했습니다.');
            } else {
                alert('소셜 로그인 처리 중 오류가 발생했습니다.');
            }
            return false;
        }
    } else {
        // 실제 모드인데 OAuth 설정이 없는 경우
        const providerNames = {
            google: 'Google',
            naver: 'Naver',
            kakao: 'Kakao',
            apple: 'Apple'
        };
        const providerName = providerNames[provider] || provider;
        
        // OAuth 설정이 없으면 안내 메시지 표시
        const message = providerName + ' 로그인을 사용하려면 OAuth 설정이 필요합니다.\n\n' +
                       '설정 방법:\n' +
                       '1. js/oauth-config.js 파일을 열어주세요\n' +
                       '2. ' + providerName + '의 clientId와 redirectUri를 실제 값으로 설정하세요\n' +
                       '3. enabled를 true로 변경하세요\n\n' +
                       '각 OAuth 제공자에서 Client ID를 발급받아야 합니다:\n' +
                       '- Google: https://console.cloud.google.com/\n' +
                       '- Naver: https://developers.naver.com/\n' +
                       '- Kakao: https://developers.kakao.com/\n' +
                       '- Apple: https://developer.apple.com/';
        
        if (typeof showError === 'function') {
            showError('OAuth 설정이 필요합니다.');
        } else {
            alert(message);
        }
        return false;
    }
}

