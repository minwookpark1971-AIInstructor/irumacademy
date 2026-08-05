-- ============================================================================
-- 006 · applications — 신청 시점 스냅샷
-- ============================================================================

create table if not exists public.applications (
    id                uuid primary key default gen_random_uuid(),
    user_id           uuid        not null references auth.users(id) on delete cascade,

    course_id         uuid        not null references public.courses(id),
    option_id         uuid        references public.course_options(id),

    -- ── 스냅샷 (신청 시점에 고정. 이후 강의·프로필이 바뀌어도 따라가지 않는다) ──
    course_title      text,
    option_name       text,
    option_price      integer,

    name              text        not null,
    phone             text        not null,
    account_email     text,                    -- Google 계정 이메일
    contact_email     text,                    -- 실제 수신 이메일
    organization      text,                    -- 신청 건별로 다를 수 있어 profiles 엔 두지 않는다
    occupation        public.occupation,
    region_code       text        references public.regions(code),
    offline_available public.offline_pref,

    -- ── 동의 ────────────────────────────────────────────────────────────────
    agreed_privacy      boolean     not null default false,
    agreed_privacy_at   timestamptz,
    agreed_marketing    boolean     not null default false,
    agreed_marketing_at timestamptz,

    status            text        not null default 'received'
                                  check (status in ('received', 'payment_confirmed',
                                                    'confirmed', 'cancelled')),

    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now(),

    -- 필수 동의 없이 행이 존재할 수 없게 만든다.
    -- 애플리케이션 레이어에만 두면 SQL Editor 직접 INSERT 로 우회된다.
    constraint applications_privacy_required check (agreed_privacy)
);

-- 같은 강의 중복 신청 방지. 취소 건은 재신청을 허용해야 하므로 부분 인덱스다.
-- 위반 시 23505 → js/store.js 가 '이미 신청하신 과정입니다.' 로 번역한다.
create unique index if not exists applications_active_uniq
    on public.applications (user_id, course_id)
    where status <> 'cancelled';

create index if not exists applications_created_idx on public.applications (created_at desc);
create index if not exists applications_course_idx  on public.applications (course_id, status);
create index if not exists applications_user_idx    on public.applications (user_id);

drop trigger if exists applications_touch on public.applications;
create trigger applications_touch
    before update on public.applications
    for each row execute function private.touch_updated_at();


-- ============================================================================
-- 신청 검증 트리거
-- ============================================================================
-- ⚠⚠ SECURITY DEFINER 가 필수다. 이 계획 전체에서 가장 놓치기 쉬운 버그다.
--
--    일반 트리거의 count(*) 는 RLS 가 적용된 상태로 실행된다.
--    applications 의 select 정책이 "본인 건만"이므로, 정원을 세면
--    **자기 신청 건만 세어져 정원 체크가 항상 통과한다.**
--    SECURITY DEFINER 여야 전체 행을 본다.
--
-- 동시성: 같은 강의에 동시 신청이 몰리면 count 가 둘 다 통과할 수 있다.
--         courses 행을 FOR UPDATE 로 잠가 같은 강의 신청을 직렬화한다.
-- ============================================================================
create or replace function private.validate_application()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
    c        public.courses%rowtype;
    opt      public.course_options%rowtype;
    taken    integer;
    uid      uuid := auth.uid();
    uemail   text;
begin
    if uid is null then
        raise exception 'AUTH_REQUIRED';
    end if;

    -- 클라이언트가 보낸 user_id 는 신뢰하지 않는다.
    new.user_id := uid;

    -- 상태는 언제나 접수부터 시작한다.
    -- (anon key 로 status='confirmed' 를 밀어 넣는 경로를 여기서 끊는다)
    new.status := 'received';

    -- ── 강의 조회 + 잠금 ────────────────────────────────────────────────────
    select * into c from public.courses where id = new.course_id for update;
    if not found then
        raise exception 'COURSE_CLOSED';
    end if;
    if c.status <> 'open' then
        raise exception 'COURSE_CLOSED';
    end if;
    if c.apply_opens_at is not null and now() < c.apply_opens_at then
        raise exception 'APPLY_NOT_STARTED';
    end if;
    if c.apply_closes_at is not null and now() > c.apply_closes_at then
        raise exception 'APPLY_CLOSED';
    end if;

    -- ── 옵션 검증 ───────────────────────────────────────────────────────────
    if new.option_id is not null then
        select * into opt
          from public.course_options
         where id = new.option_id and course_id = new.course_id and active;
        if not found then
            raise exception 'OPTION_INVALID';
        end if;
        new.option_name  := opt.name;
        new.option_price := opt.price;
    end if;

    -- ── 정원 ────────────────────────────────────────────────────────────────
    if c.capacity is not null then
        select count(*) into taken
          from public.applications
         where course_id = new.course_id and status <> 'cancelled';
        if taken >= c.capacity then
            raise exception 'CAPACITY_FULL';
        end if;
    end if;

    -- ── 스냅샷 채우기 ───────────────────────────────────────────────────────
    new.course_title := c.title;

    select email into uemail from auth.users where id = uid;
    new.account_email := coalesce(uemail, '');
    new.contact_email := lower(trim(coalesce(nullif(new.contact_email, ''), uemail, '')));

    if new.agreed_privacy and new.agreed_privacy_at is null then
        new.agreed_privacy_at := now();
    end if;
    if new.agreed_marketing and new.agreed_marketing_at is null then
        new.agreed_marketing_at := now();
    end if;

    return new;
end;
$$;

drop trigger if exists applications_validate on public.applications;
create trigger applications_validate
    before insert on public.applications
    for each row execute function private.validate_application();


-- ============================================================================
-- 신청 후처리 — profiles 정본 upsert
-- ============================================================================
-- 단방향 동기화다. 신청 → 프로필(최신값). 프로필 수정 → 과거 신청서는 건드리지 않는다.
create or replace function private.sync_profile_from_application()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
    update public.profiles
       set name              = coalesce(new.name,              name),
           phone             = coalesce(new.phone,             phone),
           contact_email     = coalesce(new.contact_email,     contact_email),
           occupation        = coalesce(new.occupation,        occupation),
           region_code       = coalesce(new.region_code,       region_code),
           offline_available = coalesce(new.offline_available, offline_available)
     where id = new.user_id;

    -- 광고 수신동의는 "동의한 경우에만" 켠다.
    -- 신청서에서 체크를 안 했다고 기존 동의를 철회로 해석하면 안 된다.
    -- 철회는 마이페이지·수신거부 링크라는 명시적 경로로만 일어난다.
    if new.agreed_marketing then
        update public.profiles
           set marketing_opt_in    = true,
               marketing_opt_in_at = coalesce(new.agreed_marketing_at, now()),
               marketing_opt_out_at = null
         where id = new.user_id and not marketing_opt_in;

        insert into public.marketing_consent_log (user_id, email, action, source)
        values (new.user_id, new.contact_email, 'opt_in', 'apply_form');
    end if;

    return new;
end;
$$;

-- 트리거 등록은 007(마케팅·메일 테이블) 이후에 해야 한다.
-- marketing_consent_log 를 참조하기 때문이다. → 007 끝에서 붙인다.


-- ============================================================================
-- 수정 제한 — 스냅샷은 불변, 상태만 관리자가 바꾼다
-- ============================================================================
create or replace function private.guard_application_update()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
    if not private.is_admin() then
        raise exception 'FORBIDDEN';
    end if;

    -- 관리자라도 스냅샷은 못 고친다. 신청 시점 기록으로서의 가치가 사라진다.
    new.id                := old.id;
    new.user_id           := old.user_id;
    new.course_id         := old.course_id;
    new.option_id         := old.option_id;
    new.course_title      := old.course_title;
    new.option_name       := old.option_name;
    new.option_price      := old.option_price;
    new.name              := old.name;
    new.phone             := old.phone;
    new.account_email     := old.account_email;
    new.contact_email     := old.contact_email;
    new.organization      := old.organization;
    new.occupation        := old.occupation;
    new.region_code       := old.region_code;
    new.offline_available := old.offline_available;
    new.agreed_privacy    := old.agreed_privacy;
    new.agreed_privacy_at := old.agreed_privacy_at;
    new.agreed_marketing  := old.agreed_marketing;
    new.agreed_marketing_at := old.agreed_marketing_at;
    new.created_at        := old.created_at;

    return new;
end;
$$;

drop trigger if exists applications_guard on public.applications;
create trigger applications_guard
    before update on public.applications
    for each row execute function private.guard_application_update();
