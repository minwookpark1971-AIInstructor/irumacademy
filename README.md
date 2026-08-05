# 이룸아카데미

AI 전문강사 양성 과정 사이트. **빌드 없는 정적 사이트 + Supabase** 구조다.

- 라이브: https://www.irumcompany.co.kr
- 호스팅: GitHub Pages (`CNAME`, `.nojekyll`)
- 백엔드: Supabase (Postgres + Auth + Edge Functions)

## 왜 정적인가

번들러도 프레임워크도 쓰지 않는다. 페이지를 열면 그게 곧 배포된 결과물이고,
`git push` 외에 배포 절차가 없다. 인증·데이터·메일은 전부 Supabase가 맡는다.

> ⚠ **`.nojekyll` 때문에 저장소의 모든 파일이 그대로 웹에 서빙된다.**
> 운영 메모·설정 절차·자격증명이 담긴 문서를 저장소에 두면 즉시 공개된다.
> 그런 문서는 `/ops/`에 두고 `.gitignore`로 막는다.

## 구조

```
irumacademy/
├── index.html              # 진입점 (html/index.html 로 리다이렉트)
├── css/
│   ├── modernist.css       # ★ 디자인 시스템 단일 소스
│   ├── main.css            #   구 스타일 (레거시 페이지용)
│   └── animations.css
├── js/
│   ├── config.js           # ★ Supabase URL·anon key. 비어 있으면 local 모드
│   ├── store.js            # ★ 데이터·인증 계층 단일 진입점 (window.IRUM)
│   ├── components.js       # 공통 헤더·푸터 주입
│   └── ...                 # 레거시: auth.js, oauth-config.js, courses*.js
├── html/
│   ├── index.html          # 홈
│   ├── about.html          # 회사소개
│   ├── instructor-growth.html  # 전문강사 성장 프로그램
│   ├── apply.html          # 강의 신청
│   ├── admin.html          # 관리자
│   ├── privacy.html / terms.html
│   └── courses/            # 강의 상세
├── supabase/
│   └── migrations/         # 스키마·RLS (타임스탬프 순 = 의존 순)
└── ops/                    # 운영 문서 (커밋 안 됨)
```

## 디자인 시스템 — Modernist

`css/modernist.css`가 단일 소스다. 페이지에서 임의로 값을 쓰지 않고 여기 정의된
토큰·유틸리티를 쓴다.

| | |
|---|---|
| 강조색 | `#ec3013` (레드) |
| 서체 | Archivo (라틴) + Pretendard (한글) |
| 라운드 | `0` — 모든 모서리가 직각이다 |
| 선 | `2px` 규칙 |

주의:
- `.gap-6` / `.gap-8` 은 **없다** (`gap-2/3/4/5`만). 쓰면 조용히 `gap:0`이 된다.
- `.dot`은 반드시 `input`의 **바로 다음 형제**여야 한다 (`input:checked + .dot`).
- `.seg`는 `:has()`를 쓴다 — 구형 사파리에서 선택 표시가 안 되므로 폼 입력에는 쓰지 않는다.

## 데이터 계층 — `js/store.js`

페이지 코드는 Supabase를 직접 부르지 않는다. 전부 `window.IRUM`을 거친다.
키 교체나 백엔드 전환이 이 파일 하나 수정으로 끝나야 하기 때문이다.

두 모드로 동작한다.

| 모드 | 조건 | 동작 |
|---|---|---|
| `supabase` | `js/config.js`에 URL·anon key가 채워짐 | 실제 Google 로그인 + DB |
| `local` | 설정이 비어 있음 | `localStorage` 저장, 로그인은 이메일 입력으로 대체 |

> ⚠ **`local` 모드는 화면 확인 전용이다.** 이 모드의 신청 데이터는 신청자 브라우저에만
> 남아 관리자가 볼 수 없고, 권한 개념이 없어 관리자 화면이 누구에게나 열린다.
> 실서비스 배포 전 `js/config.js`를 반드시 채운다.

`anon key`는 공개돼도 안전하다. 브라우저에 배포되도록 설계된 신분증이며 접근 통제는
전부 Postgres RLS가 담당한다. **`service_role` key는 RLS를 전부 우회하므로 절대 넣지 않는다.**

## 로컬 실행

```bash
python -m http.server 8137
```

`http://localhost:8137` 로 연다. **`file://`로 열면 안 된다** — origin이 `null`이라
OAuth와 CORS가 깨진다.

## 설정

Supabase·Google OAuth·Gmail 설정 절차는 `ops/PHASE0-설정-체크리스트.md`에 있다
(저장소에 커밋되지 않는 로컬 문서다).

## 레거시

아래는 Vercel + Node 백엔드를 쓰던 시절의 잔재이며 현재 경로에서 쓰이지 않는다.
정리 대상이다.

- `server.js`, `api/`, `vercel.json`, `package.json`
- `js/auth.js`, `js/oauth-config.js`
- `개인정보처리방침.txt`, `이용약관.txt` — `html/privacy.html`·`html/terms.html`의 사본
