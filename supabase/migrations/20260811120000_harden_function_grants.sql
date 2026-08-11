-- ============================================================================
-- 010 · 함수 권한·search_path 보정
-- ============================================================================
-- 003·004 의 `revoke execute on function ... from anon` 은 의도한 효과가 없었다.
--
-- Postgres 는 함수를 만들 때 EXECUTE 를 PUBLIC 에 기본 부여한다.
-- anon 은 PUBLIC 의 구성원이므로, anon 개별 revoke 만으로는 아무것도 막지 못한다.
-- (Supabase 어드바이저의 0028 anon_security_definer_function_executable 로 확인)
--
-- 실질 피해는 없었다 — is_admin() 은 anon 에게 false 를 돌려주고, 나머지 둘은
-- 함수 본문에서 private.is_admin() 을 확인해 FORBIDDEN 을 던진다.
-- 다만 "닫았다고 적어둔 문이 실제로는 열려 있는" 상태였다. 방어는 문서가 아니라
-- 권한 테이블에 있어야 한다.
-- ============================================================================

revoke execute on function public.is_admin()                  from public;
revoke execute on function public.backfill_missing_profiles() from public;
revoke execute on function public.count_missing_profiles()    from public;

grant execute on function public.is_admin()                  to authenticated;
grant execute on function public.backfill_missing_profiles() to authenticated;
grant execute on function public.count_missing_profiles()    to authenticated;


-- ── search_path 고정 ────────────────────────────────────────────────────────
-- SECURITY DEFINER 가 아닌 트리거 함수라도 호출자가 자기 스키마를 앞에 끼워 넣는
-- 경로를 남겨둘 이유가 없다. (어드바이저 0011 function_search_path_mutable)
alter function private.touch_updated_at()          set search_path = public, pg_temp;
alter function private.guard_email_schedule()      set search_path = public, private, pg_temp;
alter function private.next_ad_window(timestamptz) set search_path = public, private, pg_temp;


-- ============================================================================
-- 남는 어드바이저 경고 — 모두 의도된 설계다
-- ============================================================================
-- · rls_enabled_no_policy (admins, unsubscribe_tokens)
--     정책 0개 = 전면 거부. 003·007 이 노린 그대로다.
--
-- · authenticated_security_definer_function_executable (함수 3개)
--     js/store.js 의 isAdmin() 이 public.is_admin() 을 호출해야 하고,
--     나머지 둘은 본문에서 private.is_admin() 을 확인한 뒤 FORBIDDEN 을 던진다.
--     로그인 사용자에게 열려 있는 것이 맞다.
-- ============================================================================
