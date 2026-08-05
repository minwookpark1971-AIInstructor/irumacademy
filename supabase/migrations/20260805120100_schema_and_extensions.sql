-- ============================================================================
-- 001 · 스키마 · 확장 · 공통 유틸
-- ============================================================================
-- 이 디렉터리의 모든 마이그레이션은 멱등(idempotent)하다.
-- SQL Editor 에서 손으로 다시 실행하는 일이 반드시 생기기 때문이다.
--
-- 파일명 타임스탬프 순서 = 의존 순서. 순서를 바꿔 실행하면 실패한다.
-- ============================================================================

-- gen_random_uuid(), gen_random_bytes() 를 쓴다.
create extension if not exists pgcrypto with schema extensions;


-- ── private 스키마 ──────────────────────────────────────────────────────────
-- 보안 헬퍼 함수가 사는 곳이다.
--
-- 왜 public 이 아닌가: PostgREST 는 노출 스키마(public, graphql_public)만
-- 라우팅한다. private 에 둔 함수는 REST/RPC 로 도달할 수 없다.
--
-- ⚠ Supabase 대시보드의 `Exposed schemas` 설정에 private 을 추가하면
--    이 방어가 통째로 무너진다. 절대 추가하지 않는다.
create schema if not exists private;

-- ⚠ 여기서 authenticated/anon 의 USAGE 를 회수하면 안 된다.
--    RLS 정책 표현식은 "질의하는 사용자"의 권한으로 평가되므로,
--    USAGE 가 없으면 정책이 permission denied 로 터지고 사이트 전체가 죽는다.
--    보호는 "권한 회수"가 아니라 "PostgREST 미노출"이 담당한다.
grant usage on schema private to authenticated, anon, service_role;


-- ── updated_at 자동 갱신 ────────────────────────────────────────────────────
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;


-- ── 광고 발송 가능 시각 ─────────────────────────────────────────────────────
-- 정보통신망법: 21시~08시 광고성 정보 전송은 별도 동의가 필요하다.
-- 별도 동의를 받지 않으므로 그 시간대를 아예 피한다.
--
-- ⚠ 서버 타임존은 UTC 다. Asia/Seoul 로 명시하지 않으면 9시간 어긋난다.
create or replace function private.next_ad_window(at_ts timestamptz default now())
returns timestamptz
language plpgsql
immutable
as $$
declare
    kst   timestamp;   -- 한국 시각 (naive)
    h     int;
begin
    kst := at_ts at time zone 'Asia/Seoul';
    h   := extract(hour from kst)::int;

    if h >= 21 then
        -- 오늘 21시 이후 → 내일 08시
        return ((date_trunc('day', kst) + interval '1 day' + interval '8 hour')
                at time zone 'Asia/Seoul');
    elsif h < 8 then
        -- 오늘 08시 이전 → 오늘 08시
        return ((date_trunc('day', kst) + interval '8 hour')
                at time zone 'Asia/Seoul');
    end if;

    return at_ts;
end;
$$;

grant execute on function private.next_ad_window(timestamptz) to service_role;
