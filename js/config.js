/**
 * 사이트 설정 — Supabase 연결 정보
 *
 * 아래 두 값을 채우면 사이트 전체가 자동으로 Supabase 모드로 전환된다.
 * (Supabase Dashboard → Project Settings → API 에서 복사)
 *
 *   url  : https://<project-ref>.supabase.co
 *   anon : eyJhbGciOi... 로 시작하는 publishable/anon key
 *
 * anon key 는 공개돼도 안전하다. 브라우저에 배포되도록 설계된 "익명 사용자"
 * 신분증이며, 실제 접근 통제는 전부 Postgres RLS 정책이 담당한다.
 * 반대로 service_role key 는 RLS 를 전부 우회하므로 절대 여기 넣지 말 것.
 *
 * 비워 두면 로컬 모드(브라우저 localStorage)로 동작한다. 이 경우 신청 데이터는
 * 신청자 브라우저에만 저장되어 관리자가 볼 수 없다 — 실서비스 전에 반드시 채울 것.
 */
window.IRUM_CONFIG = {
    supabaseUrl: '',
    supabaseAnonKey: ''
};
