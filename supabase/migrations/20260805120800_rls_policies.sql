-- ============================================================================
-- 008 · RLS 정책
-- ============================================================================
-- 이 파일이 이 프로젝트의 실제 보안 경계다.
-- anon key 는 공개돼 있고 js/store.js 의 isAdmin() 은 UI 힌트일 뿐이다.
-- 누가 무엇을 볼 수 있는지는 오직 여기서 정해진다.
--
-- 관용구: 정책 안에서는 private.is_admin() 을 `(select ...)` 스칼라 서브쿼리로
--         감싼다. 그래야 Postgres 가 initPlan 으로 캐싱해 행마다가 아니라
--         쿼리당 1회만 실행한다. 수천 행 조회에서 체감 차이가 크다.
-- ============================================================================

alter table public.regions               enable row level security;
alter table public.profiles              enable row level security;
alter table public.courses               enable row level security;
alter table public.course_options        enable row level security;
alter table public.applications          enable row level security;
alter table public.email_campaigns       enable row level security;
alter table public.email_logs            enable row level security;
alter table public.marketing_consent_log enable row level security;
-- admins, unsubscribe_tokens 는 003/007 에서 이미 활성화 + 정책 0개다.


-- ── regions — 공개 조회 테이블 ──────────────────────────────────────────────
drop policy if exists regions_read on public.regions;
create policy regions_read on public.regions
    for select to anon, authenticated
    using (active);


-- ── profiles ────────────────────────────────────────────────────────────────
-- ⚠ 다른 회원의 이메일·전화번호가 새면 안 된다. 여기가 개인정보 유출 1순위다.
drop policy if exists profiles_read_self on public.profiles;
create policy profiles_read_self on public.profiles
    for select to authenticated
    using (id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
    for update to authenticated
    using      (id = (select auth.uid()) or (select private.is_admin()))
    with check (id = (select auth.uid()) or (select private.is_admin()));

-- INSERT 는 handle_new_user 트리거(SECURITY DEFINER)만 한다.
-- 클라이언트 경로를 열어둘 이유가 없다 → 정책 없음 = 거부.
-- DELETE 도 없다. 탈퇴는 auth.users 삭제로 cascade 된다.


-- ── courses / course_options ────────────────────────────────────────────────
-- draft 강의는 아무에게도 보이지 않는다. 준비 중인 기수가 새면 안 된다.
drop policy if exists courses_read_public on public.courses;
create policy courses_read_public on public.courses
    for select to anon, authenticated
    using (status = 'open' or (select private.is_admin()));

drop policy if exists courses_admin_write on public.courses;
create policy courses_admin_write on public.courses
    for all to authenticated
    using      ((select private.is_admin()))
    with check ((select private.is_admin()));

drop policy if exists course_options_read_public on public.course_options;
create policy course_options_read_public on public.course_options
    for select to anon, authenticated
    using (
        (select private.is_admin())
        or exists (
            select 1 from public.courses c
             where c.id = course_options.course_id and c.status = 'open'
        )
    );

drop policy if exists course_options_admin_write on public.course_options;
create policy course_options_admin_write on public.course_options
    for all to authenticated
    using      ((select private.is_admin()))
    with check ((select private.is_admin()));


-- ── applications ────────────────────────────────────────────────────────────
drop policy if exists applications_read on public.applications;
create policy applications_read on public.applications
    for select to authenticated
    using (user_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists applications_insert_self on public.applications;
create policy applications_insert_self on public.applications
    for insert to authenticated
    with check (user_id = (select auth.uid()));

-- 관리자만 수정. 무엇을 바꿀 수 있는지는 006 의 guard 트리거가 다시 좁힌다
-- (상태만 가능, 스냅샷은 불변).
drop policy if exists applications_update_admin on public.applications;
create policy applications_update_admin on public.applications
    for update to authenticated
    using      ((select private.is_admin()))
    with check ((select private.is_admin()));

-- DELETE 정책 없음. 신청 기록은 지우지 않고 status='cancelled' 로 둔다.


-- ── 메일 ────────────────────────────────────────────────────────────────────
-- 조회는 관리자만. 쓰기는 클라이언트에서 아예 불가능하다.
-- 큐에 넣는 주체는 Edge Function(service_role)뿐이다 — RLS 를 우회한다.
--
-- ⚠ 이게 왜 중요한가: 클라이언트가 email_logs 에 직접 insert 할 수 있으면
--   로그인한 아무나 이룸아카데미 이름으로 메일을 보낼 수 있다.
drop policy if exists email_campaigns_read_admin on public.email_campaigns;
create policy email_campaigns_read_admin on public.email_campaigns
    for select to authenticated
    using ((select private.is_admin()));

drop policy if exists email_logs_read_admin on public.email_logs;
create policy email_logs_read_admin on public.email_logs
    for select to authenticated
    using ((select private.is_admin()));


-- ── 동의 증빙 ───────────────────────────────────────────────────────────────
drop policy if exists consent_read on public.marketing_consent_log;
create policy consent_read on public.marketing_consent_log
    for select to authenticated
    using (user_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists consent_insert_self on public.marketing_consent_log;
create policy consent_insert_self on public.marketing_consent_log
    for insert to authenticated
    with check (user_id = (select auth.uid()));

-- UPDATE/DELETE 정책 없음. 증빙은 append-only 여야 의미가 있다.


-- ── 권한 정리 ───────────────────────────────────────────────────────────────
-- RLS 는 "행"을 막고 GRANT 는 "동작"을 막는다. 둘 다 건다.
revoke all on public.email_campaigns       from anon, authenticated;
revoke all on public.email_logs            from anon, authenticated;
grant select on public.email_campaigns     to authenticated;
grant select on public.email_logs          to authenticated;

revoke all    on public.marketing_consent_log from anon;
grant  select, insert on public.marketing_consent_log to authenticated;

revoke insert, update, delete on public.regions        from anon, authenticated;
revoke insert, update, delete on public.courses        from anon;
revoke insert, update, delete on public.course_options from anon;
revoke all                    on public.profiles       from anon;
revoke all                    on public.applications   from anon;

-- 뷰는 RLS 를 갖지 않는다. security_invoker 로 기반 테이블 정책을 따르게 해 두었고,
-- 권한도 관리자 화면에서만 필요하므로 authenticated 에만 준다.
revoke all    on public.marketing_reconsent_due from anon;
grant  select on public.marketing_reconsent_due to authenticated;
