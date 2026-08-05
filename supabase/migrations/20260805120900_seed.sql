-- ============================================================================
-- 009 · 시드 — 현재 운영 중인 강의
-- ============================================================================
-- js/store.js 의 FALLBACK_COURSES 와 같은 내용이다.
-- 폴백은 DB 응답 실패 시 화면이 비지 않게 하는 안전망일 뿐이고,
-- 이 행이 들어간 시점부터 정본은 courses 테이블이다.
-- ============================================================================

insert into public.courses (
    slug, title, subtitle, level, duration, schedule, host,
    price_text, capacity, capacity_text, status, sort_order
) values (
    'ai-automation-vibecoding-2026h2',
    'AI업무자동화 & 바이브코딩 통합 전문가 과정',
    '업무자동화에서 실제 서비스까지',
    '심화 · 6주',
    '60시간 (12회 × 5시간)',
    '2026.08.08 ZOOM 개강 · 주 2회',
    'KECA · 이룸아카데미',
    '기초 30만 · 심화 30만 · 전체 50만 (KECA 20%↓)',
    20,
    '20명 · 접수중',
    'open',
    10
)
on conflict (slug) do update set
    title         = excluded.title,
    subtitle      = excluded.subtitle,
    level         = excluded.level,
    duration      = excluded.duration,
    schedule      = excluded.schedule,
    host          = excluded.host,
    price_text    = excluded.price_text,
    capacity      = excluded.capacity,
    capacity_text = excluded.capacity_text,
    sort_order    = excluded.sort_order;
    -- ⚠ status 는 덮어쓰지 않는다.
    --   운영 중 'closed' 로 내린 강의가 마이그레이션 재실행만으로 다시 열리면 안 된다.


insert into public.course_options (course_id, name, description, price, sort_order)
select c.id, v.name, v.description, v.price, v.sort_order
  from public.courses c
  cross join (values
        ('기초', '기초 (8.8~8.29) · 30만원',              300000, 10),
        ('심화', '심화 (9.2~9.19) · 30만원',              300000, 20),
        ('전체', '전체 · 50만원 (KECA 20% 할인)',         500000, 30)
  ) as v(name, description, price, sort_order)
 where c.slug = 'ai-automation-vibecoding-2026h2'
on conflict (course_id, name) do update set
    description = excluded.description,
    price       = excluded.price,
    sort_order  = excluded.sort_order;


-- ============================================================================
-- 적용 후 반드시 할 일
-- ============================================================================
-- 1) 관리자로 쓸 Google 계정으로 사이트에 한 번 로그인한다 (profiles 행 생성).
-- 2) 아래를 SQL Editor 에서 실행해 관리자로 등록한다.
--
--      insert into public.admins (user_id, note)
--      select id, '대표' from auth.users where email = 'irum.ceo@gmail.com'
--      on conflict (user_id) do nothing;
--
-- 3) 검증한다. 세 줄 다 기대값이 나와야 한다.
--
--      select public.is_admin();                     -- 관리자 세션에서 true
--      select count(*) from public.applications;     -- 일반 회원 세션에서 본인 건만
--      select * from public.admins;                  -- anon/authenticated 로 실패해야 정상
-- ============================================================================
