# OAuth 설정 가이드

각 SNS의 OAuth 인증을 설정하는 방법을 안내합니다.

## 공통 설정 방법

1. 각 SNS의 개발자 콘솔에서 앱 등록
2. Client ID 발급
3. Redirect URI 설정
4. `js/oauth-config.js` 파일에서 설정 입력

---

## 1. Google OAuth 설정

### 단계별 설정:

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/ 접속
   - Google 계정으로 로그인

2. **프로젝트 생성**
   - 상단의 프로젝트 선택 드롭다운 클릭
   - "새 프로젝트" 클릭
   - 프로젝트 이름 입력 후 "만들기" 클릭

3. **OAuth 동의 화면 설정**
   - 좌측 메뉴: APIs & Services > OAuth consent screen
   - User Type 선택 (외부 사용자)
   - 앱 정보 입력 (앱 이름, 사용자 지원 이메일 등)
   - 저장 후 계속

4. **OAuth 클라이언트 ID 생성**
   - 좌측 메뉴: APIs & Services > Credentials
   - "+ CREATE CREDENTIALS" > "OAuth client ID" 선택
   - Application type: "Web application" 선택
   - Name: 원하는 이름 입력
   - Authorized redirect URIs: 
     ```
     http://localhost:3000/auth/google/callback
     https://yourdomain.com/auth/google/callback
     ```
   - "만들기" 클릭
   - **Client ID 복사** (나중에 필요)

5. **js/oauth-config.js 파일 수정**
   ```javascript
   google: {
       enabled: true,
       clientId: '발급받은_Client_ID_여기에_입력',
       redirectUri: 'http://localhost:3000/auth/google/callback',
   }
   ```

---

## 2. Naver OAuth 설정

### 단계별 설정:

1. **네이버 개발자 센터 접속**
   - https://developers.naver.com 접속
   - 네이버 계정으로 로그인

2. **애플리케이션 등록**
   - "Application > 애플리케이션 등록" 클릭
   - 애플리케이션 이름, 사용 API 선택
   - 로그인 오픈 API 서비스 환경: PC 웹
   - 서비스 URL: `http://localhost:3000` (또는 실제 도메인)
   - Callback URL: `http://localhost:3000/auth/naver/callback`
   - 등록 클릭

3. **Client ID 및 Client Secret 확인**
   - 등록된 애플리케이션 클릭
   - **Client ID**와 **Client Secret** 확인

4. **js/oauth-config.js 파일 수정**
   ```javascript
   naver: {
       enabled: true,
       clientId: '발급받은_Client_ID_여기에_입력',
       redirectUri: 'http://localhost:3000/auth/naver/callback',
   }
   ```

---

## 3. Kakao OAuth 설정

### 단계별 설정:

1. **카카오 개발자 센터 접속**
   - https://developers.kakao.com 접속
   - 카카오 계정으로 로그인

2. **애플리케이션 추가**
   - "내 애플리케이션" > "애플리케이션 추가하기"
   - 앱 이름, 사업자명 입력
   - 저장

3. **플랫폼 설정**
   - 등록한 애플리케이션 클릭
   - "플랫폼" 메뉴 클릭
   - "Web 플랫폼 등록" 클릭
   - 사이트 도메인: `http://localhost:3000` (또는 실제 도메인)
   - 저장

4. **Redirect URI 등록**
   - "제품 설정" > "카카오 로그인" 활성화
   - Redirect URI 등록:
     ```
     http://localhost:3000/auth/kakao/callback
     ```

5. **REST API 키 확인**
   - "앱 키" 메뉴에서 **REST API 키** 확인

6. **js/oauth-config.js 파일 수정**
   ```javascript
   kakao: {
       enabled: true,
       clientId: '발급받은_REST_API_키_여기에_입력',
       redirectUri: 'http://localhost:3000/auth/kakao/callback',
   }
   ```

---

## 4. Apple OAuth 설정

### 단계별 설정:

1. **Apple Developer 접속**
   - https://developer.apple.com/account 접속
   - Apple Developer 계정으로 로그인 (유료 계정 필요)

2. **Services ID 생성**
   - Certificates, Identifiers & Profiles > Identifiers
   - "+" 버튼 클릭
   - Services IDs 선택 > Continue
   - Description과 Identifier 입력
   - "Sign in with Apple" 체크 > Continue > Register

3. **Sign in with Apple 설정**
   - 생성한 Services ID 클릭
   - "Sign in with Apple" 체크 후 "Configure" 클릭
   - Primary App ID 선택
   - Return URLs 등록:
     ```
     http://localhost:3000/auth/apple/callback
     https://yourdomain.com/auth/apple/callback
     ```
   - Save > Continue > Save

4. **js/oauth-config.js 파일 수정**
   ```javascript
   apple: {
       enabled: true,
       clientId: '생성한_Services_ID_여기에_입력',
       redirectUri: 'http://localhost:3000/auth/apple/callback',
   }
   ```

---

## 중요 사항

### Redirect URI 설정
- 개발 환경: `http://localhost:3000/auth/{provider}/callback`
- 프로덕션: `https://yourdomain.com/auth/{provider}/callback`
- 각 SNS 개발자 콘솔과 `js/oauth-config.js`의 redirectUri가 **정확히 일치**해야 합니다.

### 백엔드 서버 필요
- OAuth 인증은 **백엔드 서버**가 필요합니다.
- 각 SNS에서 인증 후 콜백 URL로 리다이렉트되면, 백엔드에서 인증 코드를 받아 토큰을 교환해야 합니다.
- 현재 설정은 프론트엔드에서 OAuth 인증 페이지로 리다이렉트만 합니다.

### 보안 주의사항
- Client Secret은 **절대** 프론트엔드 코드에 포함하지 마세요.
- Client Secret은 백엔드 서버에서만 사용해야 합니다.
- `js/oauth-config.js` 파일은 `.gitignore`에 추가하는 것을 권장합니다.

---

## 설정 확인

설정이 완료되면:
1. `js/oauth-config.js`에서 각 provider의 `enabled: true`로 변경
2. `clientId`와 `redirectUri` 입력
3. 브라우저에서 로그인 페이지 열기
4. SNS 로그인 버튼 클릭하여 해당 SNS 인증 페이지로 이동하는지 확인

