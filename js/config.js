/**
 * 사이트 설정 — Supabase 연결 정보
 *
 * 두 값이 채워져 있으면 사이트 전체가 Supabase 모드로 동작한다.
 * (Supabase Dashboard → Project Settings → API 에서 복사)
 *
 *   url  : https://<project-ref>.supabase.co
 *   anon : sb_publishable_... (신형) 또는 eyJhbGciOi... (구형 anon JWT)
 *
 * 이 키는 공개돼도 안전하다. 브라우저에 배포되도록 설계된 "익명 사용자"
 * 신분증이며, 실제 접근 통제는 전부 Postgres RLS 정책이 담당한다.
 * 반대로 service_role key 는 RLS 를 전부 우회하므로 절대 여기 넣지 말 것.
 *
 * ⚠ 비우면 로컬 모드(브라우저 localStorage)로 되돌아간다. 그 상태에서는
 *   신청자에게 "접수되었습니다" 화면이 정상적으로 뜨지만 데이터는 신청자
 *   브라우저에만 남아 관리자가 영영 볼 수 없다. 절대 비운 채 배포하지 말 것.
 */
window.IRUM_CONFIG = {
    supabaseUrl: 'https://tdayexcmksjfryhthyfz.supabase.co',
    supabaseAnonKey: 'sb_publishable_BLdv2L6WneDsbz3mqp8hgA_kXRcc78X'
};
