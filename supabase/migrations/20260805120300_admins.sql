-- ============================================================================
-- 003 · 관리자 명단 · 권한 판정
-- ============================================================================
-- 기존 js/store.js 의 isAdmin() 은 "applications 를 읽을 수 있으면 관리자"로
-- 판정했다. RLS 가 "본인 건 select 허용"인 이상 일반 회원도 통과한다.
-- 그 방식을 폐기하고 여기서 정본을 만든다.
-- ============================================================================

create table if not exists public.admins (
    user_id     uuid primary key references auth.users(id) on delete cascade,
    note        text,
    created_at  timestamptz not null default now()
);

-- 명단 열거 원천 차단: RLS 를 켜되 정책을 하나도 만들지 않는다.
-- 정책이 0개면 select/insert/update/delete 가 전부 거부된다.
alter table public.admins enable row level security;

-- RLS 위에 권한까지 회수한다. 이중 방어.
-- (Supabase 는 public 스키마 신규 테이블에 기본 GRANT 를 걸어두므로 명시 회수가 필요하다)
revoke all on public.admins from anon, authenticated;


-- ── 권한 판정 함수 ──────────────────────────────────────────────────────────
-- SECURITY DEFINER 라서 위의 RLS·REVOKE 를 우회해 admins 를 읽는다.
-- private 스키마에 있으므로 PostgREST 가 라우팅하지 않는다 → RPC 로 못 닿는다.
--
-- search_path 를 고정하지 않으면 호출자가 자기 스키마를 앞에 끼워 넣어
-- 가짜 admins 테이블을 보게 만들 수 있다. SECURITY DEFINER 에서는 필수다.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1 from public.admins a where a.user_id = auth.uid()
    );
$$;

grant execute on function private.is_admin() to authenticated, anon, service_role;


-- ── 클라이언트용 공개 RPC ───────────────────────────────────────────────────
-- js/store.js 의 isAdmin() 이 이것 하나만 호출한다.
--
-- ⚠ 이 값은 UI 힌트일 뿐 보안 경계가 아니다.
--    응답을 조작해 true 로 만들어도 실제 데이터는 RLS 가 막는다.
--    관리자 화면이 "열리는 것"과 "데이터가 보이는 것"은 별개다.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
    select private.is_admin();
$$;

grant execute on function public.is_admin() to authenticated;
revoke execute on function public.is_admin() from anon;


-- ── 최초 관리자 등록 (수동) ─────────────────────────────────────────────────
-- 관리자로 쓸 Google 계정으로 사이트에 한 번 로그인한 뒤,
-- Supabase SQL Editor 에서 아래를 실행한다.
--
--   insert into public.admins (user_id, note)
--   select id, '대표'
--     from auth.users
--    where email = 'irum.ceo@gmail.com'
--   on conflict (user_id) do nothing;
--
-- ⚠ 관리자 계정 탈취 = 전 회원 개인정보 유출이다.
--    해당 Google 계정에 2단계 인증을 반드시 켜고, 명단은 최소 인원으로 유지한다.
