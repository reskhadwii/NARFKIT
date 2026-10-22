/* =====================================================
   NARF KIT - global.js
   ===================================================== */
(function () {
  'use strict'

  const KEY = 'narfkit_theme'
  const root = document.documentElement

  function readSaved() {
    try {
      const t = localStorage.getItem(KEY)
      return t === 'light' || t === 'dark' ? t : null
    } catch (e) { return null }
  }

  // update tombol toggle: aria, tooltip, dan ikon bulan/matahari
  function syncToggles(theme) {
    const light = theme === 'light'
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(light))
      btn.title = light ? 'Ganti ke mode gelap' : 'Ganti ke mode terang'

      const moon = btn.querySelector('.icon-moon')
      const sun = btn.querySelector('.icon-sun')
      if (moon) moon.style.display = light ? 'none' : 'block'
      if (sun) sun.style.display = light ? 'block' : 'none'
    })
  }

  function apply(theme, persist) {
    root.setAttribute('data-theme', theme)
    if (persist) {
      try { localStorage.setItem(KEY, theme) } catch (e) {}
    }
    syncToggles(theme)
    // halaman lain bisa ikut bereaksi: document.addEventListener('narfkit:themechange', ...)
    document.dispatchEvent(new CustomEvent('narfkit:themechange', { detail: { theme } }))
  }

  function current() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
  }

  // 1) pasang tema secepat mungkin (script ini ada di <head>)
  apply(readSaved() || 'dark', false)

  // 2) tombol toggle (event delegation, jadi urutan load tidak masalah)
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-theme-toggle]')) {
      apply(current() === 'dark' ? 'light' : 'dark', true)
    }
  })

  // 3) setelah HTML siap, sinkronkan tombol & ikon (tombol belum ada saat langkah 1)
  document.addEventListener('DOMContentLoaded', () => syncToggles(current()))

  // 4) sinkron antar tab: ganti tema di satu tab, tab lain ikut berubah
  window.addEventListener('storage', (e) => {
    if (e.key === KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
      apply(e.newValue, false)
    }
  })

  // 5) tombol Back/Forward (bfcache) bisa membawa tema lama
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) apply(readSaved() || 'dark', false)
  })

  // API kecil kalau dibutuhkan dari script lain
  window.NarfTheme = {
    get: current,
    set: (theme) => apply(theme === 'light' ? 'light' : 'dark', true),
    toggle: () => apply(current() === 'dark' ? 'light' : 'dark', true)
  }
})()
