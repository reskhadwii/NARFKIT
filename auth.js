/* ============================================================
   NARFKIT - helper bersama (butuh config.js dimuat lebih dulu)
   Narf.guard('siswa'|'guru')  -> pastikan login + peran benar
   Narf.rpc(nama, args)        -> panggil fungsi server, lempar Error berpesan jelas
   ============================================================ */
(function () {
  const HOME = { siswa: 'dashboardsiswa.html', guru: 'dashboardguru.html', admin: 'dashboardguru.html' };

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // hanya izinkan http(s) untuk URL yang berasal dari database/siswa
  function safeUrl(u) {
    try {
      const x = new URL(String(u || ''), location.href);
      return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : '';
    } catch { return ''; }
  }

  function pesan(err) {
    const m = (err && (err.message || err.error_description)) || 'Terjadi kesalahan';
    if (/Failed to fetch|NetworkError/i.test(m)) return 'Tidak bisa terhubung ke server. Cek koneksi internet.';
    if (/JWT|expired/i.test(m)) return 'Sesi habis, silakan masuk lagi.';
    return m;
  }

  async function rpc(nama, args) {
    const { data, error } = await sb.rpc(nama, args || {});
    if (error) throw new Error(pesan(error));
    return data;
  }

  async function query(promise) {
    const { data, error } = await promise;
    if (error) throw new Error(pesan(error));
    return data;
  }

  async function signOut() {
    try { await sb.auth.signOut(); } catch (e) { /* abaikan */ }
    location.href = 'index.html';
  }

  function toast(msg, tipe) {
    let wrap = document.getElementById('narf-toast');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'narf-toast';
      wrap.setAttribute('role', 'status');
      wrap.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none';
      document.body.appendChild(wrap);
    }
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'font:700 14px Montserrat,sans-serif;padding:12px 20px;border-radius:12px;color:#fff;max-width:90vw;box-shadow:0 6px 24px rgba(0,0,0,.35);background:' +
      (tipe === 'error' ? '#c0392b' : tipe === 'ok' ? '#2e8b57' : '#7a4b47');
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 4200);
  }

  function inisial(nama) {
    const p = String(nama || '?').trim().split(/\s+/);
    return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  }

  // Pastikan sudah login dan perannya sesuai. Kembalikan profil.
  async function guard(peran) {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { location.replace('index.html'); return new Promise(() => {}); }
    let info;
    try { info = await rpc('ping'); }
    catch (e) { toast(e.message, 'error'); throw e; }
    if (!info || !info.ada_profil) { location.replace('index.html'); return new Promise(() => {}); }
    const boleh = peran === 'guru' ? (info.role === 'guru' || info.role === 'admin') : info.role === peran;
    if (!boleh) { location.replace(HOME[info.role] || 'index.html'); return new Promise(() => {}); }
    document.querySelectorAll('[data-nama]').forEach(el => { el.textContent = info.nama; });
    document.querySelectorAll('[data-nama-depan]').forEach(el => { el.textContent = String(info.nama).split(/\s+/)[0]; });
    document.querySelectorAll('[data-avatar]').forEach(el => { el.textContent = inisial(info.nama); });
    document.querySelectorAll('[data-logout]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); signOut(); }));
    return info;
  }

  function waktuRelatif(iso) {
    if (!iso) return '-';
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'baru saja';
    if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
    if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
    return Math.floor(s / 86400) + ' hari lalu';
  }

  window.Narf = { esc, safeUrl, rpc, query, signOut, toast, guard, inisial, waktuRelatif, HOME };
})();
