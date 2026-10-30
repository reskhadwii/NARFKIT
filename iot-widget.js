/* NARFKIT IoT - kartu "Lab IoT" untuk dashboard siswa.
   Memakai class bawaan situs (hw-card, hw-icon, hw-content, btn-hw), jadi tampilannya ikut tema.
   Pasang: <div class="hw-card" id="iot-card-slot"></div> + iot-core.js + iot-widget.js (defer).
   - Jika #iot-card-slot tidak ada, file ini tidak melakukan apa-apa.
   - Koneksi baru dibuka saat kartu benar-benar terlihat (bukan saat halaman dimuat),
     jadi tidak membebani siswa yang belum sampai ke bagian itu.
   - Semua dibungkus try/catch supaya error tidak merusak bagian dashboard lain. */
(function () {
  var ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect>' +
    '<line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line>' +
    '<line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line>' +
    '<line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line>' +
    '<line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>';

  function whenVisible(el, cb) {
    if (!('IntersectionObserver' in window)) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) { io.disconnect(); cb(); return; }
      }
    });
    io.observe(el);
  }

  function init() {
    var slot = document.getElementById('iot-card-slot');
    var cfg = window.NARFKIT_IOT;
    if (!slot || !cfg) return;

    slot.innerHTML =
      '<div class="hw-icon" style="flex-shrink:0">' + ICON + '</div>' +
      '<div class="hw-content" style="min-width:0">' +
        '<h3>Lab IoT</h3>' +
        '<p id="nk-info"></p>' +
        '<button class="btn-hw" id="nk-open" type="button">Buka Lab IoT</button>' +
      '</div>';

    var info = document.getElementById('nk-info');
    var open = document.getElementById('nk-open');
    open.addEventListener('click', function () { window.location.href = cfg.labUrl; });

    var s = { statusOnline: null, last: 0, link: false, d: null };

    function num(v, unit) {
      return (typeof v === 'number' && isFinite(v)) ? Math.round(v) + unit : '--';
    }
    function render() {
      var online = s.statusOnline !== false && (Date.now() - s.last) < cfg.staleMs;
      var text;
      if (online && s.d) {
        text = 'Kit online · Suhu ' + num(s.d.temp, '°C') + ' · Kelembapan ' + num(s.d.hum, '%');
      } else if (s.link) {
        text = 'Kit offline. Nyalakan kit dan pastikan terhubung ke WiFi.';
      } else {
        text = 'Menghubungkan...';
      }
      info.textContent = text;
    }
    render();

    whenVisible(slot, function () {
      try {
        cfg.connect(cfg.currentKit(), {
          onLink: function (ok) { s.link = ok; render(); },
          onStatus: function (ok) { s.statusOnline = ok; render(); },
          onSensors: function (d) { s.last = Date.now(); s.d = d; render(); }
        });
        setInterval(render, 2000);
      } catch (e) { console.error('iot-widget:', e); }
    });
  }

  function safeInit() { try { init(); } catch (e) { console.error('iot-widget:', e); } }
  if (document.readyState === 'complete') safeInit();
  else window.addEventListener('load', safeInit);
})();