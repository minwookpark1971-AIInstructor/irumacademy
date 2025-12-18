# Irum Academy

HTML + JavaScript + CSS 기반 온라인 강의 플랫폼

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS
- **JavaScript Libraries**: jQuery
- **Icons**: Emoji & Unicode
- **Font**: Noto Sans KR (Google Fonts)

## 프로젝트 구조

```
irumacademy/
├── html/                    # HTML 페이지
│   ├── index.html           # 홈 페이지
│   ├── courses.html         # 강의 목록
│   ├── courses/             # 강의 상세 페이지
│   ├── instructor-growth.html # 강사 성장 프로그램
│   ├── apply.html           # 강의 신청
│   ├── community.html       # 커뮤니티
│   └── auth/                # 인증 페이지
├── css/                     # 스타일시트
│   ├── main.css            # 메인 스타일
│   └── animations.css      # 애니메이션
├── js/                      # JavaScript 파일
│   ├── main.js             # 메인 스크립트
│   ├── components.js       # 컴포넌트 생성
│   ├── courses.js          # 강의 관련
│   ├── courses-data.js     # 강의 데이터
│   └── animations.js       # 애니메이션
├── data/                    # 데이터 파일
│   └── courses.json        # 강의 데이터
└── images/                  # 이미지 파일
```

## 주요 기능

### 페이지

- `/html/index.html` - 홈
- `/html/courses.html` - 강의 목록
- `/html/courses/[course-name].html` - 강의 상세
- `/html/instructor-growth.html` - 강사 성장 프로그램
- `/html/apply.html` - 강의 신청
- `/html/community.html` - 커뮤니티
- `/html/auth/login.html` - 로그인
- `/html/auth/signup.html` - 회원가입

### 주요 기능

- 반응형 디자인
- 동적 콘텐츠 로딩
- 스크롤 애니메이션
- 강의 상세 정보 표시
- 커뮤니티 기능

## 사용 방법

1. 웹 서버에 파일을 업로드하거나
2. 로컬에서 `file://` 프로토콜로 직접 열기

## 스타일링

### CSS 구조

- `main.css`: 전역 스타일, 레이아웃, 컴포넌트 스타일
- `animations.css`: 애니메이션 효과

### 반응형 디자인

모바일 우선 접근 방식으로 구현되어 있습니다.

## 접근성

- 시맨틱 HTML 사용
- 키보드 네비게이션 지원
- 반응형 디자인

## 라이선스

MIT
