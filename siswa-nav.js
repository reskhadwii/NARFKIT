/* ============================================================
   NARFKIT - navbar siswa: panel Progress, daftar Notifikasi, menu Profil
   Butuh: config.js, auth.js. Panggil NarfNav.init(profil) setelah Narf.guard('siswa').
   Tombol yang dicari di HTML: #nav-progress, #nav-notif, #nav-profil
   ============================================================ */
(function () {
  const esc = Narf.esc;
  let uid = null, panelAktif = null;

  function buatPanel(id, judul) {
    const p = document.createElement('div');
    p.className = 'nav-panel'; p.id = id; p.hidden = true;
    p.innerHTML = '<div class="nav-panel-head"><span>' + esc(judul) + '</span><button type="button" class="nav-panel-close" aria-label="Tutup">&times;</button></div><div class="nav-panel-body"></div>';
    p.querySelector('.nav-panel-close').addEventListener('click', tutup);
    document.body.appendChild(p);
    return p;
  }
  function tutup() { if (panelAktif) { panelAktif.hidden = true; panelAktif = null; } }
  function buka(p, anchor) {
    const sama = panelAktif === p;
    tutup();
    if (sama) return false;
    const r = anchor.getBoundingClientRect();
    p.hidden = false; panelAktif = p;
    p.style.top = (r.bottom + window.scrollY + 10) + 'px';
    p.style.right = Math.max(8, document.documentElement.clientWidth - r.right - 10) + 'px';
    return true;
  }

  /* ---------- NOTIFIKASI ---------- */
  const IKON = { nilai: '★', feedback: '✎', info: '•' };
  async function muatNotif(panel, badge) {
    const body = panel.querySelector('.nav-panel-body');
    body.innerHTML = '<div class="nav-kosong">Memuat...</div>';
    try {
      const list = await Narf.query(sb.from('notifikasi').select('id,tipe,judul,isi,is_read,created_at')
        .eq('siswa_id', uid).order('created_at', { ascending: false }).limit(30));
      const belum = list.filter(n => !n.is_read).length;
      if (badge) { badge.textContent = belum > 9 ? '9+' : String(belum); badge.hidden = belum === 0; }
      if (!list.length) { body.innerHTML = '<div class="nav-kosong">Belum ada notifikasi.</div>'; return; }
      body.innerHTML = '<button type="button" class="nav-link-btn" id="notif-baca-semua">Tandai semua dibaca</button>' +
        list.map(n => '<div class="notif-item' + (n.is_read ? '' : ' belum') + '" data-id="' + esc(n.id) + '">' +
          '<div class="notif-ikon">' + esc(IKON[n.tipe] || IKON.info) + '</div><div class="notif-teks"><div class="notif-judul">' +
          esc(n.judul) + '</div><div class="notif-isi">' + esc(n.isi || '') + '</div><div class="notif-waktu">' +
          esc(Narf.waktuRelatif(n.created_at)) + '</div></div></div>').join('');
      body.querySelectorAll('.notif-item.belum').forEach(el => el.addEventListener('click', async () => {
        el.classList.remove('belum');
        await sb.from('notifikasi').update({ is_read: true }).eq('id', el.dataset.id);
        cekBadge(badge);
      }));
      const semua = body.querySelector('#notif-baca-semua');
      semua.addEventListener('click', async () => {
        await sb.from('notifikasi').update({ is_read: true }).eq('siswa_id', uid).eq('is_read', false);
        muatNotif(panel, badge);
      });
    } catch (e) { body.innerHTML = '<div class="nav-kosong">' + esc(e.message) + '</div>'; }
  }
  async function cekBadge(badge) {
    if (!badge) return;
    const { count } = await sb.from('notifikasi').select('id', { count: 'exact', head: true })
      .eq('siswa_id', uid).eq('is_read', false);
    badge.textContent = (count || 0) > 9 ? '9+' : String(count || 0);
    badge.hidden = !count;
  }

  /* ---------- PROGRESS ---------- */
  async function muatProgress(panel) {
    const body = panel.querySelector('.nav-panel-body');
    body.innerHTML = '<div class="nav-kosong">Memuat...</div>';
    try {
      const [courses, moduls, prog, siswa] = await Promise.all([
        Narf.query(sb.from('course').select('id,judul').order('judul')),
        Narf.query(sb.from('modul').select('id,judul,urutan,course_id').order('urutan')),
        Narf.query(sb.from('progress_modul').select('modul_id,status,persen_selesai').eq('siswa_id', uid)),
        Narf.query(sb.from('siswa').select('xp_total,streak_count,pretest_selesai').eq('user_id', uid).single())
      ]);
      const pm = Object.fromEntries(prog.map(p => [p.modul_id, p]));
      let html = '<div class="prog-ringkas"><div><b>' + esc(siswa.xp_total) + '</b><span>XP</span></div><div><b>' +
        esc(siswa.streak_count) + '</b><span>hari streak</span></div></div>';
      if (!siswa.pretest_selesai) html += '<div class="nav-kosong">Selesaikan asesmen diagnostik di Dashboard dulu.</div>';
      for (const c of courses) {
        const ms = moduls.filter(m => m.course_id === c.id);
        if (!ms.length) continue;
        const selesai = ms.filter(m => pm[m.id] && pm[m.id].status === 'selesai').length;
        html += '<div class="prog-course"><div class="prog-course-judul">' + esc(c.judul) + ' <span>' + selesai + '/' + ms.length + '</span></div>';
        html += ms.map(m => {
          const p = pm[m.id]; const st = p ? p.status : 'belum';
          const persen = st === 'selesai' ? 100 : Math.round(p ? p.persen_selesai : 0);
          return '<a class="prog-modul" href="course.html?course=' + encodeURIComponent(c.id) + '&modul=' + encodeURIComponent(m.id) + '">' +
            '<span class="prog-modul-nama">' + esc(m.urutan) + '. ' + esc(m.judul) + '</span><span class="prog-modul-bar"><i style="width:' + persen + '%"></i></span>' +
            '<span class="prog-modul-persen">' + persen + '%</span></a>';
        }).join('') + '</div>';
      }
      body.innerHTML = html;
    } catch (e) { body.innerHTML = '<div class="nav-kosong">' + esc(e.message) + '</div>'; }
  }

  /* ---------- INIT ---------- */
  async function init(profil) {
    const { data: { session } } = await sb.auth.getSession();
    uid = session && session.user.id;
    if (!uid) return;

    const bP = document.getElementById('nav-progress');
    const bN = document.getElementById('nav-notif');
    const bU = document.getElementById('nav-profil');

    let badge = null;
    if (bN) {
      badge = document.createElement('span');
      badge.className = 'nav-badge'; badge.hidden = true;
      bN.appendChild(badge);
      cekBadge(badge);
      setInterval(() => cekBadge(badge), 60000);
    }
    if (bP) {
      const p = buatPanel('panel-progress', 'Progress Belajar');
      bP.addEventListener('click', e => { e.stopPropagation(); if (buka(p, bP)) muatProgress(p); });
    }
    if (bN) {
      const p = buatPanel('panel-notif', 'Notifikasi');
      bN.addEventListener('click', e => { e.stopPropagation(); if (buka(p, bN)) muatNotif(p, badge); });
    }
    if (bU) {
      const p = buatPanel('panel-profil', 'Akun');
      p.querySelector('.nav-panel-body').innerHTML = '<div class="profil-nama">' + esc(profil.nama) + '</div><div class="profil-email">' +
        esc(profil.email || '') + '</div><button type="button" class="nav-link-btn keluar" id="btn-keluar-nav">Keluar</button>';
      p.querySelector('#btn-keluar-nav').addEventListener('click', () => Narf.signOut());
      bU.addEventListener('click', e => { e.stopPropagation(); buka(p, bU); });
    }
    document.addEventListener('click', e => { if (panelAktif && !panelAktif.contains(e.target)) tutup(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') tutup(); });
  }

  window.NarfNav = { init };
})();
