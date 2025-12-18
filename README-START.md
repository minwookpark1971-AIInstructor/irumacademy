# 🚀 Irum Academy 시작 가이드

## ✅ index.html 위치 확인

프로젝트 루트에 `index.html` 파일이 생성되었습니다!

```
irumacademy/
├── index.html          ← 여기! 더블클릭하면 바로 작동!
├── html/               ← 다른 페이지들
│   ├── courses.html
│   ├── apply.html
│   └── ...
├── css/                ← 스타일 파일
├── js/                 ← JavaScript 파일
└── images/             ← 이미지 파일
```

## 🎯 사용 방법

### 방법 1: 파일 직접 열기 (가장 간단!)

1. **프로젝트 폴더 열기**: `C:\Users\USER-PC\irumacademy`
2. **index.html 더블클릭**
3. **완료!** 브라우저에서 자동으로 열립니다

### 방법 2: 웹서버 사용 (선택사항)

터미널에서 프로젝트 폴더로 이동 후:

```bash
# Python 사용
python -m http.server 8000

# 또는 Node.js 사용
npx http-server
```

그 다음 브라우저에서: `http://localhost:8000/index.html`

## ✅ 작동 확인

1. **index.html 더블클릭**
2. 브라우저가 열리면:
   - ✅ 헤더가 표시되는지 확인
   - ✅ 히어로 섹션이 표시되는지 확인
   - ✅ 강의 그리드가 로드되는지 확인
   - ✅ 푸터가 표시되는지 확인

3. **브라우저 개발자 도구(F12) 열기**
   - Console 탭에서 오류가 없는지 확인
   - 오류가 없으면 정상 작동! ✅

## 📁 파일 구조

```
irumacademy/
├── index.html              ← 메인 페이지 (여기서 시작!)
├── html/                   ← 다른 HTML 페이지들
│   ├── courses.html
│   ├── instructor-growth.html
│   ├── apply.html
│   ├── community.html
│   └── auth/
│       ├── login.html
│       └── signup.html
├── css/                    ← 스타일시트
│   ├── main.css
│   └── animations.css
├── js/                     ← JavaScript 파일
│   ├── courses-data.js     ← 강의 데이터
│   ├── components.js        ← 헤더/푸터 생성
│   ├── main.js
│   ├── animations.js
│   ├── courses.js
│   └── auth.js
├── images/                 ← 이미지 파일
│   ├── hero/
│   │   └── main-hero.jpg
│   └── pages/
│       ├── courses-hero.jpg
│       └── ...
└── data/                   ← 데이터 파일 (선택사항)
    └── courses.json
```

## ⚠️ 문제 해결

### index.html을 찾을 수 없음
- 프로젝트 루트 폴더(`irumacademy`)에서 찾으세요
- `html/index.html`이 아니라 루트의 `index.html`입니다

### 페이지가 제대로 표시되지 않음
1. 브라우저 콘솔(F12)에서 오류 확인
2. 모든 파일이 올바른 위치에 있는지 확인
3. 이미지 파일이 `images/` 폴더에 있는지 확인

### 이미지가 표시되지 않음
- `images/hero/main-hero.jpg` 파일이 있는지 확인
- 없으면 배경색만 표시됩니다 (정상)

## 🎉 완료!

이제 **index.html을 더블클릭**하면 사이트가 바로 작동합니다!

- ✅ 웹서버 불필요
- ✅ Next.js 불필요
- ✅ React 불필요
- ✅ Node.js 불필요

**순수 HTML5, CSS, jQuery만으로 완전히 작동합니다!**


