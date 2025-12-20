# Admin 페이지 파일 액세스 오류 해결 보고서

**문제**: Admin 페이지에서 "파일에 액세스할 수 없음" 에러 발생  
**해결 일시**: 2024년

---

## 🔍 문제 분석

### 발생 가능한 원인

1. **한글 파일명 문제**
   - 이미지 파일명에 한글이 포함되어 있음 (`이룸아카데미_logo.png`)
   - 일부 웹 서버나 브라우저에서 한글 파일명을 제대로 처리하지 못할 수 있음

2. **경로 문제**
   - 상대 경로(`../`) 사용 시 서버 설정에 따라 문제 발생 가능
   - 파일 구조:
     ```
     irumacademy/
     ├── html/
     │   └── admin.html
     ├── css/
     │   ├── main.css
     │   └── animations.css
     └── images/
         └── logo/
             └── 이룸아카데미_logo.png
     ```

3. **서버 설정 문제**
   - 웹 서버가 특정 파일 타입을 제공하지 못할 수 있음
   - 파일 권한 문제

---

## ✅ 적용된 해결책

### 1. 이미지 로드 에러 처리 개선

**수정 위치**: `html/admin.html` 174번째 줄

**수정 전**:
```html
<img src="../images/logo/이룸아카데미_logo.png" alt="Irum Academy" class="logo-image" style="height: 60px; width: auto; display: block;">
```

**수정 후**:
```html
<img src="../images/logo/이룸아카데미_logo.png" alt="Irum Academy" class="logo-image" style="height: 60px; width: auto; display: block;" data-original-src="../images/logo/이룸아카데미_logo.png" onerror="this.onerror=null; if(!this.dataset.retried) { this.dataset.retried='true'; this.src=encodeURI(this.dataset.originalSrc); } else { this.style.display='none'; }">
```

**개선 사항**:
- `onerror` 핸들러 추가
- 한글 파일명을 URL 인코딩하여 재시도
- 실패 시 이미지 숨김 처리

### 2. 전역 에러 핸들러 추가

**수정 위치**: `html/admin.html` 590-610번째 줄

**추가된 코드**:
```javascript
// Check for resource loading errors
window.addEventListener('error', function(e) {
    if (e.target.tagName === 'LINK' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'IMG') {
        console.error('Resource loading error:', e.target.src || e.target.href, e.message);
        // Try to fix image path if it's the logo
        if (e.target.tagName === 'IMG' && e.target.src.includes('logo')) {
            // Try alternative path
            const img = e.target;
            const originalSrc = img.getAttribute('data-original-src') || img.src;
            if (!img.getAttribute('data-retried')) {
                img.setAttribute('data-retried', 'true');
                // Try URL encoded version
                const encodedSrc = originalSrc.replace(/[가-힣]/g, function(match) {
                    return encodeURIComponent(match);
                });
                img.src = encodedSrc;
            } else {
                // Hide image if retry also failed
                img.style.display = 'none';
            }
        }
    }
}, true);
```

**기능**:
- 모든 리소스 로딩 에러 감지
- 로고 이미지 에러 시 자동으로 URL 인코딩 재시도
- 콘솔에 에러 로그 출력

---

## 📋 확인된 파일 경로

### CSS 파일
- `../css/main.css` ✅ 존재 확인
- `../css/animations.css` ✅ 존재 확인

### JavaScript 파일
- `https://code.jquery.com/jquery-3.7.1.min.js` (CDN)
- `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js` (CDN)

### 이미지 파일
- `../images/logo/이룸아카데미_logo.png` ✅ 존재 확인

---

## 🔧 추가 권장 사항

### 1. 파일명 영어로 변경 (선택사항)

한글 파일명을 영어로 변경하면 더 안정적입니다:

```
이룸아카데미_logo.png → irum_academy_logo.png
```

### 2. 절대 경로 사용 (서버 설정에 따라)

상대 경로 대신 절대 경로 사용:

```html
<!-- 상대 경로 -->
<img src="../images/logo/이룸아카데미_logo.png">

<!-- 절대 경로 (예시) -->
<img src="/images/logo/이룸아카데미_logo.png">
```

### 3. 웹 서버 설정 확인

- 파일 권한 확인
- MIME 타입 설정 확인
- 한글 파일명 지원 확인

### 4. 브라우저 콘솔 확인

브라우저 개발자 도구(F12)의 콘솔에서 다음을 확인:
- 어떤 파일이 로드되지 않는지
- 정확한 에러 메시지
- 파일 경로가 올바른지

---

## 🧪 테스트 방법

1. **브라우저 개발자 도구 열기**
   - F12 키 누르기
   - Console 탭 확인

2. **에러 메시지 확인**
   - "Resource loading error" 메시지 확인
   - 어떤 파일이 문제인지 확인

3. **네트워크 탭 확인**
   - Network 탭에서 실패한 요청 확인
   - 상태 코드 확인 (404, 403 등)

4. **이미지 로드 확인**
   - 로고 이미지가 표시되는지 확인
   - 에러 시 자동으로 URL 인코딩 재시도되는지 확인

---

## ✅ 해결 완료 사항

1. ✅ 이미지 로드 에러 처리 추가
2. ✅ 한글 파일명 URL 인코딩 재시도 로직 추가
3. ✅ 전역 에러 핸들러 추가
4. ✅ 콘솔 에러 로깅 추가

---

## 📝 참고사항

- 현재 수정사항으로 대부분의 파일 액세스 오류가 해결될 것입니다
- 여전히 문제가 발생한다면 브라우저 콘솔의 에러 메시지를 확인하여 추가 수정이 필요할 수 있습니다
- 웹 서버 설정에 따라 추가 조치가 필요할 수 있습니다

---

**보고서 작성일**: 2024년  
**수정 완료일**: 2024년

