# Irum Academy - HTML5/CSS/jQuery 버전

이 프로젝트는 Next.js/React로 구현된 Irum Academy 사이트를 HTML5, CSS, jQuery만으로 재구성한 버전입니다.

## 프로젝트 구조

```
irumacademy/
├── html/                    # HTML 페이지들
│   ├── index.html          # 메인 페이지
│   ├── courses.html        # 강의코스 페이지
│   ├── instructor-growth.html  # 전문강사 성장 프로그램
│   ├── apply.html          # 강의신청 페이지
│   ├── community.html      # 강사커뮤니티
│   ├── auth/               # 인증 페이지
│   │   ├── login.html
│   │   └── signup.html
│   ├── courses/            # 강의 상세 페이지
│   │   └── [slug].html
│   └── includes/           # 공통 컴포넌트
│       ├── header.html
│       └── footer.html
│
├── css/                    # 스타일시트
│   ├── main.css           # 메인 스타일
│   └── animations.css     # 애니메이션 스타일
│
├── js/                     # JavaScript 파일
│   ├── main.js           # 공통 기능
│   ├── animations.js     # 고급 애니메이션
│   ├── courses.js        # 강의 관련 기능
│   └── auth.js           # 인증 관련 기능
│
├── data/                   # 데이터 파일
│   └── courses.json      # 강의 데이터
│
└── images/                 # 이미지 파일
    ├── hero/             # 메인 히어로 이미지
    │   └── main-hero.jpg
    └── pages/            # 페이지별 히어로 이미지
        ├── courses-hero.jpg
        ├── instructor-growth-hero.jpg
        ├── apply-hero.jpg
        └── community-hero.jpg
```

## 주요 기능

### 1. 복잡한 인터랙션 및 애니메이션
- ✅ Reveal 애니메이션 (스크롤 시 나타나기)
- ✅ Stagger 애니메이션 (순차 등장)
- ✅ 카드 호버 효과 (3D tilt, 그림자 변화)
- ✅ 버튼 인터랙션 (scale, ripple 효과)
- ✅ 페이지 전환 애니메이션
- ✅ 모달/다이얼로그 애니메이션
- ✅ Parallax 효과
- ✅ GridItem 인터랙션 (HeaderIndicator 연동)

### 2. 로그인/회원가입 (백엔드 API 연결 준비)
- ✅ 폼 유효성 검사 (jQuery Validation)
- ✅ 비밀번호 표시/숨김 토글
- ✅ API 엔드포인트 설정 (`js/auth.js`의 `API_CONFIG`)
- ✅ Fallback 모드 (개발/테스트용)
- ✅ 에러 처리 및 사용자 피드백
- ✅ 소셜 로그인 준비

### 3. 화면 구조 및 메뉴
- ✅ 헤더/푸터 공통 컴포넌트
- ✅ 반응형 네비게이션
- ✅ 모바일 메뉴
- ✅ 스크롤 시 헤더 스타일 변경
- ✅ 모든 메뉴 페이지 동일한 구조

### 4. 히어로 이미지 시스템
- ✅ 메인 페이지: `images/hero/main-hero.jpg` (21:9 비율)
- ✅ 각 페이지별 히어로 이미지 (21:9 비율)
  - `images/pages/courses-hero.jpg`
  - `images/pages/instructor-growth-hero.jpg`
  - `images/pages/apply-hero.jpg`
  - `images/pages/community-hero.jpg`

## 시작하기

### 1. 로컬 서버 실행

HTML 파일을 직접 열면 CORS 문제가 발생할 수 있으므로 로컬 서버를 사용하세요.

#### Python 사용:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Node.js 사용:
```bash
npx http-server
```

#### PHP 사용:
```bash
php -S localhost:8000
```

### 2. 브라우저에서 접속
```
http://localhost:8000/html/index.html
```

## 백엔드 API 연결

### 로그인/회원가입 API 설정

`js/auth.js` 파일의 `API_CONFIG` 객체를 수정하세요:

```javascript
const API_CONFIG = {
    baseURL: 'https://your-api-domain.com/api', // 백엔드 API URL
    endpoints: {
        login: '/auth/login',
        signup: '/auth/signup',
        logout: '/auth/logout',
        verify: '/auth/verify',
        refresh: '/auth/refresh'
    }
};
```

### API 요청 형식

#### 로그인
```javascript
POST /api/auth/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "password123"
}

// 성공 응답
{
    "success": true,
    "token": "jwt_token_here",
    "email": "user@example.com"
}

// 실패 응답
{
    "success": false,
    "message": "이메일 또는 비밀번호가 올바르지 않습니다."
}
```

#### 회원가입
```javascript
POST /api/auth/signup
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "password123",
    "confirmPassword": "password123"
}

// 성공 응답
{
    "success": true,
    "token": "jwt_token_here",
    "email": "user@example.com"
}

// 실패 응답
{
    "success": false,
    "message": "이미 등록된 이메일입니다."
}
```

## 이미지 교체 방법

### 메인 페이지 히어로 이미지
1. `images/hero/main-hero.jpg` 파일을 교체
2. 또는 `html/index.html`에서 이미지 경로 수정

### 페이지별 히어로 이미지
1. 각 페이지의 `images/pages/` 폴더에 해당 이미지 교체
2. 파일명은 각 HTML 파일에서 참조하는 이름과 일치해야 함

### 이미지 규격
- **비율**: 21:9 (예: 2100px × 900px)
- **권장 해상도**: 2560px × 1097px 이상
- **파일 크기**: 500KB 이하 권장

## 사용된 라이브러리

- **jQuery 3.7.1**: DOM 조작 및 이벤트 처리
- **jQuery UI 1.13.2**: UI 컴포넌트
- **jQuery Validation 1.19.5**: 폼 유효성 검사
- **Google Fonts (Noto Sans KR)**: 한글 폰트

## 브라우저 지원

- Chrome (최신)
- Firefox (최신)
- Safari (최신)
- Edge (최신)
- IE11 (제한적 지원)

## 주요 파일 설명

### `js/main.js`
- 헤더 초기화
- Reveal/Stagger 애니메이션
- 카드 효과
- 모달 기능
- 공통 유틸리티

### `js/animations.js`
- 고급 애니메이션 효과
- Parallax
- Spring 애니메이션
- Magnetic 버튼
- Ripple 효과
- 3D Tilt 효과

### `js/courses.js`
- 강의 그리드 로드
- GridItem 인터랙션
- HeaderIndicator 연동
- 강의 필터링

### `js/auth.js`
- 로그인/회원가입 폼 처리
- API 통신
- 인증 상태 관리
- Fallback 모드

## 개발 모드

백엔드 API가 연결되지 않은 경우, `js/auth.js`의 Fallback 함수가 자동으로 작동합니다:
- 로그인/회원가입 시 localStorage에 상태 저장
- 실제 API 호출 없이 개발/테스트 가능

## 배포

1. 모든 파일을 웹 서버에 업로드
2. `js/auth.js`의 `API_CONFIG.baseURL`을 실제 API 주소로 변경
3. 이미지 파일 최적화
4. CSS/JS 파일 압축 (선택사항)

## 문제 해결

### CORS 오류
- 로컬 서버를 사용하거나 백엔드에서 CORS 헤더 설정

### 이미지가 표시되지 않음
- 이미지 경로 확인 (상대 경로 사용)
- 파일명 대소문자 확인

### 애니메이션이 작동하지 않음
- jQuery가 로드되었는지 확인
- 브라우저 콘솔에서 오류 확인

## 라이선스

이 프로젝트는 Irum Academy의 일부입니다.


