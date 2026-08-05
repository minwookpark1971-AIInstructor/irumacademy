-- ============================================================================
-- 004 · profiles — 회원 정본
-- ============================================================================
-- Google 로그인 = 회원등록. auth.users 에 행이 생기면 트리거가 여기 정본을 만든다.
--
-- profiles(정본) 와 applications(스냅샷) 을 둘 다 두는 이유:
--   · 마케팅 세그먼트("경기 강사희망자에게 차기 기수 안내")는 최신값이어야 한다.
--   · 1기 명단을 뽑으면 그때 그 값이 나와야 한다.
-- 동기화는 단방향이다. 신청 제출 → applications 스냅샷 + profiles upsert.
-- 역방향(profiles 수정이 과거 신청서에 반영)은 006 의 트리거가 막는다.
-- ============================================================================

create table if not exists public.profiles (
    id                  uuid primary key references auth.users(id) on delete cascade,

    -- Google 계정 이메일. 불변이며 로그인 신원 그 자체다.
    account_email       text        not null,
    -- 수신 이메일. 편집 가능하다.
    -- 요구사항에 "이메일주소"가 별도로 있다는 건 계정 이메일 ≠ 수신 이메일 상황을
    -- 상정했다는 신호다. 다만 컬럼을 나누되 발송 코드는 contact_email 하나만 본다
    -- (분기가 생기면 분기에 버그가 산다).
    contact_email       text,

    name                text,
    phone               text,
    occupation          public.occupation,
    region_code         text        references public.regions(code),
    offline_available   public.offline_pref,

    -- 광고성 정보 수신동의. 개인정보 수집동의와 물리적으로 별개다.
    marketing_opt_in    boolean     not null default false,
    marketing_opt_in_at timestamptz,          -- 2년 재확인 의무 대응. 없으면 2년 뒤 대응 불가.
    marketing_opt_out_at timestamptz,

    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

-- 재실행 안전: 이후 버전에서 컬럼을 늘릴 때를 위한 자리
alter table public.profiles add column if not exists contact_email text;

create index if not exists profiles_marketing_idx
    on public.profiles (marketing_opt_in) where marketing_opt_in;
create index if not exists profiles_region_idx      on public.profiles (region_code);
create index if not exists profiles_occupation_idx  on public.profiles (occupation);

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
    before update on public.profiles
    for each row execute function private.touch_updated_at();


-- ── account_email 불변 보장 ─────────────────────────────────────────────────
-- 회원이 자기 profiles 를 update 할 수 있으므로(RLS), 계정 이메일을 남의 것으로
-- 바꿔 신원을 위장하는 경로를 막는다.
create or replace function private.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
    if new.account_email is distinct from old.account_email then
        new.account_email := old.account_email;
    end if;
    if new.id is distinct from old.id then
        raise exception 'PROFILE_ID_IMMUTABLE';
    end if;

    -- 수신동의 상태가 바뀌면 시각을 자동 기록한다.
    -- 애플리케이션이 잊어도 증빙이 남아야 한다 — 입증 책임이 사업자에게 있다.
    if new.marketing_opt_in and not old.marketing_opt_in then
        new.marketing_opt_in_at := now();
    elsif old.marketing_opt_in and not new.marketing_opt_in then
        new.marketing_opt_out_at := now();
    end if;

    return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard
    before update on public.profiles
    for each row execute function private.guard_profile_update();


-- ── 첫 로그인 시 프로필 자동 생성 ───────────────────────────────────────────
-- ⚠ 예외를 절대 밖으로 던지지 않는다.
--    auth.users 의 INSERT 트리거에서 예외가 나면 회원가입 자체가 실패한다.
--    "프로필 없는 회원이 조용히 생기는 것"보다 "로그인이 안 되는 것"이 훨씬 나쁘다.
--    대신 아래 backfill 함수와 대시보드 점검으로 잡는다.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
    insert into public.profiles (id, account_email, contact_email, name)
    values (
        new.id,
        coalesce(new.email, ''),
        coalesce(new.email, ''),
        coalesce(
            new.raw_user_meta_data ->> 'full_name',
            new.raw_user_meta_data ->> 'name',
            split_part(coalesce(new.email, ''), '@', 1)
        )
    )
    on conflict (id) do nothing;

    return new;
exception
    when others then
        raise warning '[irum] handle_new_user 실패 (user=%): %', new.id, sqlerrm;
        return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function private.handle_new_user();


-- ── 누락 프로필 백필 ────────────────────────────────────────────────────────
-- 트리거가 예외를 삼키므로 프로필 없는 회원이 생길 수 있다.
-- 관리자 대시보드가 이 함수를 호출해 복구한다. 반환값 = 복구한 건수.
create or replace function public.backfill_missing_profiles()
returns integer
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
    n integer;
begin
    if not private.is_admin() then
        raise exception 'FORBIDDEN';
    end if;

    insert into public.profiles (id, account_email, contact_email, name)
    select u.id,
           coalesce(u.email, ''),
           coalesce(u.email, ''),
           coalesce(u.raw_user_meta_data ->> 'full_name',
                    u.raw_user_meta_data ->> 'name',
                    split_part(coalesce(u.email, ''), '@', 1))
      from auth.users u
      left join public.profiles p on p.id = u.id
     where p.id is null;

    get diagnostics n = row_count;
    return n;
end;
$$;

grant execute on function public.backfill_missing_profiles() to authenticated;
revoke execute on function public.backfill_missing_profiles() from anon;


-- ── 프로필 누락 건수 (대시보드 점검용) ──────────────────────────────────────
create or replace function public.count_missing_profiles()
returns integer
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
    n integer;
begin
    if not private.is_admin() then
        raise exception 'FORBIDDEN';
    end if;

    select count(*) into n
      from auth.users u
      left join public.profiles p on p.id = u.id
     where p.id is null;

    return n;
end;
$$;

grant execute on function public.count_missing_profiles() to authenticated;
revoke execute on function public.count_missing_profiles() from anon;
