-- ============================================================================
-- 005 · courses · course_options
-- ============================================================================

create table if not exists public.courses (
    id              uuid primary key default gen_random_uuid(),

    -- ⚠ slug 는 생성 후 변경 금지다.
    --   apply.html 의 ?course=slug 와 sessionStorage['irum:pendingSlug'] 가 참조한다.
    --   바꾸면 이미 공유된 신청 링크가 죽는다. 관리자 UI 에서 잠근다.
    slug            text        not null unique,

    title           text        not null,
    subtitle        text,
    level           text,
    duration        text,
    schedule        text,
    host            text,
    price_text      text,
    capacity_text   text,

    -- 정원. null 이면 무제한으로 취급한다.
    capacity        integer,

    status          text        not null default 'draft'
                                check (status in ('draft', 'open', 'closed')),

    apply_opens_at  timestamptz,
    apply_closes_at timestamptz,

    sort_order      integer     not null default 0,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists courses_status_idx on public.courses (status, sort_order);

drop trigger if exists courses_touch on public.courses;
create trigger courses_touch
    before update on public.courses
    for each row execute function private.touch_updated_at();


-- 삭제는 제공하지 않는다. status='closed' 로 충분하고,
-- 신청 이력이 걸린 강의를 하드 삭제하면 참조가 깨진다.


create table if not exists public.course_options (
    id          uuid primary key default gen_random_uuid(),
    course_id   uuid        not null references public.courses(id) on delete cascade,
    name        text        not null,          -- '기초' / '심화' / '전체'
    description text,                          -- 드롭다운에 보이는 긴 라벨
    price       integer     not null default 0,
    sort_order  integer     not null default 0,
    active      boolean     not null default true,
    created_at  timestamptz not null default now(),

    unique (course_id, name)
);

create index if not exists course_options_course_idx
    on public.course_options (course_id, sort_order);
