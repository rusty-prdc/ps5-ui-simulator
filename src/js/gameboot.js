/* ===== запуск игры: логотипы студии/издателя, меню игры, ошибка запуска ===== */
(function () {
  const LOGO_MAP = [
    [/rockstar/i, 'rockstar.svg'],
    [/insomniac/i, 'insomniac.png'],
    [/santa monica/i, 'santamonica.svg'],
    [/naughty dog/i, 'naughtydog.png'],
    [/cd projekt/i, 'cdpr.svg'],
    [/capcom/i, 'capcom.png'],
    [/team asobi/i, 'teamasobi.svg'],
    [/polyphony/i, 'polyphony.png'],
    [/mojang/i, 'mojang.svg'],
    [/epic games/i, 'epic.svg'],
    [/roblox/i, 'roblox.svg'],
    [/activision/i, 'activision.svg'],
    [/warner/i, 'wbgames.svg'],
    [/electronic arts|ea sports|ea vancouver|respawn/i, 'easports.svg'],
    [/playstation|sony interactive/i, 'playstation.svg']
  ];

  function logoFor(name) {
    if (!name) return '';
    for (let i = 0; i < LOGO_MAP.length; i++) {
      if (LOGO_MAP[i][0].test(name)) return 'assets/logos/' + LOGO_MAP[i][1];
    }
    return '';
  }

  const ERRS = ['CE-108255-1', 'CE-107880-4', 'CE-108262-9'];

  let root = null;
  let stage = null;
  let phase = null;
  let timers = [];
  let errIndex = 0;
  let lastSplashSrc = '';

  function clearTimers() {
    timers.forEach(t => clearTimeout(t));
    timers = [];
  }

  function ensureRoot() {
    if (root && document.body.contains(root)) return root;
    root = document.createElement('div');
    root.id = 'gb';
    root.className = 'gb';
    root.innerHTML = '<div class="gb__stage" id="gbStage"></div>';
    document.body.appendChild(root);
    stage = root.firstElementChild;
    root.addEventListener('click', onClick);
    return root;
  }

  function prefs(g) {
    state.gamePrefs = state.gamePrefs || {};
    if (!state.gamePrefs[g.id]) {
      state.gamePrefs[g.id] = { graphics: 'Качество', hdr: true, subs: true, lang: 'Русский', volume: 70 };
    }
    return state.gamePrefs[g.id];
  }

  function persist() {
    try { if (typeof save === 'function') save(); } catch (e) {}
  }

  const darkCache = new Map();
  function isDarkFlatLogo(src) {
    if (!src) return Promise.resolve(false);
    if (darkCache.has(src)) return Promise.resolve(darkCache.get(src));
    return new Promise(resolve => {
      const im = new Image();
      const done = v => { darkCache.set(src, v); resolve(v); };
      im.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = 64; c.height = 64;
          const ctx = c.getContext('2d');
          ctx.drawImage(im, 0, 0, 64, 64);
          const d = ctx.getImageData(0, 0, 64, 64).data;
          let lum = 0, sat = 0, n = 0;
          for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] < 40) continue;
            const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
            const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
            lum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
            sat += mx > 0 ? (mx - mn) / mx : 0;
            n++;
          }
          if (!n) return done(false);
          done(lum / n < 0.4 && sat / n < 0.2);
        } catch (e) { done(false); }
      };
      im.onerror = () => done(false);
      im.src = src;
    });
  }

  function splashHtml(entry) {
    const src = entry.src ? assetUrl(entry.src) : '';
    const inner = src
      ? `<img class="gb-splash__logo" src="${src}" alt="${entry.name || ''}">`
      : `<div class="gb-splash__word">${entry.name || ''}</div>`;
    return `<div class="gb-splash">
      <div class="gb-splash__box">${inner}</div>
      <div class="gb-splash__bar"><i></i></div>
      <div class="gb-splash__skip">Нажмите любую клавишу, чтобы пропустить</div>
    </div>`;
  }

  function showOsLaunch(g) {
    clearTimers();
    phase = 'oslaunch';
    const hero = assetUrl(g.hero || g.cover || '');
    const dur = 2.6;
    stage.innerHTML = `<div class="gb-os">
      ${hero ? `<div class="gb-os__bg" style="background-image:url('${hero}')"></div>` : ''}
      <div class="gb-os__shade"></div>
      <div class="gb-os__badge"><i></i>Запуск</div>
      <div class="gb-os__clock"><b id="gbOsClock">00:00</b><span>Сеанс</span></div>
      <div class="gb-os__center">
        <p class="gb-os__kicker">${g.studio || ''}${g.genre ? ' · ' + g.genre : ''}</p>
        <h1 class="gb-os__title">${g.title}</h1>
        <p class="gb-os__sub">Загрузка сохранения и ресурсов…</p>
        <div class="gb-os__bar"><i style="animation-duration:${dur}s"></i></div>
      </div>
    </div>`;
    const clock = stage.querySelector('#gbOsClock');
    const started = Date.now();
    const iv = setInterval(() => {
      if (phase !== 'oslaunch') { clearInterval(iv); return; }
      const sec = Math.floor((Date.now() - started) / 1000);
      if (clock) clock.textContent = '00:' + String(sec).padStart(2, '0');
    }, 250);
    timers.push(setTimeout(() => {
      clearInterval(iv);
      if (phase === 'oslaunch') runSplash(g);
    }, dur * 1000));
  }

  function runSplash(g) {
    clearTimers();
    phase = 'splash';
    const seq = [];
    const studio = g.studio || '';
    const publisher = g.publisher || '';
    seq.push({ name: studio, src: logoFor(studio) });
    if (publisher && publisher !== studio) {
      const pubSrc = logoFor(publisher);
      if (pubSrc !== seq[0].src) seq.push({ name: publisher, src: pubSrc });
    }
    if (publisher === 'Sony Interactive Entertainment') {
      seq.push({ name: 'PlayStation Studios', src: 'assets/logos/playstation.svg' });
    }
    let i = 0;
    const step = () => {
      if (phase !== 'splash') return;
      if (i >= seq.length) { runLoading(g); return; }
      const entry = seq[i++];
      stage.innerHTML = splashHtml(entry);
      const el = stage.firstElementChild;
      const img = stage.querySelector('.gb-splash__logo');
      lastSplashSrc = entry.src || '';
      if (img) isDarkFlatLogo(img.src).then(dark => { if (dark && img.isConnected) img.classList.add('is-inv'); });
      requestAnimationFrame(() => el.classList.add('is-in'));
      timers.push(setTimeout(() => { if (el) el.classList.add('is-out'); }, 850));
      timers.push(setTimeout(step, 1100));
    };
    step();
  }

  function loadSeconds(g) {
    const size = Number(g.size) || 20;
    const year = Number(g.year) || 2022;
    const t = 62 + Math.min(26, Math.pow(size, 0.62) * 0.9) + (year >= 2024 ? 4 : 0);
    return Math.max(64, Math.min(94, t));
  }

  const STAGES = [
    [0, 'Проверка обновлений'],
    [18, 'Загрузка ресурсов'],
    [45, 'Компиляция шейдеров'],
    [75, 'Загрузка сохранения'],
    [92, 'Подготовка интерфейса']
  ];

  function runLoading(g, overrideDur, next) {
    clearTimers();
    phase = 'loading';
    const hero = assetUrl(g.hero || g.cover || '');
    let logo = assetUrl(g.logo || '');
    if (g.logo && g.logo === lastSplashSrc) logo = '';
    const dur = overrideDur || loadSeconds(g);
    stage.innerHTML = `<div class="gb-load" id="gbLoad">
      ${hero ? `<div class="gb-load__bg" style="background-image:url('${hero}')"></div>` : ''}
      <div class="gb-load__scrim"></div>
      <div class="gb-load__inner">
        ${logo ? `<img class="gb-load__logo" src="${logo}" alt="">` : `<div class="gb-load__title">${g.title}</div>`}
        <div class="gb-load__bar"><i style="animation-duration:${dur}s"></i></div>
        <div class="gb-load__meta">
          <span class="gb-load__pct">0%</span>
          <span class="gb-load__stage">${STAGES[0][1]}</span>
        </div>
      </div>
      <div class="gb-load__skip">Любая клавиша — пропустить</div>
    </div>`;
    const pct = stage.querySelector('.gb-load__pct');
    const label = stage.querySelector('.gb-load__stage');
    const started = Date.now();
    const iv = setInterval(() => {
      if (phase !== 'loading') { clearInterval(iv); return; }
      const p = Math.min(100, Math.round(((Date.now() - started) / (dur * 1000)) * 100));
      if (pct) pct.textContent = p + '%';
      let name = STAGES[0][1];
      for (let k = 0; k < STAGES.length; k++) if (p >= STAGES[k][0]) name = STAGES[k][1];
      if (label && label.textContent !== name) label.textContent = name;
    }, 100);
    timers.push(setTimeout(() => {
      clearInterval(iv);
      if (phase === 'loading') { if (next) next(); else showMenu(g); }
    }, dur * 1000 + 200));
  }

  function skipSplash() {
    if (phase !== 'oslaunch' && phase !== 'splash' && phase !== 'loading') return;
    clearTimers();
    showMenu(Launch.game);
  }

  function showMenu(g) {
    if (!g) return;
    clearTimers();
    phase = 'menu';
    const hero = assetUrl(g.hero || g.cover || '');
    const logo = assetUrl(g.logo || '');
    const slides = Array.isArray(g.slides) ? g.slides.filter(Boolean) : [];
    const slidesHTML = slides.length > 1
      ? `<div class="gb-menu__slides" id="gbSlides"><div class="gb-slide is-on"><img src="${assetUrl(slides[0])}" alt="" decoding="async" draggable="false"></div><div class="gb-slide"><img src="${assetUrl(slides[1])}" alt="" decoding="async" draggable="false"></div></div>`
      : '';
    stage.innerHTML = `<div class="gb-menu" id="gbMenu">
      <div class="gb-menu__bg"${hero ? ` style="background-image:url('${hero}')"` : ''}></div>
      ${slidesHTML}
      <div class="gb-menu__scrim"></div>
      <div class="gb-menu__head">
        ${logo ? `<img class="gb-menu__logo" src="${logo}" alt="${g.title}">` : `<h1 class="gb-menu__title">${g.title}</h1>`}
      </div>
      <nav class="gb-menu__items" aria-label="Главное меню игры">
        <button class="gb-item" data-gb="play">Играть</button>
        <button class="gb-item" data-gb="settings">Настройки</button>
        <button class="gb-item" data-gb="extra">Дополнительно</button>
        <button class="gb-item" data-gb="quit">Выход</button>
      </nav>
      <div class="gb-menu__foot">
        <span>${g.studio || ''}${g.publisher && g.publisher !== g.studio ? ' · ' + g.publisher : ''}</span>
        <span>v${g.version || '1.00'}${g.year ? ' · ' + g.year : ''}</span>
      </div>
    </div>`;
    if (slides.length > 1) {
      let idx = 0;
      slides.forEach(src => { const pre = new Image(); pre.src = assetUrl(src); });
      timers.push(setInterval(() => {
        const box = document.getElementById('gbSlides');
        if (!box) return;
        const on = box.querySelector('.gb-slide.is-on');
        const off = box.querySelector('.gb-slide:not(.is-on)');
        if (!on || !off) return;
        idx = (idx + 1) % slides.length;
        const img = off.querySelector('img');
        if (img) img.src = assetUrl(slides[idx]);
        off.classList.add('is-on');
        on.classList.remove('is-on');
      }, 5000));
    }
    timers.push(setTimeout(() => {
      const first = root.querySelector('.gb-item');
      if (first) first.focus({ preventScroll: true });
    }, 80));
  }

  function showError(g) {
    clearTimers();
    phase = 'error';
    const code = ERRS[errIndex % ERRS.length];
    stage.innerHTML = `<div class="gb-err">
      <div class="gb-err__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.6v5.6"/><path d="M12 16.6h.01"/></svg></div>
      <h2 class="gb-err__title">Не удалось запустить игру</h2>
      <p class="gb-err__text">Приложение ${g.title} завершилось с ошибкой. Данные сохранения не повреждены.</p>
      <div class="gb-err__code">${code}</div>
      <div class="gb-err__actions">
        <button class="gb-btn gb-btn--primary" data-gb="retry">Повторить</button>
        <button class="gb-btn" data-gb="quit">Закрыть приложение</button>
      </div>
    </div>`;
    timers.push(setTimeout(() => {
      const b = root.querySelector('[data-gb="retry"]');
      if (b) b.focus({ preventScroll: true });
    }, 80));
  }

  function row(label, value, key) {
    return `<button class="gb-row" data-gb-set="${key}">
      <span class="gb-row__label">${label}</span>
      <span class="gb-row__value">${value}</span>
    </button>`;
  }

  function showSettings(g) {
    clearTimers();
    phase = 'settings';
    const p = prefs(g);
    stage.innerHTML = `<div class="gb-panel" id="gbPanel">
      <header class="gb-panel__head">
        <h2>Настройки</h2>
        <span>${g.title}</span>
      </header>
      <div class="gb-panel__body">
        ${row('Режим графики', p.graphics, 'graphics')}
        ${row('HDR', p.hdr ? 'Вкл' : 'Выкл', 'hdr')}
        ${row('Субтитры', p.subs ? 'Вкл' : 'Выкл', 'subs')}
        ${row('Язык интерфейса', p.lang, 'lang')}
        ${row('Громкость музыки', p.volume + '%', 'volume')}
      </div>
      <footer class="gb-panel__foot">
        <button class="gb-btn" data-gb="back">Назад</button>
      </footer>
    </div>`;
    timers.push(setTimeout(() => {
      const b = root.querySelector('[data-gb-set]') || root.querySelector('[data-gb="back"]');
      if (b) b.focus({ preventScroll: true });
    }, 80));
  }

  function showAbout(g) {
    clearTimers();
    phase = 'about';
    const cover = assetUrl(g.cover || '');
    stage.innerHTML = `<div class="gb-panel gb-panel--about" id="gbPanel">
      <header class="gb-panel__head">
        <h2>Дополнительно</h2>
        <span>${g.title}</span>
      </header>
      <div class="gb-panel__body gb-about">
        ${cover ? `<img class="gb-about__cover" src="${cover}" alt="">` : ''}
        <div class="gb-about__info">
          <p><b>Студия:</b> ${g.studio || '—'}</p>
          <p><b>Издатель:</b> ${g.publisher || '—'}</p>
          <p><b>Жанр:</b> ${g.genre || '—'}</p>
          <p><b>Год:</b> ${g.year || '—'}</p>
          <p><b>Размер:</b> ${g.size || 0} ГБ</p>
          <p><b>Версия:</b> ${g.version || '1.00'}</p>
          <p><b>Трофеи:</b> ${(g.trophies && g.trophies.have) || 0} из ${(g.trophies && g.trophies.total) || 0}</p>
        </div>
      </div>
      <footer class="gb-panel__foot">
        <button class="gb-btn" data-gb="back">Назад</button>
      </footer>
    </div>`;
    timers.push(setTimeout(() => {
      const b = root.querySelector('[data-gb="back"]');
      if (b) b.focus({ preventScroll: true });
    }, 80));
  }

  function toggleSetting(key) {
    const g = Launch.game;
    if (!g) return;
    const p = prefs(g);
    if (key === 'graphics') p.graphics = p.graphics === 'Качество' ? 'Производительность' : 'Качество';
    else if (key === 'hdr') p.hdr = !p.hdr;
    else if (key === 'subs') p.subs = !p.subs;
    else if (key === 'lang') p.lang = p.lang === 'Русский' ? 'English' : 'Русский';
    else if (key === 'volume') p.volume = p.volume >= 100 ? 0 : p.volume + 25;
    persist();
    showSettings(g);
  }

  function onClick(e) {
    if (phase === 'oslaunch' || phase === 'splash' || phase === 'loading') { skipSplash(); return; }
    const setEl = e.target.closest('[data-gb-set]');
    if (setEl) { toggleSetting(setEl.dataset.gbSet); return; }
    const el = e.target.closest('[data-gb]');
    if (!el) return;
    const act = el.dataset.gb;
    const g = Launch.game;
    if (!g) return;
    if (act === 'play') { errIndex++; runLoading(g, 1.8, () => showError(g)); }
    else if (act === 'settings') showSettings(g);
    else if (act === 'extra') showAbout(g);
    else if (act === 'back') showMenu(g);
    else if (act === 'retry') showOsLaunch(g);
    else if (act === 'quit') Launch.close();
  }

  document.addEventListener('keydown', (e) => {
    if (!Launch.active) return;
    if (phase === 'oslaunch' || phase === 'splash' || phase === 'loading') {
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
      skipSplash();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (phase === 'error') showMenu(Launch.game);
      else if (phase === 'settings' || phase === 'about') showMenu(Launch.game);
    }
  }, true);

  const baseClose = Launch.close.bind(Launch);
  Launch.close = function () {
    clearTimers();
    phase = null;
    if (root) {
      root.classList.remove('is-on');
      root.innerHTML = '<div class="gb__stage" id="gbStage"></div>';
      stage = root.firstElementChild;
    }
    baseClose();
  };

  Launch.start = function (id) {
    const g = getGame(id);
    if (!g) return;
    ensureRoot();
    clearTimers();
    Layer.close();
    Router.close();
    AppHost.close(true);
    Launch.game = g;
    Launch.active = true;
    Launch.session = 0;
    clearInterval(Launch.timer);
    Launch.timer = setInterval(() => { Launch.session++; }, 1000);
    OS.dataset.screen = 'game';
    OS.classList.remove('has-view');
    OS.classList.remove('is-paused');
    root.classList.add('is-on');
    showOsLaunch(g);
  };

  window.GameBoot = {
    navRoot() {
      if (!Launch.active) return null;
      if (phase === 'menu') return document.getElementById('gbMenu');
      if (phase === 'settings' || phase === 'about') return document.getElementById('gbPanel');
      if (phase === 'error') return root ? root.querySelector('.gb-err__actions') : null;
      return null;
    },
    get phase() { return phase; }
  };
})();
