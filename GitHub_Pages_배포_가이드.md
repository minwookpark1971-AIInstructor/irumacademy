# GitHub Pages 배포 환경에서 OAuth 설정 가이드

## ⚠️ 중요 사항

**GitHub Pages는 정적 웹 호스팅**이므로 Node.js 백엔드 서버를 직접 실행할 수 없습니다.

따라서 OAuth 인증을 위해서는 **별도의 백엔드 서버** 또는 **서버리스 함수**가 필요합니다.

## 🔧 해결 방법

### 방법 1: Vercel 서버리스 함수 사용 (권장)

Vercel은 GitHub 저장소와 연동하여 서버리스 함수를 무료로 제공합니다.

#### 1. Vercel 배포 설정

1. [Vercel](https://vercel.com)에 가입하고 GitHub 저장소 연결
2. 프로젝트 설정에서:
   - **Framework Preset**: Other
   - **Root Directory**: `.` (프로젝트 루트)
   - **Build Command**: 없음 (정적 사이트)
   - **Output Directory**: `.` 또는 `html`

#### 2. 환경 변수 설정

Vercel 대시보드에서 **Settings** > **Environment Variables**에 추가:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
KAKAO_REST_API_KEY=your_kakao_rest_api_key
```

#### 3. 프론트엔드 API URL 수정

`js/oauth-config.js` 파일 수정:

```javascript
const API_CONFIG = {
    baseURL: 'https://your-vercel-app.vercel.app/api', // Vercel 배포 URL
    timeout: 10000,
    retryCount: 2
};
```

#### 4. 파일 구조

프로젝트에 다음 파일들이 있어야 합니다:

```
irumacademy/
├── api/
│   └── auth/
│       └── [provider]/
│           └── callback.js  (서버리스 함수)
├── vercel.json  (Vercel 설정)
├── js/
│   └── oauth-config.js
└── html/
    └── auth/
        └── oauth-callback.html
```

### 방법 2: 별도 백엔드 서버 호스팅

Railway, Render, Heroku 등에서 백엔드 서버를 호스팅합니다.

#### 1. 백엔드 서버 배포

`server.js` 파일을 Railway, Render, Heroku 등에 배포:

```bash
# Railway 예시
railway login
railway init
railway up
```

#### 2. 환경 변수 설정

호스팅 플랫폼의 환경 변수 설정에 OAuth 정보 추가.

#### 3. 프론트엔드 API URL 수정

`js/oauth-config.js` 파일 수정:

```javascript
const API_CONFIG = {
    baseURL: 'https://your-backend-server.railway.app/api', // 백엔드 서버 URL
    timeout: 10000,
    retryCount: 2
};
```

### 방법 3: Cloudflare Workers 사용

Cloudflare Workers를 사용하여 서버리스 함수를 배포할 수 있습니다.

## 📝 현재 상태 확인

### 현재 코드 동작 방식

1. **소셜 로그인 버튼 클릭** → OAuth 제공자 페이지로 이동 ✅
2. **사용자 로그인** → OAuth 제공자에서 인증 ✅
3. **콜백 URL로 리다이렉트** → 인증 코드 포함 ✅
4. **백엔드 API 호출 시도** → `/api/auth/{provider}/callback` ❌ (GitHub Pages에는 없음)
5. **백엔드 없을 때 폴백** → 수동 입력 폼 표시 ✅

### 문제점

- GitHub Pages에는 `/api` 경로가 없으므로 백엔드 API 호출이 실패합니다.
- 현재는 백엔드가 없을 때 폴백으로 수동 입력 폼이 표시됩니다.
- 실제 OAuth 사용자 정보를 가져오려면 백엔드 서버가 필요합니다.

## ✅ 권장 해결책

**Vercel 서버리스 함수 사용**을 권장합니다:

1. ✅ 무료로 사용 가능
2. ✅ GitHub와 자동 연동
3. ✅ 서버리스 함수로 OAuth 처리 가능
4. ✅ 환경 변수로 Client Secret 보안 관리
5. ✅ 자동 HTTPS 지원

## 🚀 Vercel 배포 단계

### 1. Vercel 프로젝트 생성

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 배포
vercel
```

또는 Vercel 웹사이트에서 GitHub 저장소를 연결하여 배포.

### 2. 환경 변수 설정

Vercel 대시보드에서 환경 변수 추가.

### 3. 프론트엔드 수정

`js/oauth-config.js`에서 API URL을 Vercel 배포 URL로 변경:

```javascript
const API_CONFIG = {
    baseURL: 'https://your-app.vercel.app/api',
    timeout: 10000,
    retryCount: 2
};
```

### 4. OAuth Redirect URI 설정

각 OAuth 제공자 콘솔에서 Redirect URI를 설정:

- **Google**: `https://www.irumcompany.co.kr/html/auth/oauth-callback.html?provider=google`
- **Naver**: `https://www.irumcompany.co.kr/html/auth/oauth-callback.html?provider=naver`
- **Kakao**: `https://www.irumcompany.co.kr/html/auth/oauth-callback.html?provider=kakao`

## 🔍 테스트 방법

1. Vercel에 배포 후 API 엔드포인트 확인:
   ```
   https://your-app.vercel.app/api/auth/google/callback
   ```

2. 브라우저에서 테스트:
   ```
   https://www.irumcompany.co.kr/html/auth/login.html
   ```

3. 소셜 로그인 버튼 클릭 후 콘솔 확인:
   - 백엔드 API 호출 성공 여부
   - 사용자 정보 수신 여부

## 📌 참고사항

- GitHub Pages는 정적 파일만 호스팅 가능
- 백엔드 API는 별도 서버 또는 서버리스 함수 필요
- Client Secret은 절대 프론트엔드에 노출하지 말 것
- HTTPS 필수 (OAuth는 HTTPS에서만 동작)

