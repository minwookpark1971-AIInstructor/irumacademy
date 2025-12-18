# Irum Academy - 설정 가이드

## ✅ 파일 직접 열기 (file:// 프로토콜) 지원

이제 **index.html을 더블클릭**하거나 브라우저에서 직접 열어도 작동합니다!

### 변경 사항

1. **AJAX 제거**: jQuery `.load()` 대신 JavaScript로 직접 생성
2. **데이터 임베딩**: `courses.json` 대신 `courses-data.js` 사용
3. **CORS 문제 해결**: 모든 리소스가 동일 출처에서 로드됨

### 작동 방식

- ✅ **file:// 프로토콜**: HTML 파일을 직접 열어도 작동
- ✅ **웹서버 없이**: Next.js, React, Node.js 설치 불필요
- ✅ **정적 파일만**: HTML, CSS, JavaScript만으로 완전히 작동

## 📁 파일 구조 확인

```
irumacademy/
├── html/
│   └── index.html          ← 이 파일을 더블클릭!
├── css/
│   ├── main.css
│   └── animations.css
├── js/
│   ├── courses-data.js     ← 새로 추가 (데이터 임베딩)
│   ├── components.js       ← 새로 추가 (헤더/푸터 생성)
│   ├── main.js
│   ├── animations.js
│   ├── courses.js
│   └── auth.js
└── images/
    ├── hero/
    └── pages/
```

## 🚀 사용 방법

### 방법 1: 파일 직접 열기 (가장 간단)

1. `html/index.html` 파일을 더블클릭
2. 브라우저에서 자동으로 열림
3. **완료!** 웹서버 없이 바로 작동

### 방법 2: 웹서버 사용 (권장 - 일부 기능 더 잘 작동)

#### Python 사용:
```bash
cd irumacademy
python -m http.server 8000
```
브라우저에서: `http://localhost:8000/html/index.html`

#### Node.js 사용:
```bash
cd irumacademy
npx http-server
```

#### PHP 사용:
```bash
cd irumacademy
php -S localhost:8000
```

## ⚠️ 주의사항

### file:// 프로토콜에서의 제한사항

1. **이미지 경로**: 상대 경로가 정확해야 함
   - `../images/hero/main-hero.jpg` 형식 사용

2. **브라우저별 차이**:
   - **Chrome/Edge**: 완전히 작동 ✅
   - **Firefox**: 완전히 작동 ✅
   - **Safari**: 완전히 작동 ✅
   - **IE11**: 제한적 지원

3. **API 호출**: 
   - 로그인/회원가입 API는 실제 서버 필요
   - 개발 모드에서는 localStorage 사용 (Fallback)

## 🔧 문제 해결

### 이미지가 표시되지 않음
- 이미지 파일이 올바른 경로에 있는지 확인
- `images/hero/main-hero.jpg` 파일 존재 확인

### JavaScript 오류 발생
- 브라우저 콘솔(F12)에서 오류 확인
- 모든 JS 파일이 올바른 경로에 있는지 확인

### 헤더/푸터가 표시되지 않음
- `js/components.js` 파일이 로드되었는지 확인
- 브라우저 콘솔에서 오류 확인

## 📝 요약

| 항목 | file:// 프로토콜 | 웹서버 (http://) |
|------|----------------|-----------------|
| **설치 필요** | 없음 | 없음 (정적 서버만) |
| **작동 여부** | ✅ 완전 작동 | ✅ 완전 작동 |
| **Next.js/React** | ❌ 불필요 | ❌ 불필요 |
| **Node.js** | ❌ 불필요 | ❌ 불필요 (선택사항) |
| **권장 방법** | 테스트용 | 배포용 |

## ✅ 최종 확인

1. `html/index.html` 더블클릭
2. 헤더가 표시되는지 확인
3. 강의 그리드가 로드되는지 확인
4. 페이지 이동이 작동하는지 확인

**모든 것이 정상 작동하면 성공!** 🎉


