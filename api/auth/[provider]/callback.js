/**
 * Vercel Serverless Function for OAuth Callback
 * 각 provider별 OAuth 콜백 처리
 * 
 * 배포: Vercel에 배포하면 자동으로 서버리스 함수로 동작합니다.
 */

const axios = require('axios');

// 환경 변수에서 OAuth 설정 가져오기
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
    }
};

// Google OAuth 처리
async function handleGoogleCallback(code, redirectUri) {
    try {
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

        const { access_token } = tokenResponse.data;

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

// 메인 핸들러
module.exports = async (req, res) => {
    // CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    const { provider } = req.query;
    const { code, state, redirectUri } = req.body;

    if (!code) {
        return res.status(400).json({
            success: false,
            message: '인증 코드가 없습니다.'
        });
    }

    if (!provider) {
        return res.status(400).json({
            success: false,
            message: 'Provider가 지정되지 않았습니다.'
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
};



