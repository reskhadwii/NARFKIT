/* NARFKIT IoT - konfigurasi + koneksi data kit (dipakai kartu dashboard dan halaman Lab IoT).
   Muat file ini SETELAH config.js/auth.js (yang membuat klien Supabase `sb`).
   transport 'supabase' (bawaan): data lewat tabel iot_kit di Supabase, dilindungi login siswa.
   transport 'mqtt'             : jalur MQTT ke broker (untuk demo), tanpa login. */
(function () {
  var defaults = {
    transport: 'supabase',                       // 'supabase' | 'mqtt'
    kitId: 'kit01',                              // kit bawaan; siswa bisa menggantinya di halaman Lab IoT
    staleMs: 15000,                              // dianggap offline jika tidak ada data selama ini
    labUrl: 'iot-lab.html',
    // --- hanya dipakai transport 'mqtt' ---
    broker: 'wss://broker.hivemq.com:8884/mqtt', // broker publik (hanya untuk demo)
    prefix: 'narfkit-ganti-dengan-kode-acak',    // harus sama dengan PREFIX di sketch ESP32 MQTT
    mqttSrc: 'https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js'
  };
  var cfg = window.NARFKIT_IOT = Object.assign(defaults, window.NARFKIT_IOT || {});

  cfg.topic = function (kit, leaf) { return cfg.prefix + '/' + kit + '/' + leaf; };

  /* ID kit yang dipilih siswa di halaman Lab IoT (tersimpan di browser), kalau belum ada pakai kitId bawaan */
  cfg.currentKit = function () {
    try { return localStorage.getItem('nk_kit') || cfg.kitId; } catch (e) { return cfg.kitId; }
  };

  function caller(h) {
    return function (name, arg) {
      try { if (h[name]) h[name](arg); } catch (e) { console.error(e); }
    };
  }

  /* ===================== Supabase ===================== */
  function connectSupabase(kitId, h) {
    var call = caller(h);
    var ended = false, busy = false, rtOk = false, tick = 0;
    var channel = null, timer = null, lastSeen = null;

    function client() {
      return (typeof sb !== 'undefined' && sb) || window.sb || null;
    }

    function fresh(data) { call('onStatus', true); call('onSensors', data || {}); }

    function poll() {
      var c = client();
      if (!c || ended || busy) return;
      busy = true;
      c.rpc('iot_get', { p_kit: kitId }).then(function (r) {
        busy = false;
        if (ended) return;
        if (r.error) { call('onLink', false); return; }
        call('onLink', true);
        var res = r.data;
        if (!res) { call('onMissing', kitId); call('onStatus', false); return; }
        call('onMissing', null);
        lastSeen = res.last_seen;
        if (res.age_s == null || res.age_s * 1000 > cfg.staleMs) call('onStatus', false);
        else fresh(res.data);
      }, function () { busy = false; call('onLink', false); });
    }

    function subscribe() {
      var c = client();
      if (!c || !c.channel) return;
      channel = c.channel('iot-' + kitId + '-' + Math.random().toString(36).slice(2, 7))
        .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'iot_kit', filter: 'kit_id=eq.' + kitId },
            function (p) {
              var rec = p && p.new;
              if (!rec || !rec.last_seen || rec.last_seen === lastSeen) return;   // hanya perubahan perintah
              lastSeen = rec.last_seen;
              fresh(rec.data);
            })
        .subscribe(function (status) { rtOk = (status === 'SUBSCRIBED'); });
    }

    if (!client()) { call('onLink', false); }
    else {
      poll();
      try { subscribe(); } catch (e) { console.error(e); }
      // Realtime aktif: cek ulang tiap 20 dtk. Realtime tidak aktif (mis. WebSocket diblokir): tiap 4 dtk.
      timer = setInterval(function () { tick++; if (!rtOk || tick % 5 === 0) poll(); }, 4000);
    }

    return {
      publish: function (leaf, payload) {
        var c = client();
        if (!c || ended || leaf !== 'cmd') return false;
        var m = /^(buzzer|servo):(\d{1,3})$/.exec(String(payload));
        if (!m) return false;
        var args = { p_kit: kitId, p_buzzer: null, p_servo: null };
        args[m[1] === 'buzzer' ? 'p_buzzer' : 'p_servo'] = parseInt(m[2], 10);
        c.rpc('iot_cmd', args).then(function (r) {
          if (r.error) call('onCmdError', r.error.message);
        }, function () { call('onCmdError', 'koneksi gagal'); });
        return true;
      },
      end: function () {
        ended = true;
        if (timer) clearInterval(timer);
        var c = client();
        if (channel && c && c.removeChannel) { try { c.removeChannel(channel); } catch (e) {} }
      }
    };
  }

  /* ===================== MQTT ===================== */
  function loadMqtt() {
    return new Promise(function (resolve, reject) {
      if (window.mqtt) return resolve(window.mqtt);
      var s = document.createElement('script');
      s.src = cfg.mqttSrc;
      s.async = true;
      s.onload = function () { window.mqtt ? resolve(window.mqtt) : reject(new Error('mqtt tidak tersedia')); };
      s.onerror = function () { reject(new Error('gagal memuat mqtt.js')); };
      document.head.appendChild(s);
    });
  }

  function connectMqtt(kitId, h) {
    var call = caller(h);
    var client = null, ended = false;
    loadMqtt().then(function (mqtt) {
      if (ended) return;
      var tSensors = cfg.topic(kitId, 'sensors');
      var tStatus = cfg.topic(kitId, 'status');
      client = mqtt.connect(cfg.broker, {
        clientId: 'nk-web-' + Math.random().toString(16).slice(2, 10),
        reconnectPeriod: 3000,
        connectTimeout: 8000,
        clean: true
      });
      client.on('connect', function () {
        call('onLink', true);
        client.subscribe([tSensors, tStatus]);
      });
      client.on('close', function () { call('onLink', false); });
      client.on('error', function () { /* ditangani lewat event close */ });
      client.on('message', function (topic, buf) {
        var text = buf.toString();
        if (topic === tStatus) { call('onStatus', text === 'online'); return; }
        if (topic === tSensors) {
          var data;
          try { data = JSON.parse(text); } catch (e) { return; }
          call('onSensors', data);
        }
      });
    }).catch(function () { call('onLink', false); });

    return {
      publish: function (leaf, payload) {
        if (client && client.connected) {
          client.publish(cfg.topic(kitId, leaf), String(payload));
          return true;
        }
        return false;
      },
      end: function () {
        ended = true;
        if (client) { try { client.end(true); } catch (e) {} }
      }
    };
  }

  /* handlers: { onLink(bool), onStatus(bool), onSensors(obj), onMissing(kitId|null), onCmdError(msg) } */
  cfg.connect = function (kitId, handlers) {
    return cfg.transport === 'mqtt' ? connectMqtt(kitId, handlers) : connectSupabase(kitId, handlers);
  };
})();