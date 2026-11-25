const Downloads = (() => {
  const active = new Map();
  const queue = [];
  let timer = null;
  let dialogGameId = null;
  let queuePaused = false;
  let lastPersist = 0;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const settings = () => state.settings || {};
  const num = (v, d) => Number.isFinite(+v) ? +v : d;
  const baseSpeed = () => Math.max(10, num(settings().downloadSpeed, 100));
  const timeScale = () => Math.max(1, num(settings().downloadTimeScale, 60));
  const fmtGb = (mb) => `${(mb / 1024).toFixed(1).replace('.', ',')} ГБ`;
  const fmtSpeed = (mbps) => `${Math.round(mbps)} Мбит/с`;
  const fmtFree = (gb) => `${Math.round(gb)} ГБ свободно`;

  function fmtEta(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '—';
    if (sec < 60) return `${Math.ceil(sec)} сек`;
    const totalMin = Math.round(sec / 60);
    if (totalMin < 60) return `${totalMin} мин`;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h >= 24) return `${Math.floor(h / 24)} д ${h % 24} ч`;
    return m ? `${h} ч ${m} мин` : `${h} ч`;
  }

  function activeItem() {
    return active.values().next().value || null;
  }

  function history() {
    return (state.downloadHistory || []).slice(-6).reverse();
  }

  function storageInfo() {
    const total = 2048;
    const system = 60;
    const apps = 12;
    let games = 0;
    state.gameOrder.map(getGame).filter(Boolean).forEach(g => {
      if (isInstalled(g.id)) games += (g.size || 0);
    });
    const used = system + apps + games;
    return { total, system, apps, games, used, free: Math.max(0, total - used) };
  }

  function sparkBars(samples) {
    if (!samples || !samples.length) return '';
    const max = Math.max(...samples, 1) * 1.1;
    return samples.map(v => `<i style="height:${Math.max(6, Math.round(v / max * 100))}%"></i>`).join('');
  }

  function persist(force = false) {
    const now = Date.now();
    if (!force && now - lastPersist < 1500) return;
    lastPersist = now;
    state.downloadQueue = queue.slice();
    const it = activeItem();
    state.activeDownload = it ? {
      id: it.id,
      title: it.title,
      sizeMB: it.sizeMB,
      downloadedMB: it.downloadedMB,
      status: it.status,
      installPct: it.installPct,
      savedAt: now
    } : null;
    save();
  }

  function resumePersisted() {
    queue.length = 0;
    (state.downloadQueue || []).forEach(id => {
      if (getGame(id) && !isInstalled(id) && !queue.includes(id)) queue.push(id);
    });
    const saved = state.activeDownload;
    if (saved && getGame(saved.id) && !isInstalled(saved.id)) {
      const g = getGame(saved.id);
      const sizeMB = Math.max(1, saved.sizeMB || (g.size || 60) * 1024);
      const it = {
        id: g.id,
        title: g.title,
        sizeMB,
        downloadedMB: Math.min(saved.downloadedMB || 0, sizeMB),
        baseSpeed: baseSpeed(),
        speedMbps: baseSpeed(),
        timeScale: timeScale(),
        status: saved.status === 'paused' ? 'paused' : saved.status === 'installing' ? 'installing' : 'downloading',
        installPct: saved.installPct || 0,
        eta: null,
        lastTick: Date.now(),
        samples: [baseSpeed()]
      };
      if (it.downloadedMB >= sizeMB) it.status = 'installing';
      active.set(g.id, it);
      ensureTimer();
      setTimeout(() => toast(`Загрузка «${g.title}» продолжена`, 'download', 2800), 3000);
    } else if (!active.size && queue.length) {
      const id = queue.shift();
      const g = getGame(id);
      if (g) begin(g, { open: false });
    }
    persist(true);
  }

  function ensureTimer() {
    if (!timer) timer = setInterval(tick, 500);
  }

  function stopIfIdle() {
    if (!active.size && !queue.length) {
      clearInterval(timer);
      timer = null;
    }
  }

  function start(game) {
    if (!game) return;
    if (isInstalled(game.id)) {
      toast(`«${game.title}» уже установлена`, 'check');
      return;
    }
    if (!isOwned(game.id)) {
      toast('Сначала купите игру', 'store');
      return;
    }
    if (active.has(game.id)) {
      openDialog(game.id);
      return;
    }
    if (queue.includes(game.id)) {
      openManager();
      return;
    }
    if (active.size) {
      queue.push(game.id);
      persist(true);
      toast(`«${game.title}» добавлена в очередь загрузки`, 'download', 2400);
      openManager();
      return;
    }
    queuePaused = false;
    begin(game);
  }

  function begin(game, opts = {}) {
    if (active.size) return;
    const sizeGB = Math.max(1, +(game.size || 60));
    const item = {
      id: game.id,
      title: game.title,
      sizeMB: sizeGB * 1024,
      downloadedMB: 0,
      baseSpeed: baseSpeed(),
      speedMbps: baseSpeed(),
      timeScale: timeScale(),
      status: 'downloading',
      installPct: 0,
      eta: null,
      lastTick: Date.now(),
      samples: [baseSpeed()]
    };
    active.set(game.id, item);
    ensureTimer();
    persist(true);
    if (opts.open !== false) openDialog(game.id);
    toast(`Загрузка «${game.title}» началась`, 'download', 2200);
  }

  function tick() {
    const now = Date.now();
    for (const it of [...active.values()]) {
      const dt = Math.max(0.1, Math.min(2, (now - it.lastTick) / 1000));
      it.lastTick = now;
      if (it.status === 'downloading') {
        it.baseSpeed = baseSpeed();
        it.timeScale = timeScale();
        const wave = 0.86 + Math.random() * 0.28;
        it.speedMbps = Math.max(1, it.baseSpeed * wave);
        const mbPerSec = it.speedMbps / 8;
        it.downloadedMB = Math.min(it.sizeMB, it.downloadedMB + mbPerSec * dt * it.timeScale);
        it.eta = (it.sizeMB - it.downloadedMB) / mbPerSec;
        it.samples.push(it.speedMbps);
        if (it.samples.length > 30) it.samples.shift();
        if (it.downloadedMB >= it.sizeMB - 0.01) {
          it.downloadedMB = it.sizeMB;
          it.eta = 0;
          it.status = 'installing';
          it.installPct = 0;
        }
      } else if (it.status === 'installing') {
        it.speedMbps = 0;
        it.installPct = Math.min(100, it.installPct + 6 + Math.random() * 9);
        if (it.installPct >= 100) finish(it);
      }
    }
    persist();
    renderOpen();
    renderManager();
    stopIfIdle();
  }

  function finish(it) {
    active.delete(it.id);
    state.activeDownload = null;
    installGame(it.id);
    state.downloadHistory = state.downloadHistory || [];
    state.downloadHistory.push({ id: it.id, at: Date.now() });
    state.downloadHistory = state.downloadHistory.slice(-20);
    persist(true);
    toast(`«${it.title}» установлена`, 'check', 2600);
    if (window.Home) Home.refresh();
    if (window.Router && Router.stack.some(x => x.name === 'game')) Router.render();
    if (dialogGameId === it.id) {
      dialogGameId = null;
      Layer.close();
    }
    if (document.querySelector('.dlm')) setTimeout(openManager, 160);
    setTimeout(next, 500);
  }

  function pause(id) {
    const it = active.get(id);
    if (!it || it.status !== 'downloading') return;
    it.status = 'paused';
    it.lastTick = Date.now();
    persist(true);
    renderOpen();
    renderManager();
  }

  function resume(id) {
    const it = active.get(id);
    if (!it || it.status !== 'paused') return;
    it.status = 'downloading';
    it.lastTick = Date.now();
    persist(true);
    renderOpen();
    renderManager();
  }

  function cancel(id) {
    const it = active.get(id);
    if (!it) return;
    active.delete(id);
    if (state.activeDownload && state.activeDownload.id === id) state.activeDownload = null;
    if (dialogGameId === id) {
      dialogGameId = null;
      Layer.close();
    }
    persist(true);
    toast(`Загрузка «${it.title}» отменена`, 'x', 2200);
    if (document.querySelector('.dlm')) setTimeout(openManager, 160);
    stopIfIdle();
    setTimeout(next, 350);
  }

  function next() {
    if (active.size || !queue.length || queuePaused) return;
    const id = queue.shift();
    const g = getGame(id);
    if (!g || isInstalled(id)) return next();
    begin(g, { open: false });
  }

  function toggleAllPause() {
    if (queuePaused) {
      queuePaused = false;
      const it = activeItem();
      if (it && it.status === 'paused') resume(it.id);
      else if (!it) next();
    } else {
      queuePaused = true;
      const it = activeItem();
      if (it && it.status === 'downloading') pause(it.id);
    }
    persist(true);
    if (document.querySelector('.dlm')) setTimeout(openManager, 80);
  }

  function dialogHTML(it) {
    const g = getGame(it.id);
    const p = Math.min(100, (it.downloadedMB / it.sizeMB) * 100);
    const paused = it.status === 'paused';
    const installing = it.status === 'installing';
    const free = storageInfo();
    return `<div class="dl" data-dl-game="${it.id}">
      <div class="dl__head">
        <div class="dl__icon">${icon('download')}</div>
        <div class="dl__titles">
          <p class="eyebrow">Загрузка и установка</p>
          <h2>${esc(g ? g.title : it.title)}</h2>
          <p>${fmtGb(it.sizeMB)} · ${installing ? 'Установка' : paused ? 'Пауза' : 'Загрузка'}</p>
        </div>
        <button class="iconbtn" data-dlclose aria-label="Свернуть">${icon('x')}</button>
      </div>
      <div class="dl__bar"><i data-dlbar style="width:${p}%"></i></div>
      <div class="dl__spark" data-dlspark>${sparkBars(it.samples)}</div>
      <div class="dl__stats">
        <div><span>Загружено</span><b data-dldone>${fmtGb(it.downloadedMB)} / ${fmtGb(it.sizeMB)}</b></div>
        <div><span>Скорость</span><b data-dlspeed>${paused ? 'Пауза' : installing ? '—' : fmtSpeed(it.speedMbps)}</b></div>
        <div><span>Осталось</span><b data-dleta>${paused ? '—' : installing ? 'Установка…' : fmtEta(it.eta)}</b></div>
      </div>
      <div class="dl__actions">
        <button class="btn btn--primary btn--sm" data-dlpause ${installing ? 'disabled' : ''}>${paused ? icon('play') + ' Продолжить' : icon('pause') + ' Пауза'}</button>
        <button class="btn btn--ghost btn--sm" data-dlcancel>Отменить</button>
        <button class="btn btn--ghost btn--sm" data-dlmanager>Все загрузки</button>
      </div>
      <p class="dl__hint" data-dlhint>Скорость и оставшееся время считаются как в реальной сети. Симуляция: ×${it.timeScale}. <span data-dlfree>${fmtFree(free.free)}</span>. Изменить — Настройки → Сеть → Загрузки.</p>
    </div>`;
  }

  function renderOpen() {
    const it = active.get(dialogGameId);
    if (!it) return;
    const el = document.querySelector('.dl');
    if (!el || el.dataset.dlGame !== it.id) return;
    const p = Math.min(100, (it.downloadedMB / it.sizeMB) * 100);
    const bar = el.querySelector('[data-dlbar]');
    const spark = el.querySelector('[data-dlspark]');
    const done = el.querySelector('[data-dldone]');
    const speed = el.querySelector('[data-dlspeed]');
    const eta = el.querySelector('[data-dleta]');
    const pauseBtn = el.querySelector('[data-dlpause]');
    const hint = el.querySelector('[data-dlhint]');
    const free = el.querySelector('[data-dlfree]');
    if (bar) bar.style.width = p + '%';
    if (spark) spark.innerHTML = sparkBars(it.samples);
    if (done) done.textContent = `${fmtGb(it.downloadedMB)} / ${fmtGb(it.sizeMB)}`;
    if (speed) speed.textContent = it.status === 'paused' ? 'Пауза' : it.status === 'installing' ? '—' : fmtSpeed(it.speedMbps);
    if (eta) eta.textContent = it.status === 'paused' ? '—' : it.status === 'installing' ? 'Установка…' : fmtEta(it.eta);
    if (pauseBtn) {
      pauseBtn.disabled = it.status === 'installing';
      pauseBtn.innerHTML = it.status === 'paused' ? icon('play') + ' Продолжить' : icon('pause') + ' Пауза';
    }
    if (hint) hint.innerHTML = `Скорость и оставшееся время считаются как в реальной сети. Симуляция: ×${it.timeScale}. <span data-dlfree>${fmtFree(storageInfo().free)}</span>. Изменить — Настройки → Сеть → Загрузки.`;
    if (free) free.textContent = fmtFree(storageInfo().free);
  }

  function bindDialog(el, it) {
    el.querySelector('[data-dlclose]')?.addEventListener('click', () => {
      Layer.close();
      toast('Загрузка продолжается. Открыть: Настройки → Сеть → Загрузки.', 'download', 3200);
    });
    el.querySelector('[data-dlpause]')?.addEventListener('click', () => {
      const cur = active.get(it.id);
      if (!cur) return;
      if (cur.status === 'paused') resume(it.id);
      else pause(it.id);
    });
    el.querySelector('[data-dlcancel]')?.addEventListener('click', () => cancel(it.id));
    el.querySelector('[data-dlmanager]')?.addEventListener('click', openManager);
  }

  function managerHTML() {
    const it = activeItem();
    const free = storageInfo();
    const activeHtml = it ? (() => {
      const g = getGame(it.id);
      return `<div class="dlm__row dlm__row--active" data-dlm-active="${it.id}">
        <span class="dlm__ico">${icon('download')}</span>
        <div class="dlm__body">
          <div class="dlm__top"><b>${esc(g ? g.title : it.title)}</b><span>${fmtGb(it.downloadedMB)} / ${fmtGb(it.sizeMB)}</span></div>
          <div class="dlm__bar"><i data-dlmbar style="width:${Math.min(100, (it.downloadedMB / it.sizeMB) * 100)}%"></i></div>
          <div class="dlm__spark" data-dlmspark>${sparkBars(it.samples)}</div>
          <small data-dlmeta>${it.status === 'paused' ? 'Пауза' : it.status === 'installing' ? 'Установка…' : `${fmtSpeed(it.speedMbps)} · осталось ${fmtEta(it.eta)}`}</small>
        </div>
        <div class="dlm__acts">
          <button class="iconbtn" data-dlopen="${it.id}" title="Открыть">${icon('download')}</button>
          <button class="iconbtn" data-dlpause="${it.id}" title="Пауза">${it.status === 'paused' ? icon('play') : icon('pause')}</button>
          <button class="iconbtn" data-dlcancel="${it.id}" title="Отменить">${icon('x')}</button>
        </div>
      </div>`;
    })() : `<div class="dlm__empty">Активных загрузок нет.</div>`;

    const queueHtml = queue.length ? queue.map(id => {
      const g = getGame(id);
      if (!g) return '';
      return `<div class="dlm__row"><span class="dlm__ico">${icon('clock')}</span><div class="dlm__body"><b>${esc(g.title)}</b><small>В очереди · ${g.size || 60} ГБ</small></div><button class="iconbtn" data-dlqueuecancel="${id}" title="Убрать">${icon('x')}</button></div>`;
    }).join('') : `<div class="dlm__empty">Очередь пуста.</div>`;

    const hist = history();
    const histHtml = hist.length ? hist.map(h => {
      const g = getGame(h.id);
      if (!g) return '';
      const installed = isInstalled(h.id);
      return `<div class="dlm__row"><span class="dlm__ico">${icon('check')}</span><div class="dlm__body"><b>${esc(g.title)}</b><small>${installed ? 'Установлено' : 'Загрузка отменена'}</small></div><button class="btn btn--ghost btn--sm" data-dllaunch="${h.id}">${icon('play')} ${installed ? 'Запустить' : 'Открыть'}</button></div>`;
    }).join('') : `<div class="dlm__empty">Пока ничего не загружалось.</div>`;

    return `<div class="dlm">
      <div class="dlm__head">
        <div><p class="eyebrow">Загрузки</p><h2>Менеджер загрузок</h2><p>Скорость, время и очередь — как на реальной консоли.</p></div>
        <button class="iconbtn" data-dlmclose aria-label="Закрыть">${icon('x')}</button>
      </div>
      <div class="dlm__sections">
        <section><h3>Активная</h3>${activeHtml}</section>
        <section><h3>В очереди · ${queue.length}</h3>${queueHtml}</section>
        <section><h3>Завершённые</h3>${histHtml}</section>
      </div>
      <div class="dlm__foot">
        <button class="btn btn--ghost btn--sm" data-dlallpause>${queuePaused ? icon('play') + ' Продолжить все' : icon('pause') + ' Пауза все'}</button>
        <button class="btn btn--ghost btn--sm" data-dlsettings>${icon('settings')} Настройки загрузки</button>
        <span>${fmtFree(free.free)} · ${active.size ? 'идёт загрузка' : 'загрузки не идут'}</span>
      </div>
    </div>`;
  }

  function bindManager(el) {
    el.querySelector('[data-dlmclose]')?.addEventListener('click', () => Layer.close());
    el.querySelectorAll('[data-dlopen]').forEach(b => b.addEventListener('click', () => openDialog(b.dataset.dlopen)));
    el.querySelectorAll('[data-dlpause]').forEach(b => b.addEventListener('click', () => {
      const cur = active.get(b.dataset.dlpause);
      if (!cur) return;
      if (cur.status === 'paused') resume(cur.id);
      else pause(cur.id);
    }));
    el.querySelectorAll('[data-dlcancel]').forEach(b => b.addEventListener('click', () => cancel(b.dataset.dlcancel)));
    el.querySelectorAll('[data-dlqueuecancel]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.dlqueuecancel;
      const i = queue.indexOf(id);
      if (i >= 0) queue.splice(i, 1);
      persist(true);
      openManager();
    }));
    el.querySelectorAll('[data-dllaunch]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.dllaunch;
      Layer.close();
      if (isInstalled(id)) Launch.start(id);
      else Router.open('game', { id });
    }));
    el.querySelector('[data-dlallpause]')?.addEventListener('click', toggleAllPause);
    el.querySelector('[data-dlsettings]')?.addEventListener('click', () => {
      Layer.close();
      Router.open('settings', { tab: 'network' });
    });
  }

  function renderManager() {
    const el = document.querySelector('.dlm');
    if (!el) return;
    const row = el.querySelector('[data-dlm-active]');
    const it = activeItem();
    if (!row || !it || row.dataset.dlmActive !== it.id) return;
    const bar = row.querySelector('[data-dlmbar]');
    const spark = row.querySelector('[data-dlmspark]');
    const meta = row.querySelector('[data-dlmeta]');
    const pause = row.querySelector('[data-dlpause]');
    if (bar) bar.style.width = Math.min(100, (it.downloadedMB / it.sizeMB) * 100) + '%';
    if (spark) spark.innerHTML = sparkBars(it.samples);
    if (meta) meta.textContent = it.status === 'paused' ? 'Пауза' : it.status === 'installing' ? 'Установка…' : `${fmtSpeed(it.speedMbps)} · осталось ${fmtEta(it.eta)}`;
    if (pause) pause.innerHTML = it.status === 'paused' ? icon('play') : icon('pause');
  }

  function openDialog(id) {
    const it = active.get(id);
    if (!it) return;
    dialogGameId = id;
    Layer.open(dialogHTML(it), {
      cls: 'layer--center layer--wide',
      onMount(el) { bindDialog(el, it); }
    });
  }

  function openManager() {
    Layer.open(managerHTML(), {
      cls: 'layer--center layer--wide',
      onMount(el) { bindManager(el); }
    });
  }

  setTimeout(resumePersisted, 600);

  return {
    start,
    openManager,
    activeCount: () => active.size,
    queueCount: () => queue.length,
    pause,
    resume,
    cancel,
    current: activeItem,
    storageInfo
  };
})();

window.Downloads = Downloads;
