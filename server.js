/**
 * 백엔드 서버 (Node.js/Express)
 * OAuth 인증 처리 및 사용자 정보 관리
 * 
 * 설치 방법:
 * 1. npm install express cors dotenv axios
 * 2. .env 파일 생성 및 환경 변수 설정
 * 3. node server.js 실행
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // 프론트엔드 파일 서빙

// 환경 변수 확인
const OAUTH_CONFIG = {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
    },
    naver: {
        clientId: process.env.NAVER_CLIENT_ID,
        clientSecret: process.env.NAVER_CLIENT_SECRET
    },
    kakao: {
        restApiKey: process.env.KAKAO_REST_API_KEY
    },
    apple: {
        clientId: process.env.APPLE_CLIENT_ID,
        teamId: process.env.APPLE_TEAM_ID,
        keyId: process.env.APPLE_KEY_ID,
        privateKey: process.env.APPLE_PRIVATE_KEY
    }
};

// Google OAuth 처리
async function handleGoogleCallback(code, redirectUri) {
    try {
        // 인증 코드를 액세스 토큰으로 교환
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', null, {
            params: {
                code: code,
                client_id: OAUTH_CONFIG.google.clientId,
                client_secret: OAUTH_CONFIG.google.clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, id_token } = tokenResponse.data;

        // 사용자 정보 가져오기
        const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        const userInfo = userResponse.data;

        return {
            success: true,
            email: userInfo.email,
            name: userInfo.name || userInfo.given_name || '',
            token: access_token,
            user: {
                email: userInfo.email,
                name: userInfo.name || userInfo.given_name || '',
                picture: userInfo.picture
            }
        };
    } catch (error) {
        console.error('Google OAuth error:', error.response?.data || error.message);
        throw new Error('Google 로그인 처리 중 오류가 발생했습니다.');
    }
}

// Naver OAuth 처리
async function handleNaverCallback(code, state, redirectUri) {
    try {
        // 인증 코드를 액세스 토큰으로 교환
        const tokenResponse = await axios.post('https://nid.naver.com/oauth2.0/token', null, {
            params: {
                grant_type: 'authorization_code',
                client_id: OAUTH_CONFIG.naver.clientId,
                client_secret: OAUTH_CONFIG.naver.clientSecret,
                code: code,
                state: state
            }
        });

        const { access_token } = tokenResponse.data;

        // 사용자 정보 가져오기
        const userResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        const userInfo = userResponse.data.response;

        return {
            success: true,
            email: userInfo.email,
            name: userInfo.name || userInfo.nickname || '',
            phone: userInfo.mobile || '',
            token: access_token,
            user: {
                email: userInfo.email,
                name: userInfo.name || userInfo.nickname || '',
                phone: userInfo.mobile || '',
                profile_image: userInfo.profile_image
            }
        };
    } catch (error) {
        console.error('Naver OAuth error:', error.response?.data || error.message);
        throw new Error('Naver 로그인 처리 중 오류가 발생했습니다.');
    }
}

// Kakao OAuth 처리
async function handleKakaoCallback(code, redirectUri) {
    try {
        // 인증 코드를 액세스 토큰으로 교환
        const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
            params: {
                grant_type: 'authorization_code',
                client_id: OAUTH_CONFIG.kakao.restApiKey,
                redirect_uri: redirectUri,
                code: code
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token } = tokenResponse.data;

        // 사용자 정보 가져오기
        const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        const kakaoAccount = userResponse.data.kakao_account;
        const profile = kakaoAccount?.profile;

        return {
            success: true,
            email: kakaoAccount?.email || '',
            name: profile?.nickname || kakaoAccount?.name || '',
            phone: kakaoAccount?.phone_number || '',
            token: access_token,
            user: {
                email: kakaoAccount?.email || '',
                name: profile?.nickname || kakaoAccount?.name || '',
                phone: kakaoAccount?.phone_number || '',
                profile_image: profile?.profile_image_url
            }
        };
    } catch (error) {
        console.error('Kakao OAuth error:', error.response?.data || error.message);
        throw new Error('Kakao 로그인 처리 중 오류가 발생했습니다.');
    }
}

// Apple OAuth 처리 (더 복잡함 - JWT 서명 필요)
async function handleAppleCallback(code, redirectUri) {
    // Apple OAuth는 JWT 서명이 필요하여 더 복잡합니다
    // 실제 구현 시 Apple Developer 문서 참조 필요
    throw new Error('Apple OAuth는 추가 구현이 필요합니다.');
}

// OAuth 콜백 엔드포인트
app.post('/api/auth/:provider/callback', async (req, res) => {
    const { provider } = req.params;
    const { code, state, redirectUri } = req.body;

    if (!code) {
        return res.status(400).json({
            success: false,
            message: '인증 코드가 없습니다.'
        });
    }

    try {
        let userInfo;

        switch (provider) {
            case 'google':
                if (!OAUTH_CONFIG.google.clientId || !OAUTH_CONFIG.google.clientSecret) {
                    return res.status(500).json({
                        success: false,
                        message: 'Google OAuth 설정이 필요합니다.'
                    });
                }
                userInfo = await handleGoogleCallback(code, redirectUri);
                break;

            case 'naver':
                if (!OAUTH_CONFIG.naver.clientId || !OAUTH_CONFIG.naver.clientSecret) {
                    return res.status(500).json({
                        success: false,
                        message: 'Naver OAuth 설정이 필요합니다.'
                    });
                }
                userInfo = await handleNaverCallback(code, state, redirectUri);
                break;

            case 'kakao':
                if (!OAUTH_CONFIG.kakao.restApiKey) {
                    return res.status(500).json({
                        success: false,
                        message: 'Kakao OAuth 설정이 필요합니다.'
                    });
                }
                userInfo = await handleKakaoCallback(code, redirectUri);
                break;

            case 'apple':
                userInfo = await handleAppleCallback(code, redirectUri);
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: '지원하지 않는 provider입니다.'
                });
        }

        res.json(userInfo);
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'OAuth 처리 중 오류가 발생했습니다.'
        });
    }
});

// 헬스 체크 엔드포인트
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`\n🚀 서버가 시작되었습니다!`);
    console.log(`📍 포트: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`\n📝 OAuth 설정 확인:`);
    console.log(`   Google: ${OAUTH_CONFIG.google.clientId ? '✅' : '❌'}`);
    console.log(`   Naver: ${OAUTH_CONFIG.naver.clientId ? '✅' : '❌'}`);
    console.log(`   Kakao: ${OAUTH_CONFIG.kakao.restApiKey ? '✅' : '❌'}`);
    console.log(`\n💡 .env 파일에 OAuth 설정을 추가하세요.\n`);
});





