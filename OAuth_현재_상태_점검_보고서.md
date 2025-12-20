# OAuth 현재 상태 점검 보고서

## 🔍 현재 배포 환경

- **호스팅**: GitHub Pages (정적 웹 호스팅)
- **도메인**: www.irumcompany.co.kr
- **제한사항**: Node.js 백엔드 서버 실행 불가

## ⚠️ 현재 문제점

### 1. 백엔드 서버 없음

GitHub Pages는 정적 파일만 호스팅하므로:
- ❌ Node.js 백엔드 서버(`server.js`) 실행 불가
- ❌ `/api` 경로에 대한 서버 응답 없음
- ❌ OAuth 인증 코드를 액세스 토큰으로 교환하는 백엔드 로직 실행 불가

### 2. 현재 동작 방식

소셜 로그인 버튼 클릭 시:

1. ✅ OAuth 제공자 페이지로 리다이렉트 (Google, Naver, Kakao 등)
2. ✅ 사용자가 로그인
3. ✅ 콜백 URL로 리다이렉트 (`/html/auth/oauth-callback.html?provider=google`)
4. ✅ 인증 코드(`code`) 포함
5. ❌ 백엔드 API 호출 시도 (`/api/auth/google/callback`) → **404 에러**
6. ✅ 백엔드 없을 때 폴백 처리 → 수동 입력 폼 표시

### 3. 폴백 처리

현재 코드는 백엔드가 없을 때:
- 사용자에게 이메일과 이름을 수동으로 입력하도록 요청
- 실제 OAuth 사용자 정보를 자동으로 가져오지 못함

## 📊 현재 설정 확인

### `js/oauth-config.js` 설정

```javascript
const API_CONFIG = {
    baseURL: '/api',  // 상대 경로 (백엔드 서버 없음)
    timeout: 10000,
    retryCount: 2
};
```

**문제**: `/api` 경로는 GitHub Pages에 존재하지 않으므로 항상 404 에러 발생

### OAuth Provider 설정

각 provider의 `enabled` 상태와 `clientId` 설정 확인 필요:
- Google: `enabled: false` 또는 `clientId` 미설정 가능
- Naver: `enabled: false` 또는 `clientId` 미설정 가능
- Kakao: `enabled: false` 또는 `clientId` 미설정 가능

## ✅ 해결 방법

### 방법 1: Vercel 서버리스 함수 사용 (권장) ⭐

**장점**:
- ✅ 무료로 사용 가능
- ✅ GitHub와 자동 연동
- ✅ 서버리스 함수로 OAuth 처리
- ✅ 환경 변수로 Client Secret 보안 관리
- ✅ 자동 HTTPS 지원

**단계**:

1. **Vercel 프로젝트 생성**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **환경 변수 설정** (Vercel 대시보드)
   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NAVER_CLIENT_ID=your_naver_client_id
   NAVER_CLIENT_SECRET=your_naver_client_secret
   KAKAO_REST_API_KEY=your_kakao_rest_api_key
   ```

3. **프론트엔드 API URL 수정**
   ```javascript
   // js/oauth-config.js
   const API_CONFIG = {
       baseURL: 'https://your-vercel-app.vercel.app/api',
       timeout: 10000,
       retryCount: 2
   };
   ```

4. **필요한 파일** (이미 생성됨):
   - `api/auth/[provider]/callback.js` - 서버리스 함수
   - `vercel.json` - Vercel 설정

### 방법 2: 별도 백엔드 서버 호스팅

**옵션**:
- Railway (railway.app)
- Render (render.com)
- Heroku (heroku.com)

**단계**:

1. 백엔드 서버 배포 (`server.js`)
2. 환경 변수 설정
3. 프론트엔드 API URL 수정:
   ```javascript
   const API_CONFIG = {
       baseURL: 'https://your-backend-server.com/api',
       timeout: 10000,
       retryCount: 2
   };
   ```

### 방법 3: 현재 상태 유지 (폴백 사용)

현재 상태로 유지하면:
- 소셜 로그인 버튼 클릭 → OAuth 제공자 페이지로 이동 ✅
- 로그인 후 콜백 → 수동 입력 폼 표시
- 실제 OAuth 사용자 정보 자동 가져오기 불가 ❌

## 🧪 테스트 방법

### 1. 진단 도구 사용

브라우저에서 다음 URL 접속:
```
https://www.irumcompany.co.kr/html/auth/oauth-test.html
```

이 도구는:
- ✅ 설정 파일 확인
- ✅ 백엔드 API 연결 테스트
- ✅ OAuth Provider 설정 확인
- ✅ 권장 사항 제시

### 2. 수동 테스트

1. 로그인 페이지 접속:
   ```
   https://www.irumcompany.co.kr/html/auth/login.html
   ```

2. 소셜 로그인 버튼 클릭

3. 브라우저 개발자 도구 콘솔 확인:
   - 백엔드 API 호출 시도 로그
   - 에러 메시지 확인

4. 예상 동작:
   - 백엔드 없음 → 404 에러 → 폴백 처리 → 수동 입력 폼

## 📝 다음 단계

### 즉시 확인 사항

1. **진단 도구 실행**
   - `html/auth/oauth-test.html` 접속
   - 현재 설정 상태 확인

2. **OAuth Provider 설정 확인**
   - `js/oauth-config.js`에서 각 provider의 `enabled` 상태 확인
   - `clientId`가 실제 값으로 설정되어 있는지 확인

3. **백엔드 서버 배포 여부 확인**
   - Vercel, Railway, Render 등에 백엔드 서버가 배포되어 있는지 확인
   - 배포되어 있다면 API URL 확인

### 권장 조치

1. **Vercel 서버리스 함수 배포** (가장 간단하고 빠름)
   - `api/auth/[provider]/callback.js` 파일이 이미 준비되어 있음
   - Vercel에 배포하고 환경 변수 설정
   - 프론트엔드 API URL 수정

2. **OAuth Provider 설정 완료**
   - 각 OAuth 제공자 콘솔에서 Redirect URI 설정:
     ```
     https://www.irumcompany.co.kr/html/auth/oauth-callback.html?provider=google
     https://www.irumcompany.co.kr/html/auth/oauth-callback.html?provider=naver
     https://www.irumcompany.co.kr/html/auth/oauth-callback.html?provider=kakao
     ```

3. **테스트 및 확인**
   - 진단 도구로 설정 확인
   - 실제 소셜 로그인 테스트
   - 사용자 정보가 정상적으로 가져와지는지 확인

## 🔐 보안 주의사항

- ⚠️ **Client Secret은 절대 프론트엔드 코드에 포함하지 마세요**
- ✅ Client Secret은 백엔드 서버의 환경 변수로만 관리
- ✅ HTTPS 필수 (OAuth는 HTTPS에서만 동작)
- ✅ `.env` 파일은 Git에 커밋하지 마세요

## 📞 추가 도움

문제가 발생하면:
1. 브라우저 개발자 도구 콘솔 확인
2. 진단 도구(`oauth-test.html`) 실행
3. 백엔드 서버 로그 확인 (배포된 경우)



