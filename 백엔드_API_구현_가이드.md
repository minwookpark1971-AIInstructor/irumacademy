# 백엔드 API 구현 가이드

## 현재 프론트엔드 구조

프론트엔드는 이미 백엔드 API 호출을 준비하고 있습니다:

```javascript
// html/auth/oauth-callback.html의 handleOAuthCallback 함수
$.ajax({
    url: '/api/auth/' + provider + '/callback',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
        code: code,
        state: state,
        redirectUri: window.location.origin + window.location.pathname
    }),
    dataType: 'json',
    success: function(response) {
        if (response.success) {
            saveUserInfo(response, provider);
            // 로그인 성공 처리
        }
    }
});
```

## 백엔드 API 엔드포인트

### POST `/api/auth/{provider}/callback`

**요청 본문:**
```json
{
    "code": "인증_코드",
    "state": "상태_값",
    "redirectUri": "콜백_URL"
}
```

**성공 응답:**
```json
{
    "success": true,
    "token": "JWT_토큰_또는_세션_ID",
    "email": "user@example.com",
    "name": "사용자 이름",
    "user": {
        "email": "user@example.com",
        "name": "사용자 이름",
        "phone": "010-1234-5678"
    }
}
```

**실패 응답:**
```json
{
    "success": false,
    "message": "에러 메시지"
}
```

## 각 Provider별 구현 방법

### 1. Google OAuth

```javascript
// Node.js 예시
const { OAuth2Client } = require('google-auth-library');

async function handleGoogleCallback(code, redirectUri) {
    const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
    );
    
    // 인증 코드를 액세스 토큰으로 교환
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    
    // 사용자 정보 가져오기
    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    return {
        success: true,
        email: payload.email,
        name: payload.name,
        token: tokens.access_token
    };
}
```

### 2. Naver OAuth

```javascript
// Node.js 예시
const axios = require('axios');

async function handleNaverCallback(code, state, redirectUri) {
    // 인증 코드를 액세스 토큰으로 교환
    const tokenResponse = await axios.post('https://nid.naver.com/oauth2.0/token', null, {
        params: {
            grant_type: 'authorization_code',
            client_id: process.env.NAVER_CLIENT_ID,
            client_secret: process.env.NAVER_CLIENT_SECRET,
            code: code,
            state: state
        }
    });
    
    const accessToken = tokenResponse.data.access_token;
    
    // 사용자 정보 가져오기
    const userResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    const userInfo = userResponse.data.response;
    
    return {
        success: true,
        email: userInfo.email,
        name: userInfo.name,
        phone: userInfo.mobile,
        token: accessToken
    };
}
```

### 3. Kakao OAuth

```javascript
// Node.js 예시
const axios = require('axios');

async function handleKakaoCallback(code, redirectUri) {
    // 인증 코드를 액세스 토큰으로 교환
    const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
        params: {
            grant_type: 'authorization_code',
            client_id: process.env.KAKAO_REST_API_KEY,
            redirect_uri: redirectUri,
            code: code
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    
    const accessToken = tokenResponse.data.access_token;
    
    // 사용자 정보 가져오기
    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    const userInfo = userResponse.data.kakao_account;
    
    return {
        success: true,
        email: userInfo.email,
        name: userInfo.profile?.nickname || '',
        token: accessToken
    };
}
```

### 4. Apple OAuth

```javascript
// Node.js 예시 (더 복잡함 - JWT 서명 필요)
// Apple은 JWT를 사용하여 토큰 요청을 서명해야 함
// 자세한 내용은 Apple Developer 문서 참조
```

## 백엔드 서버 예시 (Express.js)

```javascript
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public')); // 프론트엔드 파일 서빙

// CORS 설정
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// OAuth 콜백 엔드포인트
app.post('/api/auth/:provider/callback', async (req, res) => {
    const { provider } = req.params;
    const { code, state, redirectUri } = req.body;
    
    try {
        let userInfo;
        
        switch (provider) {
            case 'google':
                userInfo = await handleGoogleCallback(code, redirectUri);
                break;
            case 'naver':
                userInfo = await handleNaverCallback(code, state, redirectUri);
                break;
            case 'kakao':
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
        
        res.json({
            success: true,
            ...userInfo
        });
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'OAuth 처리 중 오류가 발생했습니다.'
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

## 환경 변수 설정

`.env` 파일:
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
KAKAO_REST_API_KEY=your_kakao_rest_api_key
```

## 프론트엔드와의 연동

프론트엔드는 이미 백엔드 API를 호출하도록 구현되어 있습니다:

1. **OAuth 제공자 페이지로 리다이렉트** → 사용자가 로그인
2. **콜백 URL로 리다이렉트** → 인증 코드 포함
3. **프론트엔드가 백엔드 API 호출** → `/api/auth/{provider}/callback`
4. **백엔드가 인증 코드를 액세스 토큰으로 교환**
5. **백엔드가 사용자 정보 가져오기**
6. **프론트엔드로 사용자 정보 반환**
7. **프론트엔드가 localStorage에 저장**

## 현재 상태

- ✅ 프론트엔드: 백엔드 API 호출 준비 완료
- ✅ 프론트엔드: 백엔드 없을 때 폴백 처리 구현
- ⏳ 백엔드: 서버 구축 필요
- ⏳ 백엔드: 각 Provider별 OAuth 처리 로직 구현 필요

## 다음 단계

1. 백엔드 서버 구축 (Express.js, Flask, Django 등)
2. 각 Provider의 Client Secret 설정
3. OAuth 처리 로직 구현
4. 테스트 및 배포





