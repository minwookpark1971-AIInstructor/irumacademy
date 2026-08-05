-- ============================================================================
-- 007 · 마케팅 동의 증빙 · 수신거부 · 메일 큐
-- ============================================================================
-- 정보통신망법 제50조가 요구하는 것들:
--   사전 수신동의(개인정보 동의와 분리) · 제목 앞 '(광고)' · 발신자 명칭·주소·연락처
--   · 수신거부 수단 · 야간(21~08) 별도 동의 · 2년마다 동의 재확인 · 동의 증빙 보관
--
-- ⚠ "동의받았음을 입증할 책임이 사업자에게 있다." 증빙이 코드가 아니라 DB 에 남아야 한다.
-- ============================================================================

-- ── 동의 증빙 ───────────────────────────────────────────────────────────────
create table if not exists public.marketing_consent_log (
    id          bigint generated always as identity primary key,
    user_id     uuid        references auth.users(id) on delete set null,
    email       text,
    action      text        not null check (action in ('opt_in', 'opt_out')),
    source      text        not null,   -- apply_form | mypage | unsubscribe_link | admin
    ip          inet,
    user_agent  text,
    created_at  timestamptz not null default now()
);

create index if not exists marketing_consent_user_idx
    on public.marketing_consent_log (user_id, created_at desc);


-- ── 수신거부 토큰 ───────────────────────────────────────────────────────────
-- HMAC 이 아니라 DB 저장 랜덤 256비트를 쓴다.
-- 근거: 수신거부 링크는 법적으로 영구 유효해야 한다.
--       HMAC 에 만료를 안 넣으면 개별 폐기가 불가능하고,
--       넣으면 6개월 전 메일의 링크가 죽어 요건 위반이 된다.
create table if not exists public.unsubscribe_tokens (
    user_id    uuid primary key references auth.users(id) on delete cascade,
    token      text not null unique,
    created_at timestamptz not null default now()
);

-- 정책 0개 + REVOKE. 오직 Edge Function 의 service_role 만 읽는다.
alter table public.unsubscribe_tokens enable row level security;
revoke all on public.unsubscribe_tokens from anon, authenticated;

create or replace function private.issue_unsubscribe_token(p_user uuid)
returns text
language plpgsql
security definer
set search_path = public, private, extensions, pg_temp
as $$
declare
    t text;
begin
    select token into t from public.unsubscribe_tokens where user_id = p_user;
    if t is not null then
        return t;
    end if;

    -- base64url (URL 에 그대로 실리도록 +/ 를 -_ 로 바꾸고 패딩 제거)
    t := rtrim(translate(encode(gen_random_bytes(32), 'base64'), '+/', '-_'), '=');

    insert into public.unsubscribe_tokens (user_id, token)
    values (p_user, t)
    on conflict (user_id) do update set token = excluded.token
    returning token into t;

    return t;
end;
$$;

grant execute on function private.issue_unsubscribe_token(uuid) to service_role;


-- ── 캠페인 ──────────────────────────────────────────────────────────────────
create table if not exists public.email_campaigns (
    id              uuid primary key default gen_random_uuid(),
    kind            text        not null check (kind in ('notice', 'ad', 'test')),
    subject         text        not null,
    body            text        not null,
    segment         jsonb       not null default '{}'::jsonb,
    recipient_count integer     not null default 0,
    created_by      uuid        references auth.users(id) on delete set null,
    dedupe_key      text        unique,
    created_at      timestamptz not null default now(),

    -- ⚠ 법정 요건을 DB 제약으로 강제한다.
    --   애플리케이션 코드에만 두면 SQL Editor 직접 INSERT 로 우회된다.
    --   CHECK 는 위반 행의 '존재 자체'를 불가능하게 만든다.
    constraint email_campaigns_ad_prefix
        check (kind <> 'ad' or subject like '(광고)%')
);


-- ── 발송 큐 겸 이력 (outbox) ────────────────────────────────────────────────
-- send-email 은 여기 넣기만 하고, drain-email-queue 워커가 실제 SMTP 를 친다.
--
-- 왜 큐인가: Edge Function 은 free 에서 wall clock 150초 제한이다.
--            300명 순차 SMTP 는 반드시 타임아웃 나고, 그때 몇 명까지 갔는지 알 수 없다.
--            큐로 두면 재시도·백오프·일일 상한·수신거부 재확인이 한 곳에 모인다.
create table if not exists public.email_logs (
    id           uuid primary key default gen_random_uuid(),
    campaign_id  uuid        references public.email_campaigns(id) on delete set null,
    kind         text        not null check (kind in ('notice', 'ad', 'test')),
    to_email     text        not null,
    to_user_id   uuid        references auth.users(id) on delete set null,
    subject      text        not null,
    body         text        not null,

    status       text        not null default 'queued'
                             check (status in ('queued', 'sending', 'sent',
                                               'failed', 'cancelled')),
    attempts     integer     not null default 0,
    scheduled_at timestamptz not null default now(),
    sent_at      timestamptz,
    error        text,

    -- 서버측 멱등키. 버튼 연타·재시도로 같은 메일이 두 번 나가는 것을 막는다.
    dedupe_key   text,
    created_at   timestamptz not null default now(),

    constraint email_logs_ad_prefix
        check (kind <> 'ad' or subject like '(광고)%')
);

create unique index if not exists email_logs_dedupe_uniq
    on public.email_logs (dedupe_key) where dedupe_key is not null;

-- 워커가 집는 큐 인덱스
create index if not exists email_logs_queue_idx
    on public.email_logs (status, scheduled_at) where status = 'queued';

create index if not exists email_logs_campaign_idx on public.email_logs (campaign_id);
create index if not exists email_logs_created_idx  on public.email_logs (created_at desc);


-- ── 야간 발송 자동 보정 ─────────────────────────────────────────────────────
-- 큐잉 시점에 보정한다. 다만 이것만으로는 부족하다 —
-- 큐가 밀려 21시를 넘기면 뚫리므로, 워커가 발송 직전에 한 번 더 확인해야 한다.
create or replace function private.guard_email_schedule()
returns trigger
language plpgsql
as $$
begin
    if new.kind = 'ad' then
        new.scheduled_at := private.next_ad_window(coalesce(new.scheduled_at, now()));
    end if;
    new.to_email := lower(trim(new.to_email));
    return new;
end;
$$;

drop trigger if exists email_logs_schedule on public.email_logs;
create trigger email_logs_schedule
    before insert on public.email_logs
    for each row execute function private.guard_email_schedule();


-- ── 수신거부 즉시 반영 ──────────────────────────────────────────────────────
-- 큐잉 시점 스냅샷만 믿으면 "해지했는데 또 왔다"가 발생하고 그게 신고 사유다.
-- 해지하는 순간 대기 중인 ad 큐를 일괄 취소한다.
create or replace function private.cancel_pending_ads()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
    if old.marketing_opt_in and not new.marketing_opt_in then
        update public.email_logs
           set status = 'cancelled',
               error  = 'unsubscribed'
         where to_user_id = new.id
           and kind   = 'ad'
           and status = 'queued';
    end if;
    return new;
end;
$$;

drop trigger if exists profiles_cancel_ads on public.profiles;
create trigger profiles_cancel_ads
    after update of marketing_opt_in on public.profiles
    for each row execute function private.cancel_pending_ads();


-- ── 2년 재확인 대상 ─────────────────────────────────────────────────────────
-- 재확인 통지는 광고가 아니라 법정 의무 이행이므로 kind='notice' 로 보낸다.
--
-- ⚠ security_invoker = true 가 필수다.
--   Postgres 뷰는 기본이 정의자(owner) 권한 실행이라, 이게 없으면 뷰가 RLS 를
--   우회해 **모든 회원의 이메일이 아무에게나 노출된다.** 뷰는 RLS 의 구멍이다.
create or replace view public.marketing_reconsent_due
    with (security_invoker = true) as
    select id, account_email, contact_email, name, marketing_opt_in_at
      from public.profiles
     where marketing_opt_in
       and marketing_opt_in_at is not null
       and marketing_opt_in_at < now() - interval '2 years';


-- ── 006 에서 미뤄둔 트리거 등록 ─────────────────────────────────────────────
-- marketing_consent_log 가 이제 존재하므로 붙일 수 있다.
drop trigger if exists applications_sync_profile on public.applications;
create trigger applications_sync_profile
    after insert on public.applications
    for each row execute function private.sync_profile_from_application();
