/* ============================================================
   NARFKIT - konfigurasi Supabase
   1) Supabase > Project Settings > API
   2) Isi SUPABASE_URL dan SUPABASE_ANON_KEY (kunci "anon / publishable").
   JANGAN PERNAH memasukkan service_role key atau API key AI di sini.
   Kunci anon aman ada di frontend karena data dilindungi RLS.
   ============================================================ */

const SUPABASE_URL = 'https://qcogfcfrmlyhfxramhrm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjb2dmY2ZybWx5aGZ4cmFtaHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NTcxMDUsImV4cCI6MjEwNjMzMzEwNX0.nlmgriHJBCres9ffjK8HRxeAdsrztKToZmO_gvwMXEk';

window.NARF_FN_CHAT = 'smart-action'
window.NARF_FN_NILAI = 'smooth-function'
window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
