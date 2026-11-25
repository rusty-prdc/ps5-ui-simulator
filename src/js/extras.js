const Extras = (() => {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtMin = (m) => {
    m = Math.max(0, Math.round(m || 0));
    if (m < 60) return `${m} мин`;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return mm ? `${h} ч ${mm} мин` : `${h} ч`;
  };
  const fmtDate = (ts) => {
    if (!ts) return '—';
    try { return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }); }
    catch (e) { return '—'; }
  };
  const playtimeOf = (id) => +(state.playtime[id] || 0);
  const trophyTotal = (g) => (g && g.trophies && g.trophies.total) || 40;
  const trophyEarned = (g) => {
    if (!g) return 0;
    const total = trophyTotal(g);
    return Math.min(total, Math.floor(playtimeOf(g.id) / 25) + ((state.trophies && state.trophies[g.id]) || 0));
  };
  const statusLabel = (f) => {
    try { return FRIEND_STATUS[f.status].label; } catch (e) { return f.status || 'в сети'; }
  };

  const WALLPAPERS = {
    aurora: 'radial-gradient(900px 600px at 78% 12%, rgba(47,125,246,.35), transparent 62%), radial-gradient(700px 500px at 10% 90%, rgba(140,80,255,.22), transparent 64%), linear-gradient(135deg,#040812,#071a35 55%,#040812)',
    ocean: 'radial-gradient(800px 600px at 80% 20%, rgba(0,180,216,.35), transparent 62%), linear-gradient(135deg,#03111a,#052b3a 60%,#020a10)',
    sunset: 'radial-gradient(900px 600px at 78% 10%, rgba(255,120,80,.35), transparent 62%), linear-gradient(135deg,#160808,#3b1610 55%,#0c0404)',
    mono: 'radial-gradient(800px 600px at 75% 15%, rgba(255,255,255,.16), transparent 60%), linear-gradient(135deg,#08090c,#1b1d22 60%,#060709)'
  };

  state.playtime = state.playtime || {};
  state.lastPlayed = state.lastPlayed || {};
  state.trophies = state.trophies || {};
  state.purchaseHistory = state.purchaseHistory || [];
  state.party = state.party || { open: false, members: [], voice: false };
  state.watch = state.watch || {
    'youtube:Игровые итоги недели': { app: 'youtube', title: 'Игровые итоги недели', pct: 42 },
    'netflix:Stranger Things': { app: 'netflix', title: 'Stranger Things', pct: 67 },
    'spotify:Night Drive': { app: 'spotify', title: 'Night Drive', pct: 23 }
  };
  state.user.wallpaper = state.user.wallpaper && WALLPAPERS[state.user.wallpaper] ? state.user.wallpaper : 'aurora';
  if (typeof state.settings.uiSounds === 'undefined') state.settings.uiSounds = false;
  if (typeof state.settings.gamepad === 'undefined') state.settings.gamepad = true;
  if (typeof state.settings.musicPlaying === 'undefined') state.settings.musicPlaying = true;
  if (typeof state.settings.micMuted === 'undefined') state.settings.micMuted = false;
  state.captures = state.captures || 0;

  function applyWallpaper() {
    document.body.dataset.wallpaper = state.user.wallpaper || 'aurora';
  }
  applyWallpaper();

  let session = null;
  function endSession() {
    if (!session) return;
    const mins = Math.max(0, (Date.now() - session.at) / 60000);
    if (mins > 0.05) {
      state.playtime[session.id] = (state.playtime[session.id] || 0) + mins;
      save();
    }
    session = null;
  }
  function beginSession(id) {
    endSession();
    session = { id, at: Date.now() };
    state.lastPlayed[id] = Date.now();
    save();
  }

  const origStart = Launch.start.bind(Launch);
  Launch.start = function (id) {
    beginSession(id);
    return origStart(id);
  };
  const origClose = Launch.close.bind(Launch);
  Launch.close = function () {
    endSession();
    return origClose();
  };
  const origAbort = Launch.abort.bind(Launch);
  Launch.abort = function () {
    endSession();
    return origAbort();
  };

  function decorateGame(html, params) {
    const g = getGame(params.id);
    if (!g) return html;
    const last = state.lastPlayed[g.id];
    const stats = `<div class="gpstats">
      <span>${icon('clock')} ${fmtMin(playtimeOf(g.id))}</span>
      <span class="gpstats__trophies" data-extra-trophies="${g.id}">${icon('trophy')} ${trophyEarned(g)} / ${trophyTotal(g)}</span>
      <span>${icon('clock')} ${last ? 'Играли ' + fmtDate(last) : 'Ещё не запускали'}</span>
    </div>`;
    return html.replace('<div class="gp2buy">', stats + '<div class="gp2buy">');
  }

  function bindGame(root, params) {
    const g = getGame(params.id);
    if (!g) return;
    const buy = root.querySelector('.gp2buy');
    if (buy && isInstalled(g.id) && !buy.querySelector('[data-extra-uninstall]')) {
      const btn = document.createElement('button');
      btn.className = 'btn btn--ghost';
      btn.dataset.extraUninstall = g.id;
      btn.innerHTML = `${icon('trash')} Удалить`;
      btn.addEventListener('click', () => confirmUninstall(g));
      buy.appendChild(btn);
    }
    root.querySelector('[data-extra-trophies]')?.addEventListener('click', () => openTrophies(g));
  }

  function openTrophies(g) {
    if (!g) return;
    const total = trophyTotal(g);
    const earned = trophyEarned(g);
    const defs = [
      { tier: 'platinum', name: 'Платина', desc: 'Получить все трофеи' },
      { tier: 'gold', name: 'Золото', desc: 'Пройти основной сюжет' },
      { tier: 'silver', name: 'Серебро', desc: 'Собрать коллекцию' },
      { tier: 'silver', name: 'Серебро', desc: 'Победить босса' },
      { tier: 'bronze', name: 'Бронза', desc: 'Первый трофей' },
      { tier: 'bronze', name: 'Бронза', desc: 'Открыть секрет' },
      { tier: 'bronze', name: 'Бронза', desc: 'Прокачать навык' },
      { tier: 'bronze', name: 'Бронза', desc: 'Завершить испытание' }
    ];
    const rows = defs.map((d, i) => `<div class="trophy-row ${i < earned ? 'is-on' : ''}">
      <span class="trophy-tier trophy-tier--${d.tier}">${icon('trophy')}</span>
      <div class="trophy-body"><b>${d.name}</b><small>${d.desc}</small></div>
      <span class="trophy-state">${i < earned ? 'Получен' : 'Не получен'}</span>
    </div>`).join('');
    const pct = total ? Math.round(earned / total * 100) : 0;
    Layer.open(`<div class="trophies">
      <div class="dlm__head"><div><p class="eyebrow">Трофеи</p><h2>${esc(g.title)}</h2><p>${earned} из ${total} получено · ${pct}%</p></div><button class="iconbtn" data-extra-trophiesclose>${icon('x')}</button></div>
      <div class="trophy-progress"><i style="width:${pct}%"></i></div>
      ${rows}
    </div>`, {
      cls: 'layer--center layer--wide',
      onMount(el) { el.querySelector('[data-extra-trophiesclose]')?.addEventListener('click', () => Layer.close()); }
    });
  }

  function openTrophiesForLast() {
    const ids = Object.keys(state.lastPlayed || {}).sort((a, b) => state.lastPlayed[b] - state.lastPlayed[a]);
    const id = ids[0] || (state.gameOrder || []).find(id => isInstalled(id)) || 'gta';
    openTrophies(getGame(id) || getGame('gta'));
  }

  function confirmUninstall(g) {
    dialog({
      title: `Удалить «${g.title}»?`,
      text: 'Игра останется в библиотеке, но освободит место. Установить можно снова.',
      iconName: 'trash',
      tone: 'danger',
      actions: [
        { label: 'Удалить', cls: 'btn--danger', onClick: () => {
          state.removed = [...new Set([...state.removed, g.id])];
          g.installed = false;
          save();
          toast(`«${g.title}» удалена с консоли`, 'trash', 2200);
          if (window.Home) Home.refresh();
          Router.render();
        } },
        { label: 'Отмена', cls: 'btn--ghost', onClick: () => {} }
      ]
    });
  }

  function decorateLibrary(html) {
    const installed = state.gameOrder.map(getGame).filter(g => g && isInstalled(g.id));
    const size = installed.reduce((n, g) => n + (g.size || 0), 0);
    const time = state.gameOrder.reduce((n, id) => n + playtimeOf(id), 0);
    const trophies = state.gameOrder.reduce((n, id) => { const g = getGame(id); return n + (g ? trophyEarned(g) : 0); }, 0);
    const stats = `<div class="libstats">
      <span>${icon('folder')} Игр в библиотеке: <b>${state.gameOrder.length}</b></span>
      <span>${icon('download')} Установлено: <b>${installed.length}</b></span>
      <span>${icon('storage')} Занято: <b>${Math.round(size)} ГБ</b></span>
      <span>${icon('clock')} В играх: <b>${fmtMin(time)}</b></span>
      <span>${icon('trophy')} Трофеев: <b>${trophies}</b></span>
    </div>`;
    return html.replace('<div class="toolbar">', stats + '<div class="toolbar">');
  }

  function wishButton(id) {
    const on = state.storeFavs.includes(id);
    return `<button class="sc2-wish ${on ? 'is-on' : ''}" data-extra-wish="${id}" title="В избранное">${icon('heart')}</button>`;
  }

  function decorateStore(html) {
    html = html.replace(/<div class="store-card2" data-storeopen="([^"]+)">/g, (m, id) => `<div class="store-card2" data-storeopen="${id}">${wishButton(id)}`);
    html = html.replace('<div class="store-cats">', '<div class="extra-store-actions"><button class="segchip" data-extra-history>История покупок</button><button class="segchip" data-extra-wishfilter>Избранное</button></div><div class="store-cats">');
    return html;
  }

  function bindStore(root) {
    let wishOnly = false;
    const grid = root.querySelector('[data-sgrid]');
    const decorateCards = () => {
      if (!grid) return;
      grid.querySelectorAll('.store-card2').forEach(card => {
        const id = card.dataset.storeopen;
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        if (id && !card.querySelector('[data-extra-wish]')) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'sc2-wish ' + (state.storeFavs.includes(id) ? 'is-on' : '');
          b.dataset.extraWish = id;
          b.title = 'В избранное';
          b.innerHTML = icon('heart');
          card.appendChild(b);
        }
        if (card.querySelector('.sc2-badge--sale') && !card.querySelector('.sc2-timer')) {
          const t = document.createElement('span');
          t.className = 'sc2-timer';
          t.textContent = 'Скидка ещё 2 д 14 ч';
          card.querySelector('.sc2-body')?.appendChild(t);
        }
        if (wishOnly) card.style.display = state.storeFavs.includes(id) ? '' : 'none';
      });
    };
    if (grid) {
      decorateCards();
      if (window.MutationObserver) new MutationObserver(decorateCards).observe(grid, { childList: true });
      grid.addEventListener('click', (e) => {
        const b = e.target.closest('[data-extra-wish]');
        if (!b) return;
        e.preventDefault();
        e.stopPropagation();
        const id = b.dataset.extraWish;
        if (state.storeFavs.includes(id)) state.storeFavs = state.storeFavs.filter(x => x !== id);
        else state.storeFavs.push(id);
        save();
        b.classList.toggle('is-on', state.storeFavs.includes(id));
        toast(state.storeFavs.includes(id) ? 'Добавлено в избранное' : 'Убрано из избранного', 'heart', 1600);
      });
    }
    root.querySelector('[data-extra-wishfilter]')?.addEventListener('click', (e) => {
      wishOnly = !wishOnly;
      e.currentTarget.classList.toggle('is-on', wishOnly);
      if (grid) grid.querySelectorAll('.store-card2').forEach(c => {
        c.style.display = !wishOnly || state.storeFavs.includes(c.dataset.storeopen) ? '' : 'none';
      });
    });
    root.querySelector('[data-extra-history]')?.addEventListener('click', openHistory);
  }

  function openHistory() {
    const rows = (state.purchaseHistory || []).slice(0, 20).map(h => {
      const g = getGame(h.id);
      return `<div class="dlm__row"><span class="dlm__ico">${icon('store')}</span><div class="dlm__body"><b>${esc(g ? g.title : h.id)}</b><small>${fmtDate(h.at)} · ${formatRub(h.price)}</small></div></div>`;
    }).join('');
    Layer.open(`<div class="extra-history"><div class="dlm__head"><div><p class="eyebrow">PS Store</p><h2>История покупок</h2><p>Последние приобретения на этой консоли.</p></div><button class="iconbtn" data-extra-historyclose>${icon('x')}</button></div>${rows || '<div class="dlm__empty">Покупок пока нет.</div>'}</div>`, {
      cls: 'layer--center layer--wide',
      onMount(el) { el.querySelector('[data-extra-historyclose]')?.addEventListener('click', () => Layer.close()); }
    });
  }

  function partyHTML() {
    const members = (state.party.members || []).map(getFriend).filter(Boolean);
    const names = members.length ? members.map(f => f.name).join(', ') : 'Пригласите друзей';
    return `<div class="party-card ${state.party.open ? 'is-on' : ''}">
      <div class="party-card__main"><span class="party-card__ico">${icon('users')}</span><div><b>${state.party.open ? 'Party' : 'Голосовой чат'}</b><span>${state.party.open ? names : 'Создайте party и общайтесь с друзьями'}</span></div></div>
      <button class="btn btn--ghost btn--sm" data-extra-party>${state.party.open ? 'Управлять' : 'Создать party'}</button>
    </div>`;
  }

  function activityHTML() {
    const f = state.friends || [];
    const rows = [
      f[0] ? `${esc(f[0].name)} играет в ${esc(f[0].game || 'Hogwarts Legacy')}` : 'Друзья скоро появятся в сети',
      f[1] ? `${esc(f[1].name)} получил новый трофей` : 'Новых трофеев пока нет',
      f[2] ? `${esc(f[2].name)} в сети` : 'Пригласите друзей'
    ];
    return `<div class="activityfeed"><h3>Активность</h3>${rows.map(t => `<div class="activityfeed__item"><span class="dot"></span>${t}</div>`).join('')}</div>`;
  }

  function decorateFriends(html) {
    return html.replace('<div class="friends2">', `<div class="friends2">${partyHTML()}${activityHTML()}`);
  }

  function bindFriends(root) {
    root.querySelector('[data-extra-party]')?.addEventListener('click', openParty);
  }

  function openParty() {
    if (!state.party.open) {
      state.party.open = true;
      state.party.voice = true;
      state.party.members = state.party.members || [];
      save();
    }
    const online = (state.friends || []).filter(f => f.status === 'online');
    const rows = online.map(f => {
      const on = state.party.members.includes(f.id);
      return `<button class="party-friend ${on ? 'is-on' : ''}" data-extra-partyinvite="${f.id}">
        ${avatarHTML(f, 'avatar avatar--sm')}<span>${esc(f.name)}</span><b>${on ? 'В party' : 'Пригласить'}</b>
      </button>`;
    }).join('');
    Layer.open(`<div class="party-panel">
      <div class="dlm__head"><div><p class="eyebrow">Сообщество</p><h2>Party</h2><p>${state.party.voice ? 'Голосовой чат включён' : 'Голосовой чат выключен'}</p></div><button class="iconbtn" data-extra-partyclose>${icon('x')}</button></div>
      <div class="party-list">${rows || '<div class="dlm__empty">Нет друзей онлайн.</div>'}</div>
      <div class="dialog__actions"><button class="btn ${state.party.voice ? 'btn--primary' : 'btn--ghost'}" data-extra-partyvoice>${icon('users')} ${state.party.voice ? 'Выключить голос' : 'Включить голос'}</button><button class="btn btn--ghost" data-extra-partyclose2>Закрыть</button></div>
    </div>`, {
      cls: 'layer--center',
      onMount(el) {
        el.querySelector('[data-extra-partyclose]')?.addEventListener('click', () => { Layer.close(); Router.render(); });
        el.querySelector('[data-extra-partyclose2]')?.addEventListener('click', () => { Layer.close(); Router.render(); });
        el.querySelectorAll('[data-extra-partyinvite]').forEach(b => b.addEventListener('click', () => {
          const id = b.dataset.extraPartyinvite;
          if (state.party.members.includes(id)) state.party.members = state.party.members.filter(x => x !== id);
          else state.party.members.push(id);
          save();
          b.classList.toggle('is-on', state.party.members.includes(id));
          b.querySelector('b').textContent = state.party.members.includes(id) ? 'В party' : 'Пригласить';
          toast(state.party.members.includes(id) ? 'Приглашение отправлено' : 'Убран из party', 'users', 1600);
        }));
        el.querySelector('[data-extra-partyvoice]')?.addEventListener('click', () => {
          state.party.voice = !state.party.voice;
          save();
          Layer.close();
          openParty();
        });
      }
    });
  }

  function decorateMedia(html) {
    const rows = Object.entries(state.watch || {}).slice(0, 3).map(([key, w]) => {
      const pct = Math.max(0, Math.min(100, +(w.pct || 0)));
      return `<button class="watchrow" data-extra-watch="${esc(key)}"><span class="watchrow__art">${icon('play')}</span><span class="watchrow__body"><b>${esc(w.title)}</b><small>${esc(w.app)} · ${pct}%</small><i><em style="width:${pct}%"></em></i></span></button>`;
    }).join('');
    if (!rows) return html;
    const block = `<div class="section-title"><span>Продолжить</span><span class="count-pill">${Object.keys(state.watch).length}</span></div><div class="watchlist">${rows}</div>`;
    return html.replace('<div class="section-title">', block + '<div class="section-title">');
  }

  function bindMedia(root) {
    root.querySelectorAll('[data-extra-watch]').forEach(b => b.addEventListener('click', () => openWatch(b.dataset.extraWatch)));
  }

  function openWatch(key) {
    const w = state.watch[key];
    if (!w) return;
    let pct = Math.max(0, Math.min(100, +(w.pct || 0)));
    let playing = true;
    let timer = null;
    Layer.open(`<div class="miniplayer">
      <div class="miniplayer__head"><div><p class="eyebrow">${esc(w.app)}</p><h2>${esc(w.title)}</h2></div><button class="iconbtn" data-mpclose>${icon('x')}</button></div>
      <div class="miniplayer__art">${icon('play')}</div>
      <div class="mpbar"><i data-mpbar style="width:${pct}%"></i></div>
      <div class="mpstats"><span data-mppct>${pct}%</span><span>${pct >= 100 ? 'Просмотрено' : 'Продолжить просмотр'}</span></div>
      <div class="mpcontrols"><button class="btn btn--ghost btn--sm" data-mpseek="-10">−10 сек</button><button class="btn btn--primary btn--sm" data-mpplay>${icon('pause')} Пауза</button><button class="btn btn--ghost btn--sm" data-mpseek="10">+10 сек</button></div>
    </div>`, {
      cls: 'layer--center layer--wide',
      onMount(el) {
        const bar = el.querySelector('[data-mpbar]');
        const pctEl = el.querySelector('[data-mppct]');
        const playBtn = el.querySelector('[data-mpplay]');
        const render = () => {
          bar.style.width = pct + '%';
          pctEl.textContent = Math.round(pct) + '%';
          w.pct = pct; save();
          playBtn.innerHTML = playing ? icon('pause') + ' Пауза' : icon('play') + ' Смотреть';
        };
        timer = setInterval(() => { if (!document.body.contains(el)) { clearInterval(timer); return; } if (playing) { pct = Math.min(100, pct + 0.6); render(); } }, 500);
        el.querySelector('[data-mpclose]')?.addEventListener('click', () => { clearInterval(timer); Layer.close(); Router.render(); });
        el.querySelectorAll('[data-mpseek]').forEach(b => b.addEventListener('click', () => { pct = Math.max(0, Math.min(100, pct + Number(b.dataset.mpseek))); render(); }));
        playBtn.addEventListener('click', () => { playing = !playing; render(); });
        render();
      }
    });
  }

  function decorateSettings(html) { return html; }

  function bindSettingsExtras(root) {
    const inner = root.querySelector('.settings__inner');
    if (!inner || inner.querySelector('[data-extra-appearance]')) return;
    const group = document.createElement('div');
    group.dataset.extraAppearance = '1';
    group.innerHTML = `<div class="set-group extra-appearance"><h3>Оформление и управление</h3>
      <div class="setrow"><div class="setrow__txt"><b>Обои главного экрана</b><span>Фон интерфейса</span></div><div class="wallpapers">${Object.entries(WALLPAPERS).map(([k]) => `<button class="wall-swatch wall-${k} ${state.user.wallpaper === k ? 'is-on' : ''}" data-extra-wall="${k}" title="${k}"></button>`).join('')}</div></div>
      <div class="setrow"><div class="setrow__txt"><b>Звуки интерфейса</b><span>Короткие щелчки при нажатии</span></div><button class="switch ${state.settings.uiSounds ? 'is-on' : ''}" data-extra-sounds role="switch" aria-checked="${state.settings.uiSounds}"></button></div>
      <div class="setrow"><div class="setrow__txt"><b>Геймпад</b><span>Управление контроллером</span></div><button class="switch ${state.settings.gamepad !== false ? 'is-on' : ''}" data-extra-gamepad role="switch" aria-checked="${state.settings.gamepad !== false}"></button></div>
    </div>`;
    inner.appendChild(group);
    group.querySelectorAll('[data-extra-wall]').forEach(b => b.addEventListener('click', () => {
      state.user.wallpaper = b.dataset.extraWall;
      save();
      applyWallpaper();
      group.querySelectorAll('[data-extra-wall]').forEach(x => x.classList.toggle('is-on', x === b));
      toast('Обои изменены', 'display', 1600);
    }));
    group.querySelector('[data-extra-sounds]')?.addEventListener('click', (e) => {
      state.settings.uiSounds = !state.settings.uiSounds;
      save();
      e.currentTarget.classList.toggle('is-on', state.settings.uiSounds);
      e.currentTarget.setAttribute('aria-checked', state.settings.uiSounds);
      toast(state.settings.uiSounds ? 'Звуки включены' : 'Звуки выключены', 'check', 1600);
    });
    group.querySelector('[data-extra-gamepad]')?.addEventListener('click', (e) => {
      state.settings.gamepad = state.settings.gamepad === false;
      save();
      e.currentTarget.classList.toggle('is-on', state.settings.gamepad !== false);
      e.currentTarget.setAttribute('aria-checked', state.settings.gamepad !== false);
      toast(state.settings.gamepad !== false ? 'Геймпад включён' : 'Геймпад выключен', 'controller', 1600);
    });
  }

  const baseRender = Views.render.bind(Views);
  const baseMount = Views.mount.bind(Views);

  Views.render = function (name, params = {}) {
    let html = baseRender(name, params);
    if (name === 'game') html = decorateGame(html, params);
    else if (name === 'library') html = decorateLibrary(html);
    else if (name === 'store') html = decorateStore(html);
    else if (name === 'friends') html = decorateFriends(html);
    else if (name === 'apps') html = decorateMedia(html);
    else if (name === 'settings') html = decorateSettings(html);
    return html;
  };

  Views.mount = function (name, params = {}) {
    baseMount(name, params);
    const root = document.getElementById('viewRoot');
    if (!root) return;
    if (name === 'game') bindGame(root, params);
    else if (name === 'store') bindStore(root);
    else if (name === 'friends') bindFriends(root);
    else if (name === 'apps') bindMedia(root);
    else if (name === 'settings') bindSettingsExtras(root);
  };

  let audioCtx = null;

  function navRoot() {
    if (window.GameBoot && GameBoot.navRoot) { const r = GameBoot.navRoot(); if (r) return r; }
    if (window.Layer && Layer.isOpen) return document.querySelector('#layer .layer__panel');
    if (window.Router && Router.stack && Router.stack.length) return document.getElementById('viewRoot');
    return null;
  }

  function navItems(root) {
    if (!root) return [];
    const sel = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return [...root.querySelectorAll(sel)].filter(el => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 2 && r.height > 2 && cs.display !== 'none' && cs.visibility !== 'hidden' && !el.closest('[hidden]');
    });
  }

  function focusItem(el) {
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) {}
  }

  function moveFocus(root, key) {
    const items = navItems(root);
    if (!items.length) return;
    const cur = document.activeElement;
    let idx = items.indexOf(cur);
    if (idx < 0) { focusItem(items[0]); return; }
    const a = items[idx].getBoundingClientRect();
    const ax = a.left + a.width / 2;
    const ay = a.top + a.height / 2;
    let best = null;
    let bestScore = Infinity;
    items.forEach((el, i) => {
      if (i === idx) return;
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const dx = x - ax;
      const dy = y - ay;
      let primary, secondary;
      if (key === 'ArrowLeft') { if (dx >= -4) return; primary = -dx; secondary = Math.abs(dy); }
      else if (key === 'ArrowRight') { if (dx <= 4) return; primary = dx; secondary = Math.abs(dy); }
      else if (key === 'ArrowUp') { if (dy >= -4) return; primary = -dy; secondary = Math.abs(dx); }
      else { if (dy <= 4) return; primary = dy; secondary = Math.abs(dx); }
      const score = primary + secondary * 0.65;
      if (score < bestScore) { bestScore = score; best = el; }
    });
    if (!best) {
      const order = [...items];
      const next = (key === 'ArrowLeft' || key === 'ArrowUp') ? order[order.length - 1] : order[0];
      focusItem(next);
      return;
    }
    focusItem(best);
  }

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented) return;
    if (window.Boot && Boot.active) return;
    if (window.Lock && Lock.on) return;
    if (window.Launch && Launch.active && !(window.GameBoot && GameBoot.navRoot())) return;
    const tag = (document.activeElement && document.activeElement.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || (document.activeElement && document.activeElement.isContentEditable);
    const root = navRoot();
    if (!root) return;
    if (typing) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      moveFocus(root, e.key);
      return;
    }
    if (e.key === 'Enter') {
      const cur = document.activeElement;
      const target = cur && root.contains(cur) && cur !== root ? cur : root.querySelector('button:not([disabled]), [tabindex="0"]');
      if (target) {
        e.preventDefault();
        e.stopPropagation();
        target.click();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (window.Layer && Layer.isOpen) Layer.close();
      else if (window.Router && Router.stack.length) Router.back();
    }
  }, true);

  function playTone() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.frequency.value = 780;
      o.type = 'sine';
      g.gain.value = 0.035;
      o.connect(g); g.connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + 0.045);
    } catch (e) {}
  }
  document.addEventListener('click', (e) => {
    if (!state.settings.uiSounds) return;
    if (!e.target.closest('button, .btn, .segchip, .iconbtn, .settings__item')) return;
    playTone();
  }, true);

  const padPrev = {};
  let stickAt = 0;
  window.addEventListener('gamepadconnected', () => toast('Геймпад подключён', 'controller', 2200));
  window.addEventListener('gamepaddisconnected', () => toast('Геймпад отключён', 'controller', 1800));
  setInterval(() => {
    if (state.settings.gamepad === false || !navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    const pad = pads && pads[0];
    if (!pad) return;
    const tag = (document.activeElement && document.activeElement.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    const now = Date.now();
    const ax = pad.axes[0] || 0;
    const ay = pad.axes[1] || 0;
    if (now - stickAt > 240) {
      let key = null;
      if (Math.abs(ax) > 0.6 && Math.abs(ax) >= Math.abs(ay)) key = ax < 0 ? 'ArrowLeft' : 'ArrowRight';
      else if (Math.abs(ay) > 0.6) key = ay < 0 ? 'ArrowUp' : 'ArrowDown';
      if (key) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        stickAt = now;
      }
    }
    const map = { 12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight', 0: 'Enter', 1: 'Escape', 9: 'p', 8: 'm' };
    Object.keys(map).forEach(idx => {
      const pressed = pad.buttons[idx] && pad.buttons[idx].pressed;
      if (pressed && !padPrev[idx]) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: map[idx], bubbles: true }));
      }
      padPrev[idx] = pressed;
    });
  }, 100);

  return { applyWallpaper, openHistory, openParty, openTrophies, openTrophiesForLast };
})();

window.Extras = Extras;
