(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function head(kicker, title, actions = '') {
    return `<header class="view__bar"><button class="view__back" data-back>${icon('arrowLeft')} Назад</button><div class="view__titles">${kicker ? `<p class="eyebrow">${kicker}</p>` : ''}<h1>${title}</h1></div>${actions ? `<div class="view__actions">${actions}</div>` : ''}</header>`;
  }
  function shell(o) {
    return `<div class="view__bg"></div>${head(o.k, o.t, o.a || '')}<div class="view__scroll"><div class="view__inner ${o.wide ? 'wide' : ''}">${o.body}</div></div>`;
  }
  function rub(n) { return formatRub(n); }
  function statusOf(u) { return FRIEND_STATUS[u.status] || FRIEND_STATUS.online; }

  const THEMES = [
    { id: 'blue', name: 'Blue', c1: '#2f7df6', c2: '#071a3a' },
    { id: 'crimson', name: 'Crimson', c1: '#e5484d', c2: '#2a0509' },
    { id: 'emerald', name: 'Emerald', c1: '#2fd48b', c2: '#031d14' },
    { id: 'violet', name: 'Violet', c1: '#9a6bff', c2: '#160a32' }
  ];

  /* ================= PROFILE ================= */
  function profile2() {
    const u = state.user;
    const st = statusOf(u);
    const owned = state.gameOrder.map(getGame).filter(Boolean);
    const plays = owned.slice(0, 4);
    const online = state.friends.filter(f => f.status === 'online');
    const hours = owned.reduce((a, g) => a + (parseInt(g.playtime) || 0), 0);
    const body = `<div class="profile2 profile2--${u.theme || 'blue'}">
      <div class="profile2__banner"></div>
      <div class="profile2__wrap">
        <div class="profile2__head glass">
          ${avatarHTML(u, 'avatar avatar--xl')}
          <div class="profile2__id">
            <p class="eyebrow">PlayStation Network</p>
            <h1>${esc(u.name)}</h1>
            <div class="pstatus pstatus--${u.status}"><i></i>${st.label}</div>
            <div class="levbar"><i style="width:${TROPHIES.progress}%"></i></div>
            <small>Уровень ${u.level} · ${TROPHIES.progress}% до следующего уровня</small>
          </div>
          <div class="profile2__actions">
            <button class="btn btn--primary btn--sm" data-avatar-open>${icon('camera')} Сменить аватар</button>
            <button class="btn btn--ghost btn--sm" data-name-open>${icon('edit')} Изменить имя</button>
            <button class="btn btn--ghost btn--sm" data-theme-open>${icon('sparkles')} Оформление</button>
          </div>
          <div class="profile2__wallet">${icon('store')}<div><b>${rub(state.balance)}</b><small>Кошелёк PS Store</small></div></div>
        </div>
        <div class="statgrid">
          <div class="statcard glass"><b>${TROPHIES.platinum}</b><span>Платина</span></div>
          <div class="statcard glass"><b>${TROPHIES.gold}</b><span>Золото</span></div>
          <div class="statcard glass"><b>${TROPHIES.silver}</b><span>Серебро</span></div>
          <div class="statcard glass"><b>${TROPHIES.bronze}</b><span>Бронза</span></div>
          <div class="statcard glass"><b>${owned.length}</b><span>Игр в библиотеке</span></div>
          <div class="statcard glass"><b>${hours} ч</b><span>В играх</span></div>
        </div>
        <div class="profile__cols">
          <div class="gpcard"><h3>${icon('clock')} Недавно играли</h3>
            ${plays.length ? plays.map(g => `<div class="playsmall"><span class="thumb">${coverArt(g)}</span><div class="txt"><b>${esc(g.title)}</b><small>${esc(g.lastPlayed || 'Недавно')}</small><div class="pb" style="margin-top:.3rem"><i style="width:${g.progress || 0}%"></i></div></div><button class="btn btn--ghost btn--sm" data-pgame="${g.id}">Открыть</button></div>`).join('') : '<p class="muted">Пока нет игр</p>'}
          </div>
          <div class="gpside">
            <div class="gpcard"><h3>${icon('users')} Друзья</h3>
              ${online.length ? online.slice(0, 4).map(f => `<div class="playsmall">${avatarHTML(f, 'avatar avatar--sm')}<div class="txt"><b>${esc(f.name)}</b><small>${esc(f.game || f.statusText)}</small></div><span class="dot dot--live"></span></div>`).join('') : '<p class="muted">Нет друзей в сети</p>'}
            </div>
            <div class="gpcard"><h3>${icon('trophy')} Трофеи</h3>
              <div class="trophy-stats">${[['platinum', 'Платина', TROPHIES.platinum], ['gold', 'Золото', TROPHIES.gold], ['silver', 'Серебро', TROPHIES.silver], ['bronze', 'Бронза', TROPHIES.bronze]].map(([c, l, n]) => `<div class="ts ts--${c}"><b>${n}</b><span>${l}</span></div>`).join('')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
    return shell({ k: 'Профиль', t: esc(u.name), body, wide: true });
  }

  function openAvatarPicker() {
    const cats = [['all', 'Все'], ['fantasy', 'Фэнтези'], ['anime', 'Аниме'], ['game', 'Игры'], ['animals', 'Животные'], ['abstract', 'Абстракция'], ['minimal', 'Минимализм'], ['art', 'Арт']];
    Layer.open(`<div class="ap">
      <div class="ap__head"><div><p class="eyebrow">Профиль</p><h2>Коллекция аватаров</h2><p>${AVATARS.length} образов для вашего профиля и друзей.</p></div><button class="iconbtn" data-apclose>${icon('x')}</button></div>
      <div class="ap__cats">${cats.map(([id, label], i) => `<button class="segchip ${i === 0 ? 'is-on' : ''}" data-apcat="${id}">${label}</button>`).join('')}</div>
      <div class="ap__grid" data-apgrid></div>
    </div>`, { cls: 'layer--center layer--wide', onMount(el) {
      let cat = 'all';
      const grid = el.querySelector('[data-apgrid]');
      const render = () => {
        const list = AVATARS.filter(a => cat === 'all' || a.cat === cat);
        grid.innerHTML = list.map(a => `<button class="ap__item ${state.user.avatar === a.src ? 'is-on' : ''}" data-avatar-src="${a.src}"><span class="ap__img"><img src="${assetUrl(a.src)}" alt=""></span><b>${esc(a.name)}</b><small>${a.cat}</small></button>`).join('');
      };
      el.querySelectorAll('[data-apcat]').forEach(b => b.addEventListener('click', () => {
        cat = b.dataset.apcat;
        el.querySelectorAll('[data-apcat]').forEach(x => x.classList.toggle('is-on', x === b));
        render();
      }));
      grid.addEventListener('click', (e) => {
        const b = e.target.closest('[data-avatar-src]'); if (!b) return;
        state.user.avatar = b.dataset.avatarSrc;
        SESSION.avatar = state.user.avatar;
        save(); Home.refresh();
        if (Router.stack.some(x => x.name === 'profile')) Router.render();
        Layer.close();
        toast('Аватар обновлён', 'check');
      });
      el.querySelector('[data-apclose]').addEventListener('click', () => Layer.close());
      render();
      paintIcons(el);
    } });
  }

  function openNameEditor() {
    Layer.open(`<div class="dialog"><div class="dialog__icon">${icon('edit')}</div><h3>Имя в сети</h3><p>Так вас увидят друзья в PlayStation Network.</p>
      <input class="textinput" style="width:100%;max-width:none;margin-top:.7rem" data-newname value="${esc(state.user.name)}" maxlength="16">
      <div class="dialog__actions"><button class="btn btn--primary" data-nsave>Сохранить</button><button class="btn btn--ghost" data-nclose>Отмена</button></div></div>`, { cls: 'layer--center', onMount(el) {
      const inp = el.querySelector('[data-newname]'); inp.focus(); inp.select();
      el.querySelector('[data-nsave]').addEventListener('click', () => {
        const v = inp.value.trim().slice(0, 16);
        if (v.length < 2) { toast('Слишком короткое имя', 'info'); return; }
        state.user.name = v; state.settings.name = v; SESSION.name = v; save();
        Home.refresh(); Router.render(); Layer.close(); toast('Имя обновлено', 'check');
      });
      el.querySelector('[data-nclose]').addEventListener('click', () => Layer.close());
    } });
  }

  function openThemePicker() {
    Layer.open(`<div class="dialog dialog--wide"><div class="dialog__icon">${icon('sparkles')}</div><h3>Оформление профиля</h3><p>Выберите акцент баннера и подсветки.</p>
      <div class="theme-grid">${THEMES.map(t => `<button class="theme-option ${state.user.theme === t.id ? 'is-on' : ''}" data-theme="${t.id}" style="--c1:${t.c1};--c2:${t.c2}"><span></span><b>${t.name}</b></button>`).join('')}</div>
      <div class="dialog__actions"><button class="btn btn--ghost" data-tclose>Закрыть</button></div></div>`, { cls: 'layer--center', onMount(el) {
      el.querySelectorAll('[data-theme]').forEach(b => b.addEventListener('click', () => {
        state.user.theme = b.dataset.theme; save(); Router.render(); Layer.close(); toast('Оформление обновлено', 'check');
      }));
      el.querySelector('[data-tclose]').addEventListener('click', () => Layer.close());
    } });
  }

  function bindProfile2(root) {
    root.querySelector('[data-avatar-open]')?.addEventListener('click', openAvatarPicker);
    root.querySelector('[data-name-open]')?.addEventListener('click', openNameEditor);
    root.querySelector('[data-theme-open]')?.addEventListener('click', openThemePicker);
    root.querySelectorAll('[data-pgame]').forEach(b => b.addEventListener('click', () => Router.open('game', { id: b.dataset.pgame })));
  }

  /* ================= FRIENDS ================= */
  function friendRows(list) {
    if (!list.length) return `<div class="empty glass">${icon('users')}<h3>Друзей не найдено</h3><p>Измените фильтр или добавьте нового друга.</p></div>`;
    return `<div class="friendlist">${list.map(f => {
      const st = statusOf(f);
      const fav = state.friendFavs.includes(f.id);
      return `<div class="frow ${fav ? 'is-fav' : ''}" data-frow="${f.id}">
        ${avatarHTML(f, 'avatar')}
        <div class="frow__id"><b>${esc(f.name)}</b><small>${esc(f.activity || st.label)}</small></div>
        <span class="fstatus fstatus--${f.status}"><i></i>${st.label}</span>
        <span class="flev">${icon('trophy')} ${f.trophies}</span>
        <div class="frow__acts">
          <button class="iconbtn iconbtn--sm" data-fchat="${f.id}" title="Написать">${icon('message')}</button>
          <button class="iconbtn iconbtn--sm" data-finvite="${f.id}" title="Пригласить в игру">${icon('controller')}</button>
          <button class="iconbtn iconbtn--sm ${fav ? 'is-on' : ''}" data-ffav="${f.id}" title="В избранное">${icon('heart')}</button>
          <button class="iconbtn iconbtn--sm" data-fopen="${f.id}" title="Профиль">${icon('chevronRight')}</button>
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  function friends2() {
    const online = state.friends.filter(f => f.status === 'online').length;
    const body = `<div class="friends2">
      <div class="fbar">
        <div class="fsearch">${icon('search')}<input data-fsearch placeholder="Поиск друзей…" autocomplete="off"></div>
        <div class="ftabs">
          <button class="segchip is-on" data-ftab="all">Все · ${state.friends.length}</button>
          <button class="segchip" data-ftab="online">В сети · ${online}</button>
          <button class="segchip" data-ftab="fav">Избранные · ${state.friendFavs.length}</button>
        </div>
        <button class="btn btn--primary btn--sm" data-fadd>${icon('plus')} Добавить друга</button>
      </div>
      <div data-flist>${friendRows(state.friends)}</div>
    </div>`;
    return shell({ k: 'Сообщество', t: 'Друзья', a: `<span class="count-pill">${online} в сети</span>`, body, wide: true });
  }

  function bindFriends2(root) {
    let filter = 'all', query = '';
    const listEl = root.querySelector('[data-flist]');
    const render = () => {
      let arr = state.friends.slice();
      if (filter === 'online') arr = arr.filter(f => f.status === 'online');
      if (filter === 'fav') arr = arr.filter(f => state.friendFavs.includes(f.id));
      if (query) {
        const q = query.toLowerCase();
        arr = arr.filter(f => (f.name + ' ' + f.game + ' ' + f.activity).toLowerCase().includes(q));
      }
      listEl.innerHTML = friendRows(arr);
      bindRows();
    };
    const bindRows = () => {
      listEl.querySelectorAll('[data-frow]').forEach(row => row.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        openFriendProfile(row.dataset.frow);
      }));
      listEl.querySelectorAll('[data-fchat]').forEach(b => b.addEventListener('click', () => {
        const f = getFriend(b.dataset.fchat); if (f) openChat2(f);
      }));
      listEl.querySelectorAll('[data-finvite]').forEach(b => b.addEventListener('click', () => {
        const f = getFriend(b.dataset.finvite); if (!f) return;
        toast(`Приглашение отправлено · ${f.name}`, 'controller');
      }));
      listEl.querySelectorAll('[data-ffav]').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.ffav;
        state.friendFavs = state.friendFavs.includes(id) ? state.friendFavs.filter(x => x !== id) : [...state.friendFavs, id];
        save(); render();
      }));
      listEl.querySelectorAll('[data-fopen]').forEach(b => b.addEventListener('click', () => openFriendProfile(b.dataset.fopen)));
    };
    root.querySelector('[data-fsearch]').addEventListener('input', (e) => { query = e.target.value.trim(); render(); });
    root.querySelectorAll('[data-ftab]').forEach(b => b.addEventListener('click', () => {
      filter = b.dataset.ftab;
      root.querySelectorAll('[data-ftab]').forEach(x => x.classList.toggle('is-on', x === b));
      render();
    }));
    root.querySelector('[data-fadd]')?.addEventListener('click', addFriendDialog);
    render();
  }

  function openFriendProfile(id) {
    const f = getFriend(id); if (!f) return;
    const st = statusOf(f);
    const fav = state.friendFavs.includes(id);
    Layer.open(`<div class="friendprofile">
      <button class="iconbtn friendprofile__close" data-fpclose>${icon('x')}</button>
      <div class="friendprofile__banner" style="--c1:${st.color}"></div>
      <div class="friendprofile__head">${avatarHTML(f, 'avatar avatar--xl')}<div><p class="eyebrow">Профиль PlayStation Network</p><h2>${esc(f.name)}</h2><div class="pstatus pstatus--${f.status}"><i></i>${st.label}</div></div></div>
      <div class="friendprofile__stats">
        <div><b>${f.level}</b><span>Уровень</span></div>
        <div><b>${f.trophies}</b><span>Трофеи</span></div>
        <div><b>${f.status === 'online' ? 'Да' : 'Нет'}</b><span>В сети</span></div>
      </div>
      <p class="friendprofile__act">${esc(f.activity || st.label)}</p>
      <div class="friendprofile__actions">
        <button class="btn btn--primary btn--sm" data-fpchat>${icon('message')} Написать</button>
        <button class="btn btn--ghost btn--sm" data-fpinvite>${icon('controller')} Пригласить</button>
        <button class="btn btn--ghost btn--sm ${fav ? 'is-on' : ''}" data-fpfav>${icon('heart')} ${fav ? 'В избранном' : 'В избранное'}</button>
        <button class="btn btn--danger btn--sm" data-fpremove>${icon('trash')} Удалить</button>
      </div>
    </div>`, { cls: 'layer--center', onMount(el) {
      el.querySelector('[data-fpclose]').addEventListener('click', () => Layer.close());
      el.querySelector('[data-fpchat]').addEventListener('click', () => { Layer.close(); openChat2(f); });
      el.querySelector('[data-fpinvite]').addEventListener('click', () => toast(`Приглашение отправлено · ${f.name}`, 'controller'));
      el.querySelector('[data-fpfav]').addEventListener('click', () => {
        state.friendFavs = state.friendFavs.includes(id) ? state.friendFavs.filter(x => x !== id) : [...state.friendFavs, id];
        save(); Layer.close(); Router.render(); toast('Избранное обновлено', 'heart');
      });
      el.querySelector('[data-fpremove]').addEventListener('click', () => {
        Layer.open(`<div class="dialog dialog--danger"><div class="dialog__icon">${icon('trash')}</div><h3>Удалить ${esc(f.name)}?</h3><p>Друг исчезнет из списка. Добавить его снова можно через поиск друзей.</p><div class="dialog__actions"><button class="btn btn--danger" data-fdelok>Удалить</button><button class="btn btn--ghost" data-fdelno>Отмена</button></div></div>`, { cls: 'layer--center', onMount(el2) {
          el2.querySelector('[data-fdelok]').addEventListener('click', () => {
            state.friends = state.friends.filter(x => x.id !== id);
            save(); Layer.close(); Router.render(); toast('Друг удалён', 'trash');
          });
          el2.querySelector('[data-fdelno]').addEventListener('click', () => Layer.close());
        } });
      });
    } });
  }

  function addFriendDialog() {
    const candidates = FRIENDS_DATA.filter(f => f.candidate && !state.friends.some(x => x.id === f.id));
    Layer.open(`<div class="friendadd">
      <div class="ap__head"><div><p class="eyebrow">Сообщество</p><h2>Добавить друга</h2><p>Найдите игроков и отправьте запрос.</p></div><button class="iconbtn" data-faclose>${icon('x')}</button></div>
      ${candidates.length ? `<div class="friendlist">${candidates.map(f => `<div class="frow"><span>${avatarHTML(f, 'avatar')}</span><div class="frow__id"><b>${esc(f.name)}</b><small>Уровень ${f.level} · ${esc(f.activity)}</small></div><span class="fstatus fstatus--${f.status}"><i></i>${statusOf(f).label}</span><button class="btn btn--primary btn--sm" data-faddid="${f.id}">${icon('plus')} Добавить</button></div>`).join('')}</div>` : `<div class="empty glass">${icon('users')}<h3>Все кандидаты уже в друзьях</h3><p>Можно создать нового игрока.</p><button class="btn btn--primary btn--sm" data-fcreate>${icon('plus')} Создать игрока</button></div>`}
    </div>`, { cls: 'layer--center layer--wide', onMount(el) {
      el.querySelector('[data-faclose]').addEventListener('click', () => Layer.close());
      el.querySelectorAll('[data-faddid]').forEach(b => b.addEventListener('click', () => {
        const f = FRIENDS_DATA.find(x => x.id === b.dataset.faddid);
        if (!f) return;
        state.friends.push({ ...f, candidate: false });
        save(); Layer.close(); Router.render(); toast(`${f.name} добавлен в друзья`, 'users');
      }));
      el.querySelector('[data-fcreate]')?.addEventListener('click', () => {
        const n = state.friends.length + 1;
        const av = AVATARS[(n * 7) % AVATARS.length].src;
        state.friends.push({ id: 'player' + Date.now(), name: 'Player_' + n, level: 12 + (n % 20), status: 'online', statusText: 'В сети', activity: 'Недавно в PlayStation Network', game: '', trophies: 10 + n, avatar: av });
        save(); Layer.close(); Router.render(); toast('Новый друг добавлен', 'check');
      });
    } });
  }

  function openChat2(friend) {
    const st = statusOf(friend);
    if (!state.chats[friend.id]) state.chats[friend.id] = [];
    const msgs = state.chats[friend.id];
    if (!msgs.length) msgs.push({ t: 'Привет! Го в игру вечером?', me: false });
    Layer.open(`<div class="chat">
      <div class="chat__head">${avatarHTML(friend, 'avatar avatar--sm')}<div><b>${esc(friend.name)}</b><div style="font-size:.7rem;color:var(--muted)">${st.label}</div></div><button class="iconbtn" data-chtclose style="margin-left:auto">${icon('x')}</button></div>
      <div class="chat__msgs" data-chatmsgs></div>
      <div class="chat__in"><input placeholder="Сообщение…" data-chatinput maxlength="200"><button class="btn btn--primary btn--sm" data-chatsend>${icon('arrowRight')}</button></div>
    </div>`, { cls: 'layer--center', onMount(el) {
      const box = el.querySelector('[data-chatmsgs]');
      const input = el.querySelector('[data-chatinput]');
      const persist = () => save();
      const render = () => { box.innerHTML = msgs.map(m => `<div class="msg ${m.me ? 'msg--me' : 'msg--them'}">${esc(m.t)}</div>`).join(''); box.scrollTop = box.scrollHeight; };
      render();
      const send = () => {
        const v = input.value.trim(); if (!v) return;
        msgs.push({ t: v, me: true }); persist(); input.value = ''; render();
        setTimeout(() => { msgs.push({ t: 'Принято! Скоро отвечу.', me: false }); persist(); render(); }, 1200);
      };
      el.querySelector('[data-chatsend]').addEventListener('click', send);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
      el.querySelector('[data-chtclose]').addEventListener('click', () => Layer.close());
      input.focus();
    } });
  }

  /* ================= MEDIA ================= */
  function mediaCard(a, compact = false) {
    const fav = state.favApps.includes(a.id);
    return `<div class="media-card2 ${compact ? 'is-compact' : ''}" data-mediaopen="${a.id}" style="--c1:${a.c1};--c2:${a.c2}">
      <span class="media-card2__art"><img src="${assetUrl(a.logo)}" alt="${esc(a.title)}"></span>
      <div class="media-card2__body"><b>${esc(a.title)}</b><small>${esc(a.tag)}</small><p>${esc(a.desc)}</p></div>
      <button class="media-card2__fav ${fav ? 'is-on' : ''}" data-mediafav="${a.id}" title="В избранное">${icon('heart')}</button>
      <span class="media-card2__open">${icon('play')}</span>
    </div>`;
  }

  function mediaSection(title, list) {
    if (!list.length) return '';
    return `<div class="section-title"><span>${title}</span><span class="count-pill">${list.length}</span></div><div class="media-row">${list.map(a => mediaCard(a, true)).join('')}</div>`;
  }

  function mediaHub() {
    const hero = MEDIA_APPS.find(a => a.featured) || MEDIA_APPS[0];
    const recent = state.recentApps.map(getApp).filter(Boolean);
    const favs = state.favApps.map(getApp).filter(Boolean);
    const body = `<div class="mediahub">
      <div class="mediahero" style="--c1:${hero.c1};--c2:${hero.c2}">
        <div class="mediahero__glow"></div>
        <div class="mediahero__logo"><img src="${assetUrl(hero.logo)}" alt="${esc(hero.title)}"></div>
        <div class="mediahero__info"><p class="eyebrow">Медиа на PlayStation 5</p><h2>${esc(hero.title)}</h2><p>${esc(hero.desc)}</p><button class="btn btn--primary btn--sm" data-mediaopen="${hero.id}">${icon('play')} Открыть</button></div>
      </div>
      ${mediaSection('Недавно открытые', recent)}
      ${mediaSection('Избранное', favs)}
      ${mediaSection('Видео', MEDIA_APPS.filter(a => a.cat === 'video'))}
      ${mediaSection('Музыка', MEDIA_APPS.filter(a => a.cat === 'music'))}
      ${mediaSection('Галерея', MEDIA_APPS.filter(a => a.cat === 'gallery'))}
      ${mediaSection('Медиатека', MEDIA_APPS.filter(a => a.cat === 'media'))}
      <div class="section-title"><span>Все приложения</span><span class="count-pill">${MEDIA_APPS.length}</span></div>
      <div class="media-grid">${MEDIA_APPS.map(a => mediaCard(a)).join('')}</div>
    </div>`;
    return shell({ k: 'PS5 · Медиа', t: 'Медиа', body, wide: true });
  }

  function bindMediaHub(root) {
    root.querySelectorAll('[data-mediaopen]').forEach(card => card.addEventListener('click', (e) => {
      if (e.target.closest('[data-mediafav]')) return;
      AppHost.open(card.dataset.mediaopen);
    }));
    root.querySelectorAll('[data-mediafav]').forEach(b => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = b.dataset.mediafav;
      state.favApps = state.favApps.includes(id) ? state.favApps.filter(x => x !== id) : [...state.favApps, id];
      save(); Router.render(); Home.refresh();
    }));
  }

  /* ================= APP SCREENS ================= */
  function appHeader2(app) {
    return `<div class="appbar"><button class="view__back" data-appact="home">${icon('arrowLeft')} Назад</button><div class="appbar__brand"><span class="appbar__logo"><img src="${assetUrl(app.logo)}" alt="${esc(app.title)}"></span>${esc(app.title)}</div><span class="top-link" data-appact="home">${icon('home')} Главный экран</span></div>`;
  }

  function appScreen2(app) {
    if (app.screen === 'music') return appMusic2(app);
    if (app.screen === 'stream') return appStream2(app);
    if (app.screen === 'streaming') return appStreaming2(app);
    if (app.screen === 'gallery') return appGallery2(app);
    if (app.screen === 'plex' || app.screen === 'psmedia') return appPlex2(app);
    return appVideo2(app);
  }

  function renderApp2(app) {
    return `${appHeader2(app)}<div class="appscroll">${appScreen2(app)}</div>`;
  }

  function appHero(app, eyebrow, title, sub, extra = '') {
    return `<div class="nowplaying" style="--c1:${app.c1};--c2:${app.c2}">
      <span class="w"></span><div class="artp"><img class="apphero-logo" src="${assetUrl(app.logo)}" alt=""></div>
      <div class="npinfo"><p class="eyebrow">${eyebrow}</p><h2>${esc(title)}</h2><p>${esc(sub)}</p>${extra}</div>
    </div>`;
  }

  function appVideo2(app) {
    const rows = (app.rows || []).map((row, ri) => `<h3 class="approw-title">${esc(row.title)}</h3><div class="appgrid">${row.items.map((t, i) => `<button class="appcard" data-appact="play" data-label="${esc(t)}" style="--c1:${app.c1};--c2:${app.c2}"><span class="gl"></span><span class="sub">${ri === 0 && i === 0 ? 'Продолжить' : app.title}</span><span class="t">${esc(t)}</span></button>`).join('')}</div>`).join('');
    return `${appHero(app, 'Рекомендуем сегодня', app.title + ': вечерний показ', app.desc, `<div style="display:flex;gap:.4rem;margin-top:.8rem"><button class="btn btn--primary btn--sm" data-appact="play" data-label="${esc(app.title)}">${icon('play')} Смотреть</button><button class="btn btn--ghost btn--sm" data-appact="play" data-label="Мой список">${icon('plus')} В список</button></div>`)}${rows}`;
  }

  function appMusic2(app) {
    const t0 = (app.tracks || [])[0] || { n: 'Night Drive', a: 'Stepa_ Mix', d: '3:42' };
    return `${appHero(app, 'Сейчас играет', t0.n, t0.a + ' · плейлист PS5', `<div class="npbar"><div style="height:.28rem;background:rgba(255,255,255,.25);border-radius:99px;overflow:hidden"><div style="width:38%;height:100%;background:#fff;border-radius:99px"></div></div><div class="tr"><span>1:24</span><span>${t0.d}</span></div></div><div class="npcontrols"><button class="npc" data-appact="prev">${icon('chevronLeft')}</button><button class="npc" style="background:#fff;color:#071021" data-appact="play" data-label="${esc(t0.n)}">${icon('play')}</button><button class="npc" data-appact="next">${icon('chevronRight')}</button><button class="npc" data-appact="like">${icon('heart')}</button></div>`)}
      <h3 class="approw-title">Плейлист</h3>${(app.tracks || []).map((t, i) => `<button class="playlistrow" style="width:100%;text-align:left" data-appact="play" data-label="${esc(t.n)} — ${esc(t.a)}"><span class="hex">${i + 1}</span><span class="pt"><b>${esc(t.n)}</b><small>${esc(t.a)}</small></span><span class="dur">${t.d}</span></button>`).join('')}`;
  }

  function appStream2(app) {
    return `<h3 class="approw-title">Прямые трансляции</h3><div class="appgrid" style="grid-template-columns:repeat(auto-fill,minmax(14rem,1fr))">${(app.streams || []).map((s, i) => `<button class="livecard" data-appact="play" data-label="${esc(s.t)}" style="--c1:${app.c1};--c2:${app.c2}"><span class="gl"></span><span class="live"><span class="dot dot--live" style="width:.35rem;height:.35rem"></span>LIVE</span><span class="t">${esc(s.t)}</span><span class="sub">${esc(s.c)} · ${esc(s.v)} зрителей</span><div style="height:9rem"></div></button>`).join('')}</div>
      <h3 class="approw-title">Категории</h3><div class="appgrid">${['Экшен', 'Гонки', 'Стратегии', 'Спорт', 'Хорроры', 'Инди'].map(t => `<button class="appcard" data-appact="play" data-label="Категория ${t}" style="--c1:${app.c1};--c2:${app.c2}"><span class="gl"></span><span class="t">${t}</span></button>`).join('')}</div>`;
  }

  function appStreaming2(app) {
    const rows = (app.rows || []).map(row => `<h3 class="approw-title">${esc(row.title)}</h3><div class="appgrid">${row.items.map((t, i) => `<button class="appcard" data-appact="play" data-label="${esc(t)}" style="--c1:${app.c1};--c2:${app.c2}"><span class="gl"></span><span class="sub">${app.title}</span><span class="t">${esc(t)}</span></button>`).join('')}</div>`).join('');
    return `${appHero(app, 'Оригиналы и новинки', app.title, app.desc, `<div style="display:flex;gap:.4rem;margin-top:.8rem"><button class="btn btn--primary btn--sm" data-appact="play" data-label="${esc(app.title)}">${icon('play')} Смотреть</button></div>`)}${rows}`;
  }

  function appGallery2(app) {
    const shots = GAMES.slice(0, 9).map((g, i) => ({ id: g.id, title: g.title, src: i % 2 ? (g.hero || g.cover) : g.cover }));
    const avs = AVATARS.slice(0, 8);
    return `${appHero(app, 'Медиа PS5', 'Галерея', 'Скриншоты, обложки и аватары в одном месте.')}
      <h3 class="approw-title">Скриншоты и обложки</h3><div class="gallerygrid">${shots.map(s => `<button class="gallerytile" data-appact="play" data-label="${esc(s.title)}"><img src="${assetUrl(s.src)}" alt=""><span>${esc(s.title)}</span></button>`).join('')}</div>
      <h3 class="approw-title">Аватары</h3><div class="gallerygrid gallerygrid--av">${avs.map(a => `<button class="gallerytile gallerytile--av" data-appact="play" data-label="${esc(a.name)}"><img src="${assetUrl(a.src)}" alt=""></button>`).join('')}</div>`;
  }

  function appPlex2(app) {
    const rows = (app.rows || []).map(row => `<h3 class="approw-title">${esc(row.title)}</h3><div class="appgrid">${row.items.map(t => `<button class="appcard" data-appact="play" data-label="${esc(t)}" style="--c1:${app.c1};--c2:${app.c2}"><span class="gl"></span><span class="t">${esc(t)}</span></button>`).join('')}</div>`).join('');
    return `${appHero(app, 'Домашняя медиатека', app.title, app.desc, `<div style="display:flex;gap:.5rem;margin-top:.8rem"><button class="btn btn--primary btn--sm" data-appact="play" data-label="Медиа">${icon('play')} Воспроизвести</button><button class="btn btn--ghost btn--sm" data-appact="play" data-label="Папка">${icon('folder')} Открыть папку</button></div>`)}${rows}
      <h3 class="approw-title">Файлы и папки</h3>${['Видео', 'Музыка', 'Фотографии', 'Загрузки', 'PS5 · Скриншоты'].map((t, i) => `<button class="playlistrow" style="width:100%;text-align:left" data-appact="play" data-label="${t}"><span class="hex" style="background:rgba(255,255,255,.08)">${icon('folder')}</span><span class="pt"><b>${t}</b><small>${i === 4 ? '24 элемента' : 'Папка USB'}</small></span>${icon('chevronRight')}</button>`).join('')}`;
  }

  function openPlayer(app, label) {
    Layer.open(`<div class="app-player" style="--c1:${app.c1};--c2:${app.c2}">
      <div class="app-player__head"><span class="app-player__logo"><img src="${assetUrl(app.logo)}" alt=""></span><b>${esc(app.title)}</b><button class="iconbtn" data-pclose>${icon('x')}</button></div>
      <div class="app-player__stage"><span class="app-player__pulse"></span>${icon('play')}</div>
      <div class="app-player__meta"><p class="eyebrow">Сейчас воспроизводится</p><h2>${esc(label || app.title)}</h2><div class="app-player__bar"><i></i></div><div class="app-player__time"><span>0:00</span><span>3:42</span></div></div>
      <div class="app-player__controls"><button class="npc" data-pprev>${icon('chevronLeft')}</button><button class="npc" style="background:#fff;color:#071021" data-ptoggle>${icon('pause')}</button><button class="npc" data-pnext>${icon('chevronRight')}</button></div>
    </div>`, { cls: 'layer--center layer--wide', onMount(el) {
      el.querySelector('[data-pclose]').addEventListener('click', () => Layer.close());
      el.querySelector('[data-ptoggle]').addEventListener('click', () => {
        const bar = el.querySelector('.app-player__bar i');
        bar.style.animationPlayState = bar.style.animationPlayState === 'paused' ? 'running' : 'paused';
        toast('Воспроизведение', 'play');
      });
      el.querySelector('[data-pprev]')?.addEventListener('click', () => toast('Предыдущий трек', 'chevronLeft'));
      el.querySelector('[data-pnext]')?.addEventListener('click', () => toast('Следующий трек', 'chevronRight'));
    } });
  }

  function mountApp2(app) {
    const root = document.getElementById('appHost');
    root.querySelectorAll('[data-appact]').forEach(b => b.addEventListener('click', () => {
      const act = b.dataset.appact;
      if (act === 'home') { AppHost.close(); return; }
      openPlayer(app, b.dataset.label || app.title);
    }));
  }

  const baseRender = Views.render.bind(Views);
  const baseMount = Views.mount.bind(Views);
  Views.render = function (name, params = {}) {
    if (name === 'profile') return profile2();
    if (name === 'friends') return friends2();
    if (name === 'apps') return mediaHub();
    return baseRender(name, params);
  };
  Views.mount = function (name, params = {}) {
    if (name === 'profile') return bindProfile2(document.getElementById('viewRoot'));
    if (name === 'friends') return bindFriends2(document.getElementById('viewRoot'));
    if (name === 'apps') return bindMediaHub(document.getElementById('viewRoot'));
    return baseMount(name, params);
  };
  Views.renderApp = renderApp2;
  Views.mountApp = mountApp2;
})();
