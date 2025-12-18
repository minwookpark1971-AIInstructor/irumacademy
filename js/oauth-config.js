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
    const config = OAUTH_CONFIG[provider];
    return config && config.enabled && config.clientId && 
           !config.clientId.includes('YOUR_') && 
           config.authUrl() !== null;
}

