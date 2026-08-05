# Supabase 스키마

`migrations/` 의 파일명 타임스탬프 순서가 **곧 의존 순서**다. 순서를 바꿔 실행하면 실패한다.

| 파일 | 내용 |
|---|---|
| `..0100_schema_and_extensions` | `private` 스키마, pgcrypto, `updated_at` 유틸, 야간 발송 보정 |
| `..0200_domains_and_regions` | `occupation`·`offline_pref` 도메인, `regions` 17+1 |
| `..0300_admins` | `admins` 테이블, `private.is_admin()`, `public.is_admin()` RPC |
| `..0400_profiles` | 회원 정본, 첫 로그인 트리거, 누락 백필 |
| `..0500_courses` | `courses`, `course_options` |
| `..0600_applications` | 신청 스냅샷 + **정원·기간 검증 트리거** |
| `..0700_marketing_and_email` | 동의 증빙, 수신거부 토큰, 메일 큐(outbox) |
| `..0800_rls_policies` | **실제 보안 경계** |
| `..0900_seed` | 현재 운영 강의 |

전부 멱등하다. 다시 실행해도 안전하다.

## 적용 방법

**A. 대시보드 (권장 — CLI 설치 불필요)**

Supabase → `SQL Editor` → 파일을 **번호 순서대로** 하나씩 붙여넣고 실행.
각 파일마다 `Success. No rows returned` 를 확인하고 다음으로 넘어간다.

**B. CLI**

```bash
supabase link --project-ref tdayexcmksjfryhthyfz
supabase db push
```

## 적용 직후 필수 절차

1. 관리자로 쓸 Google 계정으로 사이트에 **한 번 로그인** (profiles 행이 생긴다)
2. SQL Editor 에서 관리자 등록:
   ```sql
   insert into public.admins (user_id, note)
   select id, '대표' from auth.users where email = 'irum.ceo@gmail.com'
   on conflict (user_id) do nothing;
   ```
3. Auth → Providers → **Google 켜짐 / Email 꺼짐** 확인

## 절대 하지 말 것

- **`Exposed schemas` 에 `private` 추가** — 권한 판정 함수가 RPC로 노출되어 방어가 무너진다. `public, graphql_public` 로 고정한다.
- **`service_role` key 를 브라우저·저장소·GitHub Variables 에 넣기** — RLS를 전부 우회한다.
- **뷰를 `security_invoker` 없이 만들기** — Postgres 뷰는 기본이 정의자 권한이라 RLS를 우회한다. 뷰는 RLS의 구멍이다.

## 침투 테스트

anon key 만 들고 curl 로 확인한다. 괄호 안이 기대 결과다.

```bash
SB=https://tdayexcmksjfryhthyfz.supabase.co
KEY=<anon key>

curl -s "$SB/rest/v1/admins?select=*"            -H "apikey: $KEY"   # 거부
curl -s "$SB/rest/v1/profiles?select=*"          -H "apikey: $KEY"   # 0행
curl -s "$SB/rest/v1/courses?status=eq.draft"    -H "apikey: $KEY"   # 0행
curl -s "$SB/rest/v1/unsubscribe_tokens?select=*" -H "apikey: $KEY"  # 거부
```

로그인한 일반 회원 JWT 로:
- `POST /rest/v1/applications` 에 `status=confirmed` → 저장 결과가 `received` 로 강제되어야 한다
- `POST /functions/v1/send-email` → **403** (Phase 6 이후)

## 백업

free 플랜에는 PITR 이 없다(7일 자동 백업만). **DB가 날아가면 마케팅 동의 증빙도 같이 날아간다.**
월 1회 `pg_dump` 수동 백업을 운영 절차에 넣는다.
