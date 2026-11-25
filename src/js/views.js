(function () {
  const lib = { filter: 'all', sort: 'order', reorder: false };
  if (state.ui && state.ui.lib) Object.assign(lib, state.ui.lib);

  function setLib(key, val) {
    lib[key] = val;
    if (!state.ui) state.ui = {};
    state.ui.lib = { filter: lib.filter, sort: lib.sort };
    save();
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function viewHead(kicker, title, actions = '') {
    return `<header class="view__bar">
      <button class="view__back" data-back>${icon('arrowLeft')} Назад</button>
      <div class="view__titles">${kicker ? `<p class="eyebrow">${kicker}</p>` : ''}<h1>${title}</h1></div>
      ${actions ? `<div class="view__actions">${actions}</div>` : ''}
    </header>`;
  }
  function shellString(o) {
    return `<div class="view__bg"></div>${viewHead(o.kicker, o.title, o.actions || '')}
      <div class="view__scroll"><div class="view__inner ${o.wide ? 'wide' : ''}">${o.body}</div></div>`;
  }

  /* ================= LIBRARY ================= */
  function sortedGames() {
    let arr = homeList();
    if (lib.filter === 'fav') arr = arr.filter(g => isFav(g.id));
    if (lib.filter === 'installed') arr = arr.filter(g => g.installed && !state.removed.includes(g.id));
    if (lib.filter === 'hidden') arr = state.gameOrder.map(getGame).filter(g => g && state.hidden.includes(g.id));
    if (lib.filter === 'removed') arr = state.gameOrder.map(getGame).filter(g => g && state.removed.includes(g.id));
    const s = arr.slice();
    if (lib.sort === 'name') s.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    else if (lib.sort === 'size') s.sort((a, b) => b.size - a.size);
    else if (lib.sort === 'rating') s.sort((a, b) => b.rating - a.rating);
    else s.sort((a, b) => state.gameOrder.indexOf(a.id) - state.gameOrder.indexOf(b.id));
    return s;
  }

  function gameCardHTML(g) {
    const removed = state.removed.includes(g.id);
    const hidden = state.hidden.includes(g.id);
    let tags = '';
    if (isFav(g.id)) tags = `<span class="tile__badge"><span class="tile__tag tile__tag--fav">${icon('heart')}</span></span>`;
    else if (removed) tags = `<span class="tile__badge"><span class="tile__tag">${icon('download')}</span></span>`;
    else if (hidden) tags = `<span class="tile__badge"><span class="tile__tag">${icon('eyeOff')}</span></span>`;
    const reorderNav = lib.reorder ? `<span class="reordernav"><button data-moveleft="${g.id}" aria-label="Влево">${icon('chevronLeft')}</button><button data-moveright="${g.id}" aria-label="Вправо">${icon('chevronRight')}</button></span>` : '';
    return `<div class="gamecard ${lib.reorder ? 'is-reorder' : ''}">
      <button class="gamecard__art" data-gamepage="${g.id}" aria-label="${esc(g.title)}">
        ${coverArt(g)}${reorderNav}${tags}
        ${removed ? `<span class="gamecard__tagfloat">Не установлено</span>` : ''}
      </button>
      <button class="gamecard__more" data-gamemenu="${g.id}" aria-label="Действия">${icon('more')}</button>
      <div class="gamecard__name">${g.title}</div>
      <div class="gamecard__meta"><span>${g.year}</span><span>·</span><span>${fmtSize(g.size)}</span></div>
    </div>`;
  }

  function libraryContent() {
    const filters = [['all', 'Все'], ['installed', 'Установленные'], ['fav', 'Избранное'], ['hidden', 'Скрытые'], ['removed', 'Не установлено']];
    const chips = `<div class="segchips">${filters.map(([k, l]) =>
      `<button class="segchip ${lib.filter === k ? 'is-on' : ''}" data-libfilter="${k}">${l}</button>`).join('')}</div>`;
    const sortOpts = { order: 'По недавним', name: 'По названию', size: 'По размеру', rating: 'По рейтингу' };
    const games = sortedGames();
    let grid;
    if (!games.length) {
      grid = `<div class="empty glass">${icon(lib.filter === 'removed' ? 'download' : lib.filter === 'hidden' ? 'eyeOff' : 'folder')}
        <h3>Здесь пока пусто</h3><p>${lib.filter === 'hidden' ? 'Скрытых игр нет — всё на своих местах.' : lib.filter === 'removed' ? 'Все игры установлены.' : 'Измените фильтр или добавьте игру из магазина.'}</p>
        <button class="btn btn--primary btn--sm" data-libfilter="all">Показать все</button></div>`;
    } else {
      grid = `<div class="gamegrid">${games.map(gameCardHTML).join('')}</div>`;
    }
    const folders = `<div class="folders-row">
      ${state.folders.map(folderCard).join('')}
      <button class="folder-card folder-card--add" data-addfolder>${icon('plus')} Новая папка</button>
    </div>`;
    return `<div class="toolbar">${chips}<span data-sortbtn>${`<button class="dense-select__btn">${icon('sort')} ${sortOpts[lib.sort]}</button>`}</span>
      <button class="view__back reordertoggle" data-reorder>${icon('move')} ${lib.reorder ? 'Готово' : 'Изменить порядок'}</button></div>
      ${folders}
      ${lib.reorder ? `<div class="section-title"><span>Порядок на главном экране</span></div>` : ''}
      ${grid}`;
  }

  function folderCard(f) {
    const gs = f.games.map(getGame).filter(Boolean);
    const mini = gs.slice(0, 4).map(g => `<span class="mini" style="--c1:${g.art.c1};--c3:${g.art.c3}"></span>`).join('');
    return `<button class="folder-card" data-folder="${f.id}">
      <span class="folder-card__grid">${mini}</span>
      <span class="folder-card__inner"><b>${esc(f.name)}</b><small>${gs.length} игр</small></span></button>`;
  }

  function bindLibrary(root) {
    root.querySelectorAll('[data-libfilter]').forEach(b => b.addEventListener('click', () => { setLib('filter', b.dataset.libfilter); Router.render(); }));
    root.querySelector('[data-sortbtn] button')?.addEventListener('click', (e) => openSortMenu(e.currentTarget));
    root.querySelector('[data-reorder]')?.addEventListener('click', () => { setLib('reorder', !lib.reorder); Router.render(); });
    root.querySelectorAll('[data-folder]').forEach(b => b.addEventListener('click', () => Router.open('folder', { id: b.dataset.folder })));
    root.querySelector('[data-addfolder]')?.addEventListener('click', () => createFolderDialog());
    root.querySelectorAll('[data-gamepage]').forEach(b => b.addEventListener('click', () => Router.open('game', { id: b.dataset.gamepage })));
    root.querySelectorAll('[data-gamemenu]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); openGameMenu(getGame(b.dataset.gamemenu)); }));
    root.querySelectorAll('[data-moveleft]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); moveGame(b.dataset.moveleft, -1); }));
    root.querySelectorAll('[data-moveright]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); moveGame(b.dataset.moveright, 1); }));
  }

  function moveGame(id, dir) {
    const i = state.gameOrder.indexOf(id), j = i + dir;
    if (j < 0 || j >= state.gameOrder.length) return;
    const arr = state.gameOrder.slice();
    const [x] = arr.splice(i, 1);
    arr.splice(j, 0, x);
    state.gameOrder = arr; save(); Router.render();
  }

  function openSortMenu(anchor) {
    const opts = [['order', 'По недавним'], ['name', 'По названию'], ['size', 'По размеру'], ['rating', 'По рейтингу']];
    Layer.open(`<div class="menu" style="min-width:15rem">
      <div class="menu__title">Сортировка</div>
      ${opts.map(([k, l], i) => `<button class="menu__item" data-sortitem="${i}">${icon(lib.sort === k ? 'check' : 'sort')}<span>${l}</span></button>`).join('')}
    </div>`, { cls: 'layer--center', onMount(el) {
      el.querySelectorAll('[data-sortitem]').forEach(b => b.addEventListener('click', () => { setLib('sort', opts[Number(b.dataset.sortitem)][0]); Layer.close(); Router.render(); }));
    } });
  }

  function openGameMenu(game) {
    const gid = game.id;
    const fav = isFav(gid);
    const actions = [
      { icon: 'play', label: 'Запустить', act: 'play' },
      { icon: 'heart', label: fav ? 'Убрать из избранного' : 'В избранное', act: 'fav' },
      { icon: 'info', label: 'Подробнее об игре', act: 'info' },
      { icon: 'folder', label: 'Добавить в папку', act: 'folder' },
      { icon: 'move', label: 'Изменить порядок', act: 'order' },
      state.removed.includes(gid)
        ? { icon: 'download', label: 'Установить', act: 'install' }
        : { icon: 'trash', label: 'Удалить из библиотеки', act: 'remove', danger: true },
      state.hidden.includes(gid)
        ? { icon: 'eye', label: 'Показать на главном', act: 'show' }
        : { icon: 'eyeOff', label: 'Скрыть с главного', act: 'hide' }
    ];
    Layer.open(`<div class="menu">
      <div class="menu__title">${esc(game.title)}</div>
      ${actions.map((it, i) => `<button class="menu__item ${it.danger ? 'menu__item--danger' : ''}" data-gmitem="${i}">${icon(it.icon)}<span>${it.label}</span></button>`).join('')}
    </div>`, { cls: 'layer--center', onMount(el) {
      el.querySelectorAll('[data-gmitem]').forEach(b => b.addEventListener('click', () => {
        const act = actions[Number(b.dataset.gmitem)].act;
        Layer.close();
        gameAction(game, act);
      }));
    } });
  }

  function gameAction(game, act) {
    const gid = game.id;
    if (act === 'play') { Launch.start(gid); return; }
    if (act === 'info') { Router.open('game', { id: gid }); return; }
    if (act === 'fav') { toggleFav(gid); toast(isFav(gid) ? 'Добавлено в избранное' : 'Убрано из избранного', 'heart'); Router.render(); return; }
    if (act === 'order') { setLib('reorder', true); setLib('filter', 'all'); Router.open('library'); return; }
    if (act === 'remove') {
      dialog({
        title: `Удалить «${game.title}»?`,
        text: 'Игра будет удалена с консоли. Сохранения останутся, установить заново можно из магазина или библиотеки.',
        iconName: 'trash', tone: 'danger',
        actions: [
          { label: 'Удалить', cls: 'btn--danger', onClick: () => { if (!state.removed.includes(gid)) state.removed.push(gid); if (state.ui && state.ui.games === gid) state.ui.games = null; save(); toast('Игра удалена', 'trash'); Router.render(); Home.refresh(); } },
          { label: 'Отмена', cls: 'btn--ghost', onClick: () => {} }
        ]
      });
      return;
    }
    if (act === 'install') {
      if (window.Downloads) Downloads.start(game);
      else toast('Менеджер загрузок недоступен', 'x');
      return;
    }
    if (act === 'hide') {
      if (!state.hidden.includes(gid)) state.hidden.push(gid);
      if (state.ui && state.ui.games === gid) state.ui.games = null;
      save(); toast(`«${game.title}» скрыта с главного`, 'eyeOff'); Router.render(); Home.refresh(); return;
    }
    if (act === 'show') {
      state.hidden = state.hidden.filter(x => x !== gid);
      if (state.ui && state.ui.games === gid) state.ui.games = null;
      save(); toast('Игра снова на главном экране', 'eye'); Router.render(); Home.refresh(); return;
    }
    if (act === 'folder') pickFolder(game);
  }

  function pickFolder(game) {
    const folders = state.folders;
    Layer.open(`<div class="menu" style="min-width:17rem">
      <div class="menu__title">Добавить в папку</div>
      ${folders.length ? folders.map((f, i) => `<button class="menu__item" data-fpick="${i}">${icon(f.games.includes(game.id) ? 'check' : 'folder')}<span>${esc(f.name)}</span></button>`).join('') : ''}
      <button class="menu__item" data-fpick="new">${icon('plus')}<span>Новая папка…</span></button>
    </div>`, { cls: 'layer--center', onMount(el) {
      el.querySelectorAll('[data-fpick]').forEach(b => b.addEventListener('click', () => {
        Layer.close();
        if (b.dataset.fpick === 'new') { createFolderDialog(game); return; }
        const f = state.folders[Number(b.dataset.fpick)];
        if (f.games.includes(game.id)) f.games = f.games.filter(x => x !== game.id);
        else f.games.push(game.id);
        save(); toast(`Папка «${f.name}» обновлена`, 'folder'); Router.render();
      }));
    } });
  }

  function createFolderDialog(game = null) {
    Layer.close();
    setTimeout(() => Layer.open(`<div class="dialog">
      <div class="dialog__icon">${icon('folder')}</div>
      <h3>Новая папка</h3>
      <p>Дайте папке название — игры можно добавить позже.</p>
      <input class="textinput" style="width:100%;max-width:none;margin-top:.8rem" data-folderinput maxlength="24" placeholder="Например, «На вечер»">
      <div class="dialog__actions">
        <button class="btn btn--primary" data-folderok>Создать</button>
        <button class="btn btn--ghost" data-folderclose>Отмена</button>
      </div></div>`, { cls: 'layer--center', onMount(el) {
      const input = el.querySelector('[data-folderinput]');
      input.focus({ preventScroll: true });
      const ok = () => {
        const name = input.value.trim() || 'Новая папка';
        const f = { id: 'fold' + Date.now(), name, games: game ? [game.id] : [] };
        state.folders.push(f); save();
        Layer.close(); toast(`Папка «${name}» создана`, 'folder'); Router.render();
      };
      el.querySelector('[data-folderok]').addEventListener('click', ok);
      el.querySelector('[data-folderclose]').addEventListener('click', () => Layer.close());
      input.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
    } }), 120);
  }

  function folderContent(params) {
    const f = state.folders.find(x => x.id === params.id);
    if (!f) return { title: 'Папка', body: `<div class="empty glass">${icon('folder')}<h3>Папка не найдена</h3><button class="btn btn--primary btn--sm" data-back>К библиотеке</button></div>` };
    const gs = f.games.map(getGame).filter(Boolean);
    const body = `<div class="toolbar">
        <button class="view__back" data-frename>${icon('edit')} Переименовать</button>
        <button class="view__back" data-fdelete>${icon('trash')} Удалить папку</button>
      </div>
      <div class="section-title"><span>${esc(f.name)} · ${gs.length} игр</span></div>
      ${gs.length ? `<div class="gamegrid">${gs.map(gameCardHTML).join('')}</div>` : `<div class="empty glass">${icon('folder')}<h3>В папке пусто</h3><p>Добавьте игры через меню «…» на карточке в библиотеке.</p><button class="btn btn--primary btn--sm" data-back>В библиотеку</button></div>`}`;
    return { title: esc(f.name), body };
  }

  function bindFolder(root, params) {
    bindLibrary(root);
    root.querySelector('[data-frename]')?.addEventListener('click', () => {
      const f = state.folders.find(x => x.id === params.id); if (!f) return;
      Layer.open(`<div class="dialog"><div class="dialog__icon">${icon('edit')}</div><h3>Переименовать папку</h3><input class="textinput" style="width:100%;max-width:none;margin-top:.8rem" data-rname value="${esc(f.name)}" maxlength="24"><div class="dialog__actions"><button class="btn btn--primary" data-rok>Сохранить</button><button class="btn btn--ghost" data-rclose>Отмена</button></div></div>`, { cls: 'layer--center', onMount(el) {
        const inp = el.querySelector('[data-rname]'); inp.focus(); inp.select();
        el.querySelector('[data-rok]').addEventListener('click', () => { f.name = inp.value.trim() || f.name; save(); Layer.close(); Router.render(); });
        el.querySelector('[data-rclose]').addEventListener('click', () => Layer.close());
      } });
    });
    root.querySelector('[data-fdelete]')?.addEventListener('click', () => {
      const f = state.folders.find(x => x.id === params.id); if (!f) return;
      dialog({ title: `Удалить папку «${f.name}»?`, text: 'Игры останутся в библиотеке.', iconName: 'trash', tone: 'danger',
        actions: [{ label: 'Удалить', cls: 'btn--danger', onClick: () => { state.folders = state.folders.filter(x => x.id !== f.id); save(); Router.back(); toast('Папка удалена', 'trash'); } }, { label: 'Отмена', cls: 'btn--ghost', onClick: () => {} }] });
    });
  }

  /* ================= GAME PAGE ================= */
  function gamePageView(params) {
    const g = getGame(params.id);
    if (!g) return `<div class="view__bg"></div>${viewHead('Библиотека', 'Игра не найдена')}<div class="view__scroll"><div class="view__inner"><div class="empty glass">${icon('info')}<h3>Игра не найдена</h3></div></div></div>`;
    const removed = state.removed.includes(g.id), fav = isFav(g.id);
    const platinum = g.trophies.have >= g.trophies.total ? 1 : 0;
    const gold = Math.round((g.trophies.have - platinum) * .22);
    const silver = Math.round((g.trophies.have - platinum) * .38);
    const bronze = Math.max(0, g.trophies.have - platinum - gold - silver);
    const sim = GAMES.filter(x => x.id !== g.id).sort((a, b) => (b.rating + b.progress / 100) - (a.rating + a.progress / 100)).slice(0, 4);

    return `<div class="gamepage">
      <div class="gpherobg">${coverArt(g, { hero: true, plain: true })}</div>
      <div class="gptop"><button class="view__back" data-back>${icon('arrowLeft')} Назад</button></div>
      <div class="gpmain">
        <div class="gpcover">${coverArt(g)}</div>
        <div class="gpinfo">
          <p class="eyebrow gpeyebrow">${g.logo ? `<img class="gpstudio" src="${assetUrl(g.logo)}" alt="${g.studio}">` : ''}<span>${g.studio} · ${g.year}</span></p>
          <h1>${g.title}</h1>
          <p class="sub">${g.sub} · ${g.genre}</p>
          <div class="gpmeta">
            <span class="chip">${icon('clock')}${g.playtime}</span>
            <span class="chip chip--gold">${icon('trophy')}${g.trophies.have}/${g.trophies.total}</span>
            <span class="chip">${icon('disc')}${fmtSize(g.size)}</span>
            <span class="chip">${icon('star')}${g.rating.toFixed(1)}</span>
          </div>
          <div class="gpactions">
            <button class="btn btn--primary" data-gplay="${g.id}">${icon('play')} ${removed ? 'Установить' : 'Запустить'}</button>
            <button class="btn btn--accent" data-gfav="${g.id}">${icon('heart')} ${fav ? 'В избранном' : 'В избранное'}</button>
            <button class="btn btn--ghost" data-gmenu="${g.id}">${icon('more')} Ещё</button>
          </div>
        </div>
      </div>
      <div class="gpbody"><div class="gpinner">
        <div class="gponeside">
          <div class="gpcard"><h3>${icon('info')} Об игре</h3><p class="gpdesc">${g.desc}</p></div>
          <div class="gpcard"><h3>${icon('camera')} Медиа</h3><div class="mediarow">
            ${[0, 34, -26].map((h, i) => `<div class="mediacard" data-cap="${['Игровой процесс', 'Кат-сцена', 'Открытый мир'][i]}">
              <div style="position:absolute;inset:0;filter:hue-rotate(${h}deg) saturate(1.15)">${coverArt(g, { plain: true })}</div>
            </div>`).join('')}
          </div></div>
          <div class="gpcard"><h3>${icon('app')} Похожие игры</h3><div class="similar-row">${sim.map(s =>
            `<div class="similar"><button class="smin" data-gamepage2="${s.id}">${coverArt(s)}</button><small>${s.title}</small></div>`).join('')}</div></div>
        </div>
        <div class="gpside">
          <div class="gpcard"><h3>${icon('trophy')} Трофеи</h3><div class="trophy-stats">
            <div class="ts ts--platinum"><b>${platinum}</b><span>Платина</span></div>
            <div class="ts ts--gold"><b>${gold}</b><span>Золото</span></div>
            <div class="ts ts--silver"><b>${silver}</b><span>Серебро</span></div>
            <div class="ts ts--bronze"><b>${bronze}</b><span>Бронза</span></div>
            <div class="ts"><b>${g.trophies.have}</b><span>Всего</span></div></div></div>
          <div class="gpcard"><h3>${icon('check')} Детали</h3><div class="detailrows">
            ${[['Разработчик', g.studio], ['Издатель', g.publisher], ['Жанр', g.genre], ['Размер', fmtSize(g.size)], ['Версия', g.version], ['Разрешение', 'до 3840×2160'], ['Частота', 'до 60 FPS'], ['HDR', 'Поддерживается']].map(([k, v]) => `<div class="row"><span>${k}</span><b>${v}</b></div>`).join('')}
          </div></div>
          <div class="gpcard"><h3>${icon('clock')} Активность</h3>
            <div class="progresslab"><span>Прогресс</span><b>${g.progress}%</b></div>
            <div class="hero__progressbar" style="width:100%"><i style="width:${g.progress}%"></i></div>
            <div class="detailrows" style="margin-top:1rem">
              <div class="row"><span>Время в игре</span><b>${g.playtime}</b></div>
              <div class="row"><span>Последний запуск</span><b>${g.lastPlayed}</b></div>
              <div class="row"><span>Состояние</span><b>${removed ? 'Удалена' : 'Установлена'}</b></div>
            </div>
          </div>
        </div>
      </div></div>
    </div>`;
  }

  function bindGamePage(root) {
    root.querySelector('[data-gplay]')?.addEventListener('click', (e) => {
      const g = getGame(e.currentTarget.dataset.gplay);
      if (state.removed.includes(g.id)) {
        if (window.Downloads) Downloads.start(g);
        else toast('Менеджер загрузок недоступен', 'x');
      } else Launch.start(g.id);
    });
    root.querySelector('[data-gfav]')?.addEventListener('click', (e) => {
      const g = getGame(e.currentTarget.dataset.gfav);
      toggleFav(g.id);
      toast(isFav(g.id) ? 'Добавлено в избранное' : 'Убрано из избранного', 'heart');
      Router.render(); Home.refresh();
    });
    root.querySelector('[data-gmenu]')?.addEventListener('click', (e) => openGameMenu(getGame(e.currentTarget.dataset.gmenu)));
    root.querySelectorAll('[data-gamepage2]').forEach(b => b.addEventListener('click', () => Router.open('game', { id: b.dataset.gamepage2 })));
  }

  /* ================= APPS ================= */
  function appsView() {
    const body = `<div class="toolbar"><div class="segchips">
        <button class="segchip is-on">Все</button><button class="segchip">Видео</button><button class="segchip">Музыка</button><button class="segchip">Стримы</button>
      </div><span class="count-pill">${APPS.length} приложений</span></div>
      <div class="appgrid" style="grid-template-columns:repeat(auto-fill,minmax(13rem,1fr))">
        ${APPS.map(a => `<button class="storecard" data-openapp="${a.id}"><span class="art" style="aspect-ratio:16/10">${appArt(a)}</span><b>${a.title}</b><small>${a.tag}</small></button>`).join('')}
      </div>`;
    return shellString({ kicker: 'PS5 · Медиа', title: 'Все приложения', body });
  }
  function bindApps(root) {
    root.querySelectorAll('[data-openapp]').forEach(b => b.addEventListener('click', () => AppHost.open(b.dataset.openapp)));
    root.querySelectorAll('.segchip').forEach((b, i, arr) => b.addEventListener('click', () => arr.forEach(x => x.classList.toggle('is-on', x === b))));
  }

  /* ================= SETTINGS ================= */
  const SETTAB = { system: 'Система', display: 'Звук и экран', network: 'Сеть', users: 'Пользователи', notif: 'Уведомления', storage: 'Хранилище', power: 'Питание', acc: 'Аксессуары', about: 'О системе' };
  const SETICON = { system: 'settings', display: 'display', network: 'wifi', users: 'users', notif: 'bell', storage: 'storage', power: 'power', acc: 'controller', about: 'info' };

  function settingsView(params) {
    const tab = SETTAB[params.tab] ? params.tab : 'system';
    return `<div class="view__bg"></div>
      ${viewHead('PS5 · Настройки', 'Настройки', `<span class="chip">${icon('settings')} v25.01</span>`)}
      <div class="settings">
        <div class="settings__nav">${Object.entries(SETTAB).map(([k, l]) => `<button class="settings__item ${k === tab ? 'is-on' : ''}" data-settab="${k}">${icon(SETICON[k])}<span>${l}</span></button>`).join('')}</div>
        <div class="settings__content"><div class="settings__inner">${settingsBody(tab)}</div></div>
      </div>`;
  }

  function group(title, inner) { return `<div class="set-group"><h3>${title}</h3>${inner}</div>`; }
  function setRow(name, sub, control) { return `<div class="setrow"><div class="setrow__txt"><b>${name}</b><span>${sub}</span></div>${control || ''}</div>`; }
  function toggle(key) {
    const on = !!state.settings[key];
    return `<button class="switch ${on ? 'is-on' : ''}" data-toggle="${key}" role="switch" aria-checked="${on}" aria-label="${key}"></button>`;
  }

  function settingsBody(tab) {
    const s = state.settings;
    if (tab === 'system') {
      return group('Общие', `
        ${setRow('Язык интерфейса', 'Русский', `<div class="seg"><button class="is-on">Русский</button><button data-lang>English</button></div>`)}
        ${setRow('Имя пользователя', 'Отображается друзьям в сети', `<input class="textinput" data-nameinput value="${esc(state.user.name)}" maxlength="16">`)}
        ${setRow('Заставка', 'Показывать часы после долгого простоя', toggle('screensaver'))}
        ${setRow('Автоматическое обновление', 'Устанавливать обновления в фоне', toggle('autoUpdate'))}`)
        + group('Обновление системы', `${setRow('Программное обеспечение', 'PS5 OS 25.01 · обновлено сегодня', `<button class="btn btn--ghost btn--sm" data-update>Проверить</button>`)}`)
        + group('Сброс', `${setRow('Сбросить настройки', 'Вернуть значения по умолчанию', `<button class="btn btn--danger btn--sm" data-reset>Сбросить</button>`)}`);
    }
    if (tab === 'display') {
      const res = [['auto', 'Авто'], ['1080p', '1080p'], ['1440p', '1440p'], ['2160p', '4K']];
      return group('Изображение', `
        ${setRow('Разрешение вывода', 'Автоматически подстраивается под экран', `<div class="seg">${res.map(([v, l]) => `<button class="${s.resolution === v ? 'is-on' : ''}" data-res="${v}">${l}</button>`).join('')}</div>`)}
        ${setRow('Режим изображения', 'Приоритет качества или частоты кадров', `<div class="seg"><button class="${s.picture === 'fidelity' ? 'is-on' : ''}" data-pic="fidelity">Качество</button><button class="${s.picture === 'performance' ? 'is-on' : ''}" data-pic="performance">Производительность</button></div>`)}
        ${setRow('HDR', 'Расширенный динамический диапазон', toggle('hdr'))}
        ${setRow('VRR', 'Переменная частота обновления', toggle('vrr'))}`)
        + group('Экран', `${setRow('Яркость интерфейса', 'Регулировка подсветки интерфейса', `<div style="flex:3;min-width:10rem;display:flex;align-items:center;gap:.8rem"><input type="range" min="40" max="100" value="${s.brightness}" data-slider="brightness"><span class="val" data-slval="brightness">${s.brightness}%</span></div>`)}`)
        + group('Звук', `${setRow('Громкость', 'Основной уровень звука', `<div style="flex:3;min-width:10rem;display:flex;align-items:center;gap:.8rem"><input type="range" min="0" max="100" value="${s.volume}" data-slider="volume"><span class="val" data-slval="volume">${s.volume}%</span></div>`)}`);
    }
    if (tab === 'network') {
      return group('Подключение', `
        ${setRow('Wi-Fi', 'Беспроводная сеть 5 ГГц', toggle('wifi'))}
        ${setRow('Состояние', s.wifi ? 'Подключено · интернет доступен' : 'Нет подключения', s.wifi ? `<span class="chip chip--ok">${icon('wifi')} Онлайн</span>` : `<span class="chip">Офлайн</span>`)}
        ${setRow('Bluetooth', 'Контроллеры и гарнитуры', toggle('bluetooth'))}`)
        + group('Диагностика', `${setRow('Скорость соединения', 'Проверить скорость и качество сети', `<button class="btn btn--ghost btn--sm" data-speed>Проверить</button>`)}`)
        + group('Загрузки', `${setRow('Загрузки в режиме покоя', 'Продолжать установку в режиме ожидания', toggle('standbyInternet'))}
        ${setRow('Скорость загрузки', 'Максимум для симуляции, Мбит/с', '<select class="textinput setselect" data-dlspeed><option value="50">50</option><option value="100">100</option><option value="250">250</option><option value="500">500</option><option value="1000">1000</option></select>')}
        ${setRow('Ускорение симуляции', '×1 — реальное время, ×120 — быстро', '<select class="textinput setselect" data-dltime><option value="1">×1</option><option value="30">×30</option><option value="60">×60</option><option value="120">×120</option></select>')}
        ${setRow('Активные загрузки', 'Текущая загрузка и очередь', '<button class="btn btn--ghost btn--sm" data-dlopen>Открыть менеджер</button>')}`);
    }
    if (tab === 'users') {
      return group('Текущий профиль', `
        ${setRow('Профиль', SESSION.name, `<span class="avatar avatar--sm">${SESSION.guest ? 'Г' : SESSION.name.charAt(0)}</span>`)}
        ${setRow('Уровень', SESSION.guest ? 'Гостевой профиль' : 'Уровень ' + state.user.level, `<span class="chip chip--gold">${icon('trophy')} Lv ${state.user.level}</span>`)}
        ${setRow('Имя в сети', 'Можно изменить в любой момент', `<button class="btn btn--ghost btn--sm" data-changename>Изменить</button>`)}`)
        + group('Профиль', `${setRow('Статистика и трофеи', 'Открыть страницу профиля', `<button class="btn btn--ghost btn--sm" data-profile>Профиль</button>`)}
        ${setRow('Выйти из системы', 'Вернуться к выбору пользователя', `<button class="btn btn--danger btn--sm" data-logout>Выйти</button>`)}`);
    }
    if (tab === 'notif') {
      return group('Оповещения', `
        ${setRow('Уведомления', 'Показывать системные уведомления', toggle('notifications'))}
        ${setRow('Загрузки', 'Завершение установки и обновлений', toggle('downloadNotif'))}
        ${setRow('Друзья', 'Когда друзья выходят в сеть', toggle('friendNotif'))}
        ${setRow('Магазин', 'Скидки и новинки PlayStation Store', toggle('storeNotif'))}`)
        + group('История', `${setRow('Все уведомления', `${unreadCount()} непрочитанных`, `<button class="btn btn--ghost btn--sm" data-opennotif>Открыть</button>`)}`);
    }
    if (tab === 'storage') {
      const games = STORAGE.used - STORAGE.system - STORAGE.apps;
      const top = GAMES.slice().sort((a, b) => b.size - a.size).slice(0, 6);
      return group('Использование памяти', `
        <div class="storage-total"><i class="store-part--games" style="width:${games / STORAGE.total * 100}%"></i><i class="store-part--apps" style="width:${STORAGE.apps / STORAGE.total * 100}%"></i><i class="store-part--system" style="width:${STORAGE.system / STORAGE.total * 100}%"></i></div>
        <div class="storage-legend"><span class="k"><span class="sw store-part--games"></span>Игры · ${fmtSize(games)}</span><span class="k"><span class="sw store-part--apps"></span>Приложения · ${fmtSize(STORAGE.apps)}</span><span class="k"><span class="sw store-part--system"></span>Система · ${fmtSize(STORAGE.system)}</span></div>
        <div class="progresslab" style="margin-top:1.2rem"><span>Занято ${Math.round(STORAGE.used / STORAGE.total * 100)}%</span><span>${fmtSize(STORAGE.used)} из ${fmtSize(STORAGE.total)}</span></div>`)
        + group('Крупнейшие игры', top.map(g => `<div class="setrow"><div class="setrow__txt"><b>${g.title}</b><span>${fmtSize(g.size)}</span></div><button class="btn btn--ghost btn--sm" data-storage-open="${g.id}">Открыть</button></div>`).join(''));
    }
    if (tab === 'power') {
      return group('Режим покоя', `
        ${setRow('Режим покоя', 'Быстрое включение и фоновые задачи', toggle('restMode'))}
        ${setRow('Интернет в режиме покоя', 'Оставаться в сети для загрузок', toggle('standbyInternet'))}`)
        + group('Управление питанием', `
          <div class="setrow"><div class="setrow__txt"><b>Режим покоя</b><span>Перевести консоль в ожидание</span></div><button class="btn btn--ghost btn--sm" data-pow="rest">Покой</button></div>
          <div class="setrow"><div class="setrow__txt"><b>Перезагрузка</b><span>Перезапустить систему</span></div><button class="btn btn--ghost btn--sm" data-pow="restart">Перезагрузить</button></div>
          <div class="setrow"><div class="setrow__txt"><b>Выключение</b><span>Полностью выключить консоль</span></div><button class="btn btn--danger btn--sm" data-pow="off">Выключить</button></div>`);
    }
    if (tab === 'acc') {
      return group('Контроллеры', `
        ${setRow('DualSense', 'Подключён по Bluetooth · заряд 78%', `<span class="chip chip--ok">${icon('controller')} Подключён</span>`)}
        ${setRow('Тактильная отдача', 'Адаптивные триггеры и вибрация', toggle('haptics'))}
        ${setRow('Динамик контроллера', 'Звуки интерфейса и игры', toggle('ctrlSpeaker'))}`)
        + group('Аудиоустройства', `${setRow('Pulse Elite', 'Беспроводная гарнитура · не подключена', `<span class="chip">Нет связи</span>`)}`);
    }
    if (tab === 'about') {
      return group('О системе', `<div class="gpcard" style="background:transparent;border:0;padding:0">
          <b style="font-size:1.1rem">PS5 OS 25.01</b>
          <p class="gpdesc" style="margin-top:.5rem">Версия 25.01 · ревизия 1A · серийный номер DEMO-PS5-0001.</p>
          <p class="gpdesc" style="margin-top:.6rem;color:var(--muted-2)">Учебный проект-имитация интерфейса PlayStation 5. Автор — XPRODC. Не является официальным программным обеспечением Sony Interactive Entertainment. Названия игр, приложений и брендов принадлежат их правообладателям и используются в иллюстративных целях.</p>
        </div>`)
        + group('Характеристики', `${setRow('Процессор', 'AMD Zen 2 · 8 ядер · 3,5 ГГц', '')}${setRow('Графика', 'AMD RDNA 2 · 10,28 ТФЛОПС', '')}${setRow('Память', '16 ГБ GDDR6 · 448 ГБ/с', '')}${setRow('Накопитель', 'SSD 825 ГБ · 5,5 ГБ/с', '')}`)
        + group('Благодарности', `${setRow('Автор', 'XPRODC', '')}${setRow('Соавтор', 'Cloud', '')}`);
    }
    return '';
  }

  function bindSettings(root) {
    const s = state.settings;
    root.querySelectorAll('[data-settab]').forEach(b => b.addEventListener('click', () => Router.open('settings', { tab: b.dataset.settab })));
    root.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.toggle;
      s[k] = !s[k]; save();
      b.classList.toggle('is-on', s[k]);
      b.setAttribute('aria-checked', s[k]);
      if (k === 'wifi') {
        Home.refresh();
      }
      toast(`${labelOf(k)}: ${s[k] ? 'включено' : 'выключено'}`, s[k] ? 'check' : 'x', 2000);
    }));
    root.querySelectorAll('[data-res]').forEach(b => b.addEventListener('click', () => {
      s.resolution = b.dataset.res; save();
      root.querySelectorAll('[data-res]').forEach(x => x.classList.toggle('is-on', x === b));
      toast(`Разрешение вывода: ${{ auto: 'авто', '1080p': '1080p', '1440p': '1440p', '2160p': '4K HDR' }[s.resolution]}`, 'display');
    }));
    root.querySelectorAll('[data-pic]').forEach(b => b.addEventListener('click', () => {
      s.picture = b.dataset.pic; save();
      root.querySelectorAll('[data-pic]').forEach(x => x.classList.toggle('is-on', x === b));
    }));
    root.querySelectorAll('[data-slider]').forEach(input => {
      const key = input.dataset.slider;
      const lbl = root.querySelector(`[data-slval="${key}"]`);
      const apply = () => {
        s[key] = Number(input.value); save();
        if (lbl) lbl.textContent = s[key] + '%';
        if (key === 'brightness') document.getElementById('os').style.filter = `brightness(${s.brightness}%)`;
      };
      input.addEventListener('input', apply);
      if (key === 'brightness') document.getElementById('os').style.filter = `brightness(${s.brightness}%)`;
    });
    root.querySelector('[data-nameinput]')?.addEventListener('change', (e) => {
      const v = e.target.value.trim() || 'Stepa_';
      state.user.name = v; state.settings.name = v; SESSION.name = v; save();
      document.getElementById('topName').textContent = v;
      toast('Имя профиля сохранено', 'check');
    });
    root.querySelector('[data-reset]')?.addEventListener('click', () => {
      dialog({ title: 'Сбросить настройки?', text: 'Настройки вернутся к значениям по умолчанию. Библиотека и сохранения останутся.', iconName: 'restart', tone: 'danger',
        actions: [{ label: 'Сбросить', cls: 'btn--danger', onClick: () => { try { localStorage.removeItem(LS_KEY); } catch (e) {} location.reload(); } }, { label: 'Отмена', cls: 'btn--ghost', onClick: () => {} }] });
    });
    root.querySelector('[data-update]')?.addEventListener('click', () => toast('Установлена последняя версия системы', 'check'));
    
    const dlSpeed = root.querySelector('[data-dlspeed]');
    if (dlSpeed) {
      dlSpeed.value = String(s.downloadSpeed || 100);
      dlSpeed.addEventListener('change', () => {
        s.downloadSpeed = +dlSpeed.value; save();
        toast('Скорость загрузки: ' + s.downloadSpeed + ' Мбит/с', 'download');
      });
    }
    const dlTime = root.querySelector('[data-dltime]');
    if (dlTime) {
      dlTime.value = String(Number.isFinite(+s.downloadTimeScale) ? s.downloadTimeScale : 60);
      dlTime.addEventListener('change', () => {
        s.downloadTimeScale = +dlTime.value; save();
        toast('Ускорение симуляции: ×' + s.downloadTimeScale, 'clock');
      });
    }
    root.querySelector('[data-dlopen]')?.addEventListener('click', () => { if (window.Downloads) Downloads.openManager(); });
root.querySelector('[data-speed]')?.addEventListener('click', () => toast('Скорость: 92 Мбит/с · пинг 8 мс', 'network'));
    root.querySelector('[data-lang]')?.addEventListener('click', () => toast('Английский интерфейс появится позже', 'language'));
    root.querySelector('[data-changename]')?.addEventListener('click', changeNameDialog);
    root.querySelector('[data-profile]')?.addEventListener('click', () => Router.open('profile'));
    root.querySelector('[data-logout]')?.addEventListener('click', () => Power.confirmLogout());
    root.querySelector('[data-opennotif]')?.addEventListener('click', () => Router.open('notifications'));
    root.querySelectorAll('[data-pow]').forEach(b => b.addEventListener('click', () => {
      const p = b.dataset.pow;
      if (p === 'rest') Power.rest();
      else if (p === 'restart') Power.confirmRestart();
      else Power.confirmOff();
    }));
    root.querySelectorAll('[data-storage-open]').forEach(b => b.addEventListener('click', () => Router.open('game', { id: b.dataset.storageOpen })));
  }

  function labelOf(k) {
    return { hdr: 'HDR', vrr: 'VRR', screensaver: 'Заставка', autoUpdate: 'Автообновление', wifi: 'Wi-Fi', bluetooth: 'Bluetooth', restMode: 'Режим покоя', standbyInternet: 'Интернет в покое', notifications: 'Уведомления', downloadNotif: 'Уведомления о загрузках', friendNotif: 'Уведомления о друзьях', storeNotif: 'Уведомления магазина', haptics: 'Виброотклик', ctrlSpeaker: 'Динамик контроллера' }[k] || k;
  }

  function changeNameDialog() {
    Layer.open(`<div class="dialog"><div class="dialog__icon">${icon('user')}</div><h3>Имя в сети</h3><p>Так вас увидят друзья.</p>
      <input class="textinput" style="width:100%;max-width:none;margin-top:.7rem" data-newname value="${esc(state.user.name)}" maxlength="16">
      <div class="dialog__actions"><button class="btn btn--primary" data-nok>Сохранить</button><button class="btn btn--ghost" data-nclose>Отмена</button></div></div>`, { cls: 'layer--center', onMount(el) {
      const inp = el.querySelector('[data-newname]'); inp.focus(); inp.select();
      el.querySelector('[data-nok]').addEventListener('click', () => {
        const v = inp.value.trim() || 'Stepa_';
        state.user.name = v; state.settings.name = v; SESSION.name = v; save();
        document.getElementById('topName').textContent = v;
        Layer.close(); toast('Имя обновлено', 'check'); Home.refresh();
      });
      el.querySelector('[data-nclose]').addEventListener('click', () => Layer.close());
    } });
  }

  /* ================= PROFILE ================= */
  function profileView() {
    const plays = GAMES.slice(0, 4);
    const body = `<div class="view__bg"></div>
      ${viewHead('Профиль', SESSION.name, `<button class="view__back" data-editprofile>${icon('edit')} Изменить</button>`)}
      <div class="view__scroll"><div class="profile">
        <div class="profile__bg"></div>
        <div class="profile__wrap">
          <div class="profile__head glass">
            <span class="avatar avatar--xl">${SESSION.guest ? 'Г' : SESSION.name.charAt(0)}</span>
            <div class="profile__id">
              <h1>${SESSION.name}</h1>
              <div class="status"><span class="dot"></span>${SESSION.guest ? 'Гостевой профиль' : state.user.online}</div>
              <div class="levbar"><i style="width:${TROPHIES.progress}%"></i></div>
              <small style="color:var(--muted);font-size:.72rem">Уровень ${state.user.level} · ${TROPHIES.progress}% до следующего уровня</small>
            </div>
            <span class="chip chip--ok">${icon('shield')} PS Plus Essential</span>
          </div>
          <div class="statgrid">
            <div class="statcard glass"><b>${TROPHIES.platinum}</b><span>Платина</span></div>
            <div class="statcard glass"><b>${TROPHIES.gold}</b><span>Золото</span></div>
            <div class="statcard glass"><b>${TROPHIES.silver}</b><span>Серебро</span></div>
            <div class="statcard glass"><b>${TROPHIES.bronze}</b><span>Бронза</span></div>
            <div class="statcard glass"><b>${GAMES.length}</b><span>Игр в библиотеке</span></div>
            <div class="statcard glass"><b>${GAMES.reduce((a, g) => a + parseInt(g.playtime), 0)} ч</b><span>В играх</span></div>
          </div>
          <div class="profile__cols">
            <div class="gpcard"><h3>${icon('clock')} Недавно играли</h3>
              ${plays.map(g => `<div class="playsmall"><span class="thumb">${coverArt(g)}</span>
                <div class="txt"><b>${g.title}</b><small>${g.lastPlayed}</small><div class="pb" style="margin-top:.3rem"><i style="width:${g.progress}%"></i></div></div>
                <button class="btn btn--ghost btn--sm" data-profile-open="${g.id}">Открыть</button></div>`).join('')}
            </div>
            <div class="gpside">
              <div class="gpcard"><h3>${icon('trophy')} Трофеи</h3>
                <div class="trophy-stats">${[['platinum', 'Платина', TROPHIES.platinum], ['gold', 'Золото', TROPHIES.gold], ['silver', 'Серебро', TROPHIES.silver], ['bronze', 'Бронза', TROPHIES.bronze]].map(([c, l, n]) => `<div class="ts ts--${c}"><b>${n}</b><span>${l}</span></div>`).join('')}</div>
              </div>
              <div class="gpcard"><h3>${icon('users')} Друзья</h3>
                ${FRIENDS.filter(f => f.status === 'online').slice(0, 3).map(f => `<div class="playsmall"><span class="avatar avatar--sm" style="background:linear-gradient(145deg,${f.color[0]},${f.color[1]})">${f.name.charAt(0)}</span><div class="txt"><b>${f.name}</b><small>${f.game || 'В сети'}</small></div><span class="dot dot--live"></span></div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div></div>`;
    return body;
  }
  function bindProfile(root) {
    root.querySelectorAll('[data-profile-open]').forEach(b => b.addEventListener('click', () => Router.open('game', { id: b.dataset.profileOpen })));
    root.querySelector('[data-editprofile]')?.addEventListener('click', changeNameDialog);
  }

  /* ================= FRIENDS ================= */
  function friendsView() {
    const groups = [['online', 'В сети'], ['away', 'Отошли'], ['offline', 'Не в сети']];
    const body = groups.map(([st, title]) => {
      const fs = FRIENDS.filter(f => f.status === st);
      if (!fs.length) return '';
      return `<div class="friendgroup"><h3>${title} · ${fs.length}</h3>${fs.map(f =>
        `<div class="friendrow">
          <span class="avatar" style="background:linear-gradient(145deg,${f.color[0]},${f.color[1]})">${f.name.charAt(0)}</span>
          <div class="fid"><b>${f.name}</b><small>${f.game ? 'Играет в ' + f.game : f.text}</small></div>
          <div class="fst"><span class="dot" style="background:${f.status === 'online' ? 'var(--ok)' : f.status === 'away' ? 'var(--gold)' : 'var(--muted-2)'}"></span>${st === 'online' ? 'В сети' : st === 'away' ? 'Отошёл' : 'Не в сети'}</div>
          <span class="lev">${icon('trophy')} ${f.level}</span>
          <button class="btn btn--ghost btn--sm" data-chat="${f.id}">${icon('message')} Написать</button>
        </div>`).join('')}</div>`;
    }).join('');
    return shellString({
      kicker: 'Сообщество', title: 'Друзья', sub: `${FRIENDS.filter(f => f.status === 'online').length} в сети`,
      actions: `<button class="view__back" data-addfriend>${icon('plus')} Добавить</button>`,
      body
    });
  }
  function bindFriends(root) {
    root.querySelectorAll('[data-chat]').forEach(b => b.addEventListener('click', () => openChat(FRIENDS.find(f => f.id === b.dataset.chat))));
    root.querySelector('[data-addfriend]')?.addEventListener('click', () => toast('Поиск друзей', 'users'));
  }

  function openChat(friend) {
    if (!friend) return;
    const msgs = (state.ui?.chat?.[friend.id]) || [];
    Layer.open(`<div class="chat">
      <div class="chat__head">
        <span class="avatar avatar--sm" style="background:linear-gradient(145deg,${friend.color[0]},${friend.color[1]})">${friend.name.charAt(0)}</span>
        <div><b>${friend.name}</b><div style="font-size:.7rem;color:var(--muted)">${friend.status === 'online' ? 'В сети' : friend.text}</div></div>
        <button class="iconbtn" data-chtclose style="margin-left:auto">${icon('x')}</button>
      </div>
      <div class="chat__msgs" data-chatmsgs></div>
      <div class="chat__in">
        <input placeholder="Сообщение…" data-chatinput maxlength="200">
        <button class="btn btn--primary btn--sm" data-chatsend>${icon('arrowRight')}</button>
      </div>
    </div>`, { cls: 'layer--center', onMount(el) {
      const box = el.querySelector('[data-chatmsgs]');
      if (!msgs.length && friend.msg) msgs.push({ t: friend.msg, me: false });
      const persist = () => {
        if (!state.ui) state.ui = {};
        state.ui.chat = state.ui.chat || {};
        state.ui.chat[friend.id] = msgs; save();
      };
      const render = () => {
        box.innerHTML = msgs.map(m => `<div class="msg ${m.me ? 'msg--me' : 'msg--them'}">${esc(m.t)}</div>`).join('');
        box.scrollTop = box.scrollHeight;
      };
      render();
      const input = el.querySelector('[data-chatinput]');
      const send = () => {
        const v = input.value.trim(); if (!v) return;
        msgs.push({ t: v, me: true }); persist(); input.value = ''; render();
        setTimeout(() => { msgs.push({ t: 'Принято, до связи!', me: false }); persist(); render(); }, 1500);
      };
      el.querySelector('[data-chatsend]').addEventListener('click', send);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
      el.querySelector('[data-chtclose]').addEventListener('click', () => Layer.close());
      input.focus();
    } });
  }

  /* ================= NOTIFICATIONS ================= */
  const NICON = { trophy: 'trophy', download: 'download', friend: 'users', system: 'shield', message: 'message', store: 'store' };
  function notificationsView() {
    const body = NOTIFICATIONS.length ? NOTIFICATIONS.map(n => {
      const unread = !state.notificationRead[n.id];
      return `<button class="notifrow ${unread ? 'is-unread' : ''}" data-notif="${n.id}" style="width:100%;text-align:left">
        <span class="nicons nicons--${n.type}">${icon(NICON[n.type] || 'info')}</span>
        <span class="ntxt"><b>${n.title}</b><small>${n.text}</small><div class="nsub">${n.time}</div></span>
        ${unread ? '<span class="unreaddot"></span>' : ''}
      </button>`;
    }).join('') : emptyState();
    return shellString({
      kicker: 'Система', title: 'Уведомления', sub: `${unreadCount()} непрочитанных`,
      actions: `<button class="view__back" data-notifall>${icon('check')} Прочитать все</button>`,
      body
    });
  }
  function bindNotifications(root) {
    root.querySelectorAll('[data-notif]').forEach(b => b.addEventListener('click', () => {
      const n = NOTIFICATIONS.find(x => x.id === b.dataset.notif);
      if (!n) return;
      readN(n.id);
      const badge = document.getElementById('notifBadge'); const u = unreadCount();
      if (badge) { badge.textContent = u; badge.hidden = u === 0; }
      if (n.target) {
        if (n.target.view === 'game') Router.open('game', { id: n.target.id });
        else if (n.target.view === 'friends') Router.open('friends');
        else if (n.target.view === 'store') Router.open('store');
        else if (n.target.view === 'settings') Router.open('settings', { tab: n.target.tab || 'system' });
      } else Router.render();
    }));
    root.querySelector('[data-notifall]')?.addEventListener('click', () => {
      NOTIFICATIONS.forEach(n => readN(n.id));
      const badge = document.getElementById('notifBadge');
      if (badge) { badge.textContent = 0; badge.hidden = true; }
      Router.render(); toast('Все уведомления прочитаны', 'check');
    });
  }
  function emptyState() { return `<div class="empty glass">${icon('bell')}<h3>Уведомлений нет</h3><p>Здесь появятся трофеи, загрузки и сообщения от друзей.</p></div>`; }

  /* ================= STORE ================= */
  function priceOf(g) {
    const old = g.price || 0;
    const now = Math.round(old * (1 - (g.discount || 0) / 100));
    return { now: now.toLocaleString('ru-RU') + ' ₽', old: g.discount ? old.toLocaleString('ru-RU') + ' ₽' : '' };
  }
  function storeCard(g) {
    const p = priceOf(g);
    return `<button class="storecard" data-storebuy="${g.id}">
      <span class="art">${g.discount ? `<span class="discount">−${g.discount}%</span>` : ''}${coverArt(g)}</span>
      <b>${g.title}</b><small>${p.old ? `<s style="color:var(--muted-2);margin-right:.3rem">${p.old}</s>` : ''}${p.now}</small>
    </button>`;
  }
  function storeView() {
    const feat = getGame(STORE_FEATURED[0]);
    const p = priceOf(feat);
    const disc = STORE_FEATURED.slice(1).map(getGame).filter(Boolean);
    const body = `<div class="storehero">
        <div class="storehero__art">${coverArt(feat, { hero: true, plain: true })}</div>
        <div class="storehero__shade"></div>
        <div class="storehero__inner">
          <p class="eyebrow">Избранное · скидка ${feat.discount}%</p>
          <h2>${feat.title}</h2>
          <p>${feat.sub} · ${feat.genre}</p>
          <div class="price"><span class="discount">−${feat.discount}%</span><b class="now">${p.now}</b><span class="old">${p.old}</span></div>
          <button class="btn btn--primary btn--sm" style="margin-top:.7rem;align-self:flex-start" data-storebuy="${feat.id}">${icon('store')} Купить</button>
        </div>
      </div>
      <div class="wallet">${icon('shield')}<div><b>0 ₽</b><div style="font-size:.7rem;color:var(--muted)">Кошелёк PS Store</div></div><button class="btn btn--ghost btn--sm" style="margin-left:auto" data-storetopup>Пополнить</button></div>
      <div class="section-title"><span>Скидки недели</span><span class="count-pill">до 55%</span></div>
      <div class="storegrid">${disc.map(storeCard).join('')}</div>
      <div class="section-title"><span>Рекомендуем</span></div>
      <div class="storegrid">${GAMES.filter(g => !STORE_FEATURED.includes(g.id)).slice(0, 6).map(storeCard).join('')}</div>
      <div class="section-title"><span>Медиаприложения</span></div>
      <div class="storegrid">${APPS.slice(0, 6).map(a => `<button class="storecard" data-storeapp="${a.id}"><span class="art" style="aspect-ratio:16/10">${appArt(a)}</span><b>${a.title}</b><small>Бесплатно</small></button>`).join('')}</div>`;
    return shellString({ kicker: 'PlayStation Store', title: 'Магазин', body, wide: false });
  }
  function bindStore(root) {
    root.querySelectorAll('[data-storebuy]').forEach(b => b.addEventListener('click', () => {
      const g = getGame(b.dataset.storebuy); if (!g) return;
      const p = priceOf(g);
      dialog({
        title: `Купить «${g.title}»?`,
        text: `${p.now} · покупка в PlayStation Store. Игра появится в библиотеке.`,
        iconName: 'store',
        actions: [
          { label: 'Подтвердить', cls: 'btn--primary', onClick: () => { state.removed = state.removed.filter(x => x !== g.id); save(); toast(`«${g.title}» добавлена в библиотеку`, 'check'); Home.refresh(); Router.render(); } },
          { label: 'Отмена', cls: 'btn--ghost', onClick: () => {} }
        ]
      });
    }));
    root.querySelector('[data-storetopup]')?.addEventListener('click', () => toast('Пополнение кошелька', 'store'));
    root.querySelectorAll('[data-storeapp]').forEach(b => b.addEventListener('click', () => AppHost.open(b.dataset.storeapp)));
  }

  /* ================= SEARCH ================= */
  function openSearch() {
    const recents = state.ui?.recentSearches || [];
    Layer.open(`<div class="searchpanel">
      <div class="searchpanel__top">
        <span style="color:rgba(255,255,255,.5);width:1.5rem">${icon('search')}</span>
        <input type="search" placeholder="Игры, приложения, друзья…" data-searchinput autocomplete="off">
        <span class="search-hintbar" style="border:0;padding:0"><kbd>Esc</kbd> закрыть</span>
        <button class="iconbtn" data-searchclose aria-label="Закрыть поиск">${icon('x')}</button>
      </div>
      <div class="searchpanel__body">
        ${recents.length ? `<div class="searchpanel__past">${recents.map(r => `<button class="searchchip" data-recent="${esc(r)}">${icon('clock')} ${esc(r)}</button>`).join('')}</div>` : ''}
        <div data-searchresults></div>
      </div>
    </div>`, { cls: 'layer--full', kind: 'search', onMount(el) {
      const input = el.querySelector('[data-searchinput]');
      const out = el.querySelector('[data-searchresults]');
      const initial = () => {
        out.innerHTML = `<div class="section-title"><span>Игры</span></div>
          <div class="results-grid">${GAMES.slice(0, 6).map(g => resultGame(g)).join('')}</div>
          <div class="section-title"><span>Приложения</span></div>
          <div class="results-grid">${APPS.slice(0, 4).map(a => resultApp(a)).join('')}</div>`;
        bindResults(el);
      };
      const search = (q) => {
        const query = q.trim().toLowerCase();
        if (!query) { initial(); return; }
        const gs = GAMES.filter(g => (g.title + ' ' + g.studio + ' ' + g.genre).toLowerCase().includes(query));
        const as = APPS.filter(a => (a.title + ' ' + a.tag).toLowerCase().includes(query));
        if (!gs.length && !as.length) {
          out.innerHTML = `<div class="search-empty">${icon('search')}<h3>Ничего не найдено</h3><p>Попробуйте другое название игры или приложения.</p></div>`;
          return;
        }
        out.innerHTML = `${gs.length ? `<div class="section-title"><span>Игры · ${gs.length}</span></div><div class="results-grid">${gs.map(resultGame).join('')}</div>` : ''}
          ${as.length ? `<div class="section-title"><span>Приложения · ${as.length}</span></div><div class="results-grid">${as.map(resultApp).join('')}</div>` : ''}`;
        bindResults(el);
      };
      input.addEventListener('input', () => search(input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const first = out.querySelector('[data-searchgame], [data-searchapp]');
          if (first) first.click();
        }
      });
      el.querySelector('[data-searchclose]').addEventListener('click', () => Layer.close());
      el.querySelectorAll('[data-recent]').forEach(b => b.addEventListener('click', () => { input.value = b.dataset.recent; search(input.value); input.focus(); }));
      initial();
      setTimeout(() => input.focus(), 80);
    } });
  }
  function resultGame(g) {
    return `<button class="result-card" data-searchgame="${g.id}"><span class="thumb">${coverArt(g)}</span><b>${g.title}</b><small>${g.genre}</small></button>`;
  }
  function resultApp(a) {
    return `<button class="result-card" data-searchapp="${a.id}"><span class="thumb thumb--app">${appArt(a)}</span><b>${a.title}</b><small>${a.tag}</small></button>`;
  }
  function bindResults(el) {
    el.querySelectorAll('[data-searchgame]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.searchgame;
      addRecent(GAMES.find(g => g.id === id)?.title || '');
      Layer.close();
      Router.open('game', { id });
    }));
    el.querySelectorAll('[data-searchapp]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.searchapp;
      addRecent(APP_MAP[id]?.title || '');
      Layer.close();
      AppHost.open(id);
    }));
  }
  function addRecent(text) {
    if (!text) return;
    if (!state.ui) state.ui = {};
    const arr = (state.ui.recentSearches || []).filter(x => x !== text);
    arr.unshift(text);
    state.ui.recentSearches = arr.slice(0, 5);
    save();
  }

  /* ================= APP HOST ================= */
  const APP_COLORS = [
    ['#ff5a5a', '#7c1419'], ['#4a9dff', '#0e2f66'], ['#ffcf4a', '#7a4a08'],
    ['#6fe0b0', '#0f4d3c'], ['#c084ff', '#3a1a66'], ['#ff8a5c', '#662510']
  ];
  const VIDEO_ROWS = [
    { title: 'Продолжить просмотр', items: ['Ночной город', 'Последний рейс', 'Тихий океан', 'Архив 81', 'Северный ветер', 'Дорога домой'] },
    { title: 'Популярно сейчас', items: ['Глубина', 'Красная линия', 'Седьмой этаж', 'Летний лагерь', 'Пыль', 'Хроники неба'] },
    { title: 'Новинки', items: ['Первый свет', 'Без следа', 'Море внутри', 'Точка невозврата', 'Соседи', 'Финал'] }
  ];
  const MUSIC_TRACKS = [
    { n: 'Night Drive', a: 'Stepa_ Mix', d: '3:42' }, { n: 'Neon Rain', a: 'Midnight FM', d: '4:08' },
    { n: 'Afterglow', a: 'Solar Fields', d: '5:11' }, { n: 'Low Orbit', a: 'Kosmos', d: '3:27' },
    { n: 'Frost', a: 'Northern Lights', d: '4:36' }, { n: 'Signal', a: 'Waveform', d: '2:58' }
  ];
  const STREAMS = [
    { t: 'Ранкед до алмаза', c: 'Artem_Pro', g: 'Fortnite', v: '2,4 тыс.' },
    { t: 'Проходим Hogwarts', c: 'LeraFox', g: 'Hogwarts Legacy', v: '860' },
    { t: 'Вечерний кооп', c: 'Ksenia_Star', g: 'Spider-Man 2', v: '1,8 тыс.' },
    { t: 'Турнир FC 25', c: 'Dimka_777', g: 'EA SPORTS FC 25', v: '3,1 тыс.' },
    { t: 'Спидран Astro Bot', c: 'MaxPower', g: 'Astro Bot', v: '640' },
    { t: 'Хоррор-ночь', c: 'Sonya_Moon', g: 'Resident Evil 4', v: '1,2 тыс.' }
  ];

  function appHeader(app) {
    return `<div class="appbar">
      <button class="view__back" data-back>${icon('arrowLeft')} Назад</button>
      <div class="appbar__brand"><span class="appbar__mark">${appArt(app)}</span>${app.title}</div>
      <span class="top-link" data-appact="home">${icon('home')} Главный экран</span>
    </div>`;
  }

  function renderApp(app) {
    let body = '';
    if (app.kind === 'music') body = appMusic(app);
    else if (app.kind === 'stream') body = appStream(app);
    else if (app.kind === 'browser') body = appBrowser(app);
    else if (app.kind === 'media') body = appMedia(app);
    else body = appVideo(app);
    return `${appHeader(app)}<div class="appscroll">${body}</div>`;
  }

  function appVideo(app) {
    const art = appArt(app);
    const rows = VIDEO_ROWS.map((row, ri) => `<h3 class="approw-title">${row.title}</h3>
      <div class="appgrid">${row.items.map((t, i) => {
        const c = APP_COLORS[(ri + i) % APP_COLORS.length];
        return `<button class="appcard" data-appact="play" data-label="${app.title} · ${t}" style="--c1:${c[0]};--c2:${c[1]}"><span class="gl"></span><span class="sub">${i === 0 && ri === 0 ? 'Продолжить' : app.title}</span><span class="t">${t}</span></button>`;
      }).join('')}</div>`).join('');
    return `<div class="nowplaying" style="--c1:${app.c1};--c2:${app.c2}">
        <span class="w"></span>
        <div class="artp">${art}</div>
        <div class="npinfo"><p class="eyebrow">Рекомендуем сегодня</p><h2>${app.title}: вечерний показ</h2>
          <p>${app.desc}</p>
          <div style="display:flex;gap:.4rem;margin-top:.8rem"><button class="btn btn--primary btn--sm" data-appact="play" data-label="${app.title}">${icon('play')} Смотреть</button>
          <button class="btn btn--ghost btn--sm" data-appact="play" data-label="${app.title} · трейлер">${icon('plus')} В список</button></div>
        </div>
      </div>${rows}`;
  }

  function appMusic(app) {
    return `<div class="nowplaying" style="--c1:${app.c1};--c2:${app.c2}">
        <span class="w"></span>
        <div class="artp">${appArt(app)}</div>
        <div class="npinfo"><p class="eyebrow">Сейчас играет</p><h2>Night Drive</h2><p>Stepa_ Mix · 12 треков</p>
          <div class="npbar"><div style="height:.28rem;background:rgba(255,255,255,.25);border-radius:99px;overflow:hidden"><div style="width:38%;height:100%;background:#fff;border-radius:99px"></div></div>
            <div class="tr"><span>1:24</span><span>3:42</span></div></div>
          <div class="npcontrols"><button class="npc" data-appact="prev">${icon('chevronLeft')}</button>
            <button class="npc" style="background:#fff;color:#071021" data-appact="toggle">${icon('play')}</button>
            <button class="npc" data-appact="next">${icon('chevronRight')}</button>
            <button class="npc" data-appact="like" style="margin-left:.2rem">${icon('heart')}</button></div>
        </div>
      </div>
      <h3 class="approw-title">Плейлист</h3>
      ${MUSIC_TRACKS.map((t, i) => `<button class="playlistrow" style="width:100%;text-align:left" data-appact="play" data-label="${t.n} — ${t.a}">
        <span class="hex">${i + 1}</span><span class="pt"><b>${t.n}</b><small>${t.a}</small></span><span class="dur">${t.d}</span>
      </button>`).join('')}`;
  }

  function appStream(app) {
    return `<h3 class="approw-title">Прямые трансляции</h3>
      <div class="appgrid" style="grid-template-columns:repeat(auto-fill,minmax(14rem,1fr))">
        ${STREAMS.map((s, i) => {
          const c = APP_COLORS[i % APP_COLORS.length];
          return `<button class="livecard" data-appact="play" data-label="${s.t}" style="--c1:${c[0]};--c2:${c[1]}">
            <span class="gl"></span><span class="live"><span class="dot dot--live" style="width:.35rem;height:.35rem"></span>LIVE</span>
            <span class="t">${s.t}</span><span class="sub">${s.c} · ${s.v} зрителей</span>
            <div style="height:9rem"></div>
          </button>`;
        }).join('')}
      </div>
      <h3 class="approw-title">Категории</h3>
      <div class="appgrid">${['Экшен', 'Гонки', 'Стратегии', 'Спорт', 'Хорроры', 'Инди'].map((t, i) => {
        const c = APP_COLORS[i % APP_COLORS.length];
        return `<button class="appcard" data-appact="play" data-label="Категория ${t}" style="--c1:${c[0]};--c2:${c[1]}"><span class="gl"></span><span class="t">${t}</span></button>`;
      }).join('')}</div>`;
  }

  function appBrowser(app) {
    return `<div class="browserrm">
      <div class="browserrm__bar"><span class="browserrm__btns"><i></i><i></i><i></i></span><span class="browserrm__addr">ps5.local/home</span>${icon('more')}</div>
      <div class="browserrm__body">
        <p class="eyebrow">PS5 Browser</p>
        <h2>Добро пожаловать в сеть</h2>
        <p>Это встроенный браузер PS5 OS. Вкладки, закладки и история работают локально. Введите адрес — он откроется в этой же панели.</p>
        <div style="display:flex;gap:.6rem;margin:1.4rem 0;max-width:34rem"><input class="textinput" style="max-width:none;flex:1" data-browserurl placeholder="Введите адрес"><button class="btn btn--primary btn--sm" data-appact="go">Перейти</button></div>
        <div class="appgrid" style="margin-top:1.6rem">
          ${['PlayStation Blog', 'Магазин', 'Сообщество', 'Новости', 'Помощь', 'Настройки сети'].map((t, i) => {
            const c = APP_COLORS[i % APP_COLORS.length];
            return `<button class="appcard" data-appact="play" data-label="${t}" style="--c1:${c[0]};--c2:${c[1]}"><span class="gl"></span><span class="t">${t}</span></button>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }

  function appMedia(app) {
    return `<h3 class="approw-title">Воспроизведение</h3>
      <div class="nowplaying" style="--c1:${app.c1};--c2:${app.c2};align-items:center">
        <span class="w"></span><div class="artp">${appArt(app)}</div>
        <div class="npinfo"><p class="eyebrow">USB · Медиа</p><h2>${app.title}</h2><p>${app.desc}</p>
        <div style="display:flex;gap:.5rem;margin-top:.8rem"><button class="btn btn--primary btn--sm" data-appact="play" data-label="Медиа">${icon('play')} Воспроизвести</button>
        <button class="btn btn--ghost btn--sm" data-appact="play" data-label="Папка">${icon('folder')} Открыть папку</button></div></div>
      </div>
      <h3 class="approw-title">Файлы и папки</h3>
      ${['Видео', 'Музыка', 'Фотографии', 'Загрузки', 'PS5 · Скриншоты'].map((t, i) => `<button class="playlistrow" style="width:100%;text-align:left" data-appact="play" data-label="${t}">
        <span class="hex" style="background:rgba(255,255,255,.08)">${icon('folder')}</span><span class="pt"><b>${t}</b><small>${i === 4 ? '24 элемента' : 'Папка USB'}</small></span>${icon('chevronRight')}</button>`).join('')}`;
  }

  function mountApp(app) {
    const root = document.getElementById('appHost');
    root.querySelectorAll('[data-appact]').forEach(b => b.addEventListener('click', () => {
      const act = b.dataset.appact;
      if (act === 'home') { AppHost.close(); return; }
      if (act === 'go') {
        const input = root.querySelector('[data-browserurl]');
        const v = input?.value.trim();
        if (v) toast(`Открывается ${v}…`, 'browser');
        else toast('Введите адрес', 'info');
        return;
      }
      const label = b.dataset.label || app.title;
      toast(`«${label}» · Воспроизведение`, 'play');
    }));
  }

  /* ================= EXPORT ================= */
  window.Views = {
    render(name, params = {}) {
      if (name === 'library') {
        return shellString({ kicker: 'PS5 · Игры', title: 'Библиотека', body: libraryContent(), wide: true, actions: `<button class="view__back" data-view="store">${icon('store')} Магазин</button>` });
      }
      if (name === 'folder') {
        const f = folderContent(params);
        return shellString({ kicker: 'Библиотека', title: f.title, body: f.body, wide: true });
      }
      if (name === 'game') return gamePageView(params);
      if (name === 'apps') return appsView();
      if (name === 'settings') return settingsView(params);
      if (name === 'profile') return profileView();
      if (name === 'friends') return friendsView();
      if (name === 'notifications') return notificationsView();
      if (name === 'store') return storeView();
      return `<div class="view__bg"></div>${viewHead('PS5', 'Раздел недоступен')}<div class="view__scroll"><div class="view__inner"><div class="empty glass">${icon('info')}<h3>Раздел временно недоступен</h3></div></div></div>`;
    },
    mount(name, params = {}) {
      const root = document.getElementById('viewRoot');
      if (name === 'library') bindLibrary(root);
      else if (name === 'folder') bindFolder(root, params);
      else if (name === 'game') bindGamePage(root, params);
      else if (name === 'apps') bindApps(root);
      else if (name === 'settings') bindSettings(root, params);
      else if (name === 'profile') bindProfile(root);
      else if (name === 'friends') bindFriends(root);
      else if (name === 'notifications') bindNotifications(root);
      else if (name === 'store') bindStore(root);
    },
    renderApp,
    mountApp,
    openSearch
  };
})();