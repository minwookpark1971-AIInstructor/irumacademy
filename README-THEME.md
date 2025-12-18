# Teachable급 컬러 시스템 가이드

## 개요

이 프로젝트는 Teachable.com에서 영감을 받은 토큰 기반 컬러 시스템을 사용합니다. 색상은 CSS 변수로 관리되며, 모든 페이지에서 일관되게 적용됩니다.

## 구조

```
src/theme/
├── tokens.ts              # 디자인 토큰 타입 및 변환 함수
├── theme.css              # CSS 변수 정의 (자동 생성)
└── teachable.sample.json  # 추출된 Teachable 색상 데이터
```

## 사용 방법

### 1. 색상 추출

Teachable.com에서 색상을 자동으로 추출:

```bash
npm run theme:extract
```

이 명령어는 다음 페이지에서 색상을 추출합니다:
- https://www.teachable.com/
- https://www.teachable.com/pricing
- https://www.teachable.com/features
- https://www.teachable.com/blog

결과는 `src/theme/teachable.sample.json`에 저장됩니다.

### 2. 테마 적용

추출된 색상을 CSS 변수로 변환하여 적용:

```bash
npm run theme:apply
```

### 3. 전체 설정

색상 추출과 적용을 한 번에 실행:

```bash
npm run theme:setup
```

## 수동 색상 추출

Playwright 스크립트가 작동하지 않을 경우, `docs/color-capture.md`를 참고하여 Chrome DevTools로 수동 추출할 수 있습니다.

## 토큰 카테고리

### Backgrounds
- `--bg`: 메인 배경색
- `--surface`: 카드/섹션 배경
- `--surface-2`: 보조 표면

### Text
- `--text`: 본문 텍스트
- `--text-muted`: 회색 텍스트
- `--heading`: 제목 텍스트

### Navigation
- `--nav-bg`: 네비게이션 배경
- `--nav-link`: 네비게이션 링크
- `--nav-link-scrolled`: 스크롤 시 네비게이션 링크

### Links
- `--link`: 링크 색상
- `--link-hover`: 링크 호버 색상

### Primary (CTA)
- `--primary`: Primary 버튼 배경
- `--primary-foreground`: Primary 버튼 텍스트
- `--primary-hover`: Primary 버튼 호버
- `--primary-active`: Primary 버튼 활성
- `--primary-focus`: Primary 버튼 포커스

### Secondary
- `--secondary`: Secondary 버튼 배경
- `--secondary-foreground`: Secondary 버튼 텍스트
- `--secondary-hover`: Secondary 버튼 호버

### Borders
- `--border`: 기본 테두리
- `--border-muted`: 회색 테두리

### Status
- `--success`: 성공 상태
- `--warning`: 경고 상태
- `--danger`: 위험/에러 상태

## Tailwind에서 사용

토큰은 Tailwind 설정에 매핑되어 있어 다음과 같이 사용할 수 있습니다:

```tsx
// 배경
<div className="bg-bg">...</div>
<div className="bg-surface">...</div>

// 텍스트
<p className="text-text">...</p>
<p className="text-text-muted">...</p>
<h1 className="text-heading">...</h1>

// 버튼
<button className="bg-primary text-primary-foreground hover:bg-primary-hover">
  Click me
</button>

// 링크
<a href="#" className="text-link hover:text-link-hover">Link</a>
```

## CSS 변수 직접 사용

Tailwind 클래스 대신 CSS 변수를 직접 사용할 수도 있습니다:

```tsx
<div style={{ backgroundColor: 'var(--bg)' }}>...</div>
<p style={{ color: 'var(--text)' }}>...</p>
```

## 페이지별 적용 가이드

### 홈 (/)
- Hero 배경: `bg-bg` + 약한 그라데이션
- 메인 CTA: `bg-primary`
- 보조 CTA: `border-secondary`

### /courses
- 카드: `bg-surface` + `border-border`
- 필터 활성: `bg-primary/10`
- 탭 활성: `text-primary` + `border-primary`

### /courses/[slug]
- 스티키 카드: `bg-surface-2` + `border-border`
- 섹션 제목: `text-heading`
- CTA: `bg-primary`

### /instructor-growth
- 로드맵 단계: `bg-surface-2`
- 현재 단계: `bg-primary/10` + `border-primary`

### /apply
- 진행바: `bg-primary`
- 에러 메시지: `text-danger`

### /community
- 탭 활성: `text-primary`
- 배지: `bg-surface` + `text-primary`

### /auth/*
- 폼 카드: `bg-surface-2`
- Primary 버튼: `bg-primary`

## 컬러 비율 가이드

- **60%**: 밝은 배경/표면 (bg, surface)
- **30%**: 텍스트·구조 (text, border, nav)
- **10%**: 포인트 (primary, link)

## 접근성

모든 색상은 WCAG AA 대비 기준을 준수합니다. 텍스트와 배경의 대비 비율은 최소 4.5:1입니다.

## 다크 모드

현재는 라이트 모드만 지원합니다. 다크 모드는 향후 확장 예정입니다.

