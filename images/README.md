# 이미지 폴더 구조

이 폴더는 사이트에서 사용하는 모든 이미지를 저장합니다.

## 폴더 구조

```
images/
├── hero/              # 메인 페이지 히어로 이미지
│   └── main-hero.jpg  # 메인 페이지 배경 이미지 (21:9 비율 권장)
│
└── pages/             # 각 페이지별 히어로 이미지 (21:9 비율)
    ├── courses-hero.jpg
    ├── instructor-growth-hero.jpg
    ├── apply-hero.jpg
    ├── community-hero.jpg
    └── login-hero.jpg
```

## 이미지 규격

### 히어로 이미지 (Hero Images)
- **비율**: 21:9 (예: 2100px × 900px)
- **형식**: JPG, PNG, WebP
- **권장 해상도**: 
  - 데스크톱: 2560px × 1097px 이상
  - 모바일: 1080px × 463px 이상
- **파일 크기**: 500KB 이하 권장 (최적화 필요)

### 이미지 교체 방법

1. **메인 페이지 히어로 이미지 교체**
   - `hero/main-hero.jpg` 파일을 교체하세요
   - 파일명은 동일하게 유지하거나 `html/index.html`에서 경로를 수정하세요

2. **페이지별 히어로 이미지 교체**
   - 각 페이지의 `images/pages/` 폴더에 해당 이미지를 교체하세요
   - 예: `courses.html` → `pages/courses-hero.jpg`

## 이미지 최적화 팁

1. **압축**: TinyPNG, ImageOptim 등의 도구 사용
2. **WebP 형식**: 최신 브라우저 지원 시 WebP 사용 권장
3. **반응형 이미지**: `srcset` 속성 사용 고려

## 샘플 이미지

현재는 플레이스홀더 이미지를 사용 중입니다. 실제 이미지로 교체해주세요.

### 이미지 소스 추천
- Unsplash: https://unsplash.com
- Pexels: https://www.pexels.com
- Pixabay: https://pixabay.com

### 검색 키워드 예시
- "education", "online learning", "technology", "business", "workshop"


