-- ============================================================================
-- 002 · 도메인 · 지역 조회 테이블
-- ============================================================================

-- ── 직업 구분 ───────────────────────────────────────────────────────────────
-- profiles 와 applications 두 테이블에 "같은" 제약이 필요하다.
-- CHECK 를 두 벌 쓰면 한쪽만 고치는 사고가 반드시 난다. DOMAIN 이면 한 곳이다.
do $$
begin
    create domain public.occupation as text
        check (value in ('instructor', 'aspiring', 'other'));
exception
    when duplicate_object then null;
end
$$;

comment on domain public.occupation is
    'instructor=강사, aspiring=강사희망자, other=기타. 표시 라벨은 js/store.js 의 JOB_LABEL 이 소유한다.';


-- ── 오프라인 참여 가능 여부 ─────────────────────────────────────────────────
-- 2택(가능/불가)으로 강제하면 미정인 사람이 낙관 편향으로 "가능"을 골라
-- 이 필드의 존재 이유(강의장 규모·자료 수량 산정)가 무너진다.
-- "미정"은 그 자체로 수동 발송의 첫 세그먼트가 된다.
do $$
begin
    create domain public.offline_pref as text
        check (value in ('yes', 'online_only', 'undecided'));
exception
    when duplicate_object then null;
end
$$;


-- ── 지역 (시·도 1단) ────────────────────────────────────────────────────────
-- enum 이 아닌 조회 테이블인 이유:
--   · 행정구역 개편이 실재한다 (세종시 신설, 강원·전북 특별자치도 전환 등).
--     enum 은 값 개명이 불가능하다.
--   · sort_order·표시명을 DB 가 가지면 드롭다운이 제약과 절대 어긋나지 않는다.
create table if not exists public.regions (
    code        text primary key,
    name        text        not null,
    sort_order  int         not null default 0,
    active      boolean     not null default true
);

insert into public.regions (code, name, sort_order) values
    ('seoul',    '서울특별시',       10),
    ('busan',    '부산광역시',       20),
    ('daegu',    '대구광역시',       30),
    ('incheon',  '인천광역시',       40),
    ('gwangju',  '광주광역시',       50),
    ('daejeon',  '대전광역시',       60),
    ('ulsan',    '울산광역시',       70),
    ('sejong',   '세종특별자치시',   80),
    ('gyeonggi', '경기도',           90),
    ('gangwon',  '강원특별자치도',  100),
    ('chungbuk', '충청북도',        110),
    ('chungnam', '충청남도',        120),
    ('jeonbuk',  '전북특별자치도',  130),
    ('jeonnam',  '전라남도',        140),
    ('gyeongbuk','경상북도',        150),
    ('gyeongnam','경상남도',        160),
    ('jeju',     '제주특별자치도',  170),
    ('overseas', '기타 / 해외',     999)
on conflict (code) do update
    set name       = excluded.name,
        sort_order = excluded.sort_order;
