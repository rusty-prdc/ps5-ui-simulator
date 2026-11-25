const Home = (() => {
  let mode = state.mode || 'games';
  let busy = false;

  function list() {
    return mode === 'games' ? homeList() : homeApps();
  }

  function selectedId() {
    if (!state.ui) state.ui = {};
    let id = state.ui[mode];
    const arr = list();
    if (!id || !arr.some(x => x.id === id)) id = arr[0] ? arr[0].id : null;
    state.ui[mode] = id;
    return id;
  }

  function current() {
    const id = selectedId();
    return mode === 'games' ? getGame(id) : getApp(id);
  }

  function tileHTML(item, active) {
    if (mode === 'games') {
      const fav = isFav(item.id);
      return `<button class="tile ${active ? 'is-active' : ''}" data-game="${item.id}" role="option" aria-selected="${active}" aria-label="${item.title}">
        <span class="tile__frame">${coverArt(item)}
          ${fav ? `<span class="tile__badge"><span class="tile__tag tile__tag--fav">${icon('heart')}</span></span>` : ''}
        </span>
      </button>`;
    }
    return `<button class="tile tile--app ${active ? 'is-active' : ''}" data-app="${item.id}" role="option" aria-selected="${active}" aria-label="${item.title}">
      <span class="tile__frame">${appArt(item)}
        <span class="tile__applabel"><span class="tile__appname">${item.title}</span><span class="tile__apptag">${item.tag}</span></span>
      </span>
    </button>`;
  }

  function centerTile(tile, smooth = true) {
    const rail = document.getElementById('rail');
    if (!rail || !tile) return;
    const rr = rail.getBoundingClientRect();
    const tr = tile.getBoundingClientRect();
    const target = rail.scrollLeft + (tr.left - rr.left) - (rail.clientWidth - tr.width) / 2;
    const max = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const prev = rail.style.scrollBehavior;
    rail.style.scrollBehavior = 'auto';
    rail.scrollLeft = Math.max(0, Math.min(target, max));
    rail.style.scrollBehavior = prev;
  }

  function renderRail(keep = true) {
    const rail = document.getElementById('rail');
    if (!rail) return;
    const arr = list();
    if (!arr.length) {
      rail.innerHTML = `<div class="rail__empty glass"><h3>Здесь пока пусто</h3><p>${mode === 'games' ? 'Верните игры из библиотеки или магазина.' : 'Медиаприложения появятся здесь.'}</p><button class="btn btn--primary btn--sm" data-view="library">Открыть библиотеку</button></div>`;
      paintIcons(rail);
      return;
    }
    const id = selectedId();
    rail.innerHTML = arr.map(x => tileHTML(x, x.id === id)).join('');
    paintIcons(rail);
    const active = rail.querySelector('.tile.is-active');
    if (active && keep) {
      requestAnimationFrame(() => centerTile(active, true));
    }
  }

  function renderDots(arr, id) {
    const dots = document.getElementById('heroDots');
    if (!dots) return;
    dots.innerHTML = arr.map(x => `<i class="${x.id === id ? 'is-on' : ''}"></i>`).join('');
  }

  let posterSeq = 0;

  function swapHeroArt(html) {
    const art = document.getElementById('heroArt');
    if (!art) return;
    let layers = art.querySelectorAll('.hero__layer');
    if (layers.length < 2) {
      art.innerHTML = '<div class="hero__layer"></div><div class="hero__layer is-on"></div>';
      layers = art.querySelectorAll('.hero__layer');
    }
    const on = art.querySelector('.hero__layer.is-on');
    const off = art.querySelector('.hero__layer:not(.is-on)');
    if (!on || !off) { art.innerHTML = html; return; }
    off.innerHTML = html;
    off.classList.add('is-on');
    on.classList.remove('is-on');
  }

  function setPoster(html) {
    const poster = document.getElementById('heroPoster');
    if (!poster) return;
    const seq = ++posterSeq;
    if (!poster.innerHTML.trim()) { poster.innerHTML = html; return; }
    poster.classList.add('is-fading');
    setTimeout(() => {
      if (seq !== posterSeq) return;
      poster.innerHTML = html;
      requestAnimationFrame(() => poster.classList.remove('is-fading'));
    }, 190);
  }

  let slideTimer = 0;
  let slideKey = '';
  let slideIdx = 0;

  function stopHeroSlides() {
    if (slideTimer) { clearInterval(slideTimer); slideTimer = 0; }
    slideKey = '';
    const box = document.getElementById('heroSlides');
    if (box) box.remove();
  }

  function startHeroSlides(item) {
    const arr = item && mode === 'games' && Array.isArray(item.slides) ? item.slides : null;
    const art = document.getElementById('heroArt');
    if (!arr || arr.length < 2 || !art) {
      if (slideKey || document.getElementById('heroSlides')) stopHeroSlides();
      return;
    }
    let box = document.getElementById('heroSlides');
    if (slideKey === item.id && box) return;
    stopHeroSlides();
    slideKey = item.id;
    slideIdx = 0;
    if (!box) {
      box = document.createElement('div');
      box.id = 'heroSlides';
      box.className = 'hero__slides';
      art.appendChild(box);
    }
    box.classList.remove('is-on');
    box.innerHTML = '<div class="hero__slide is-on"><img alt="" decoding="async" draggable="false"></div>'
      + '<div class="hero__slide"><img alt="" decoding="async" draggable="false"></div>';
    const imgs = box.querySelectorAll('img');
    imgs[0].src = assetUrl(arr[0]);
    imgs[1].src = assetUrl(arr[1]);
    requestAnimationFrame(() => box.classList.add('is-on'));
    arr.forEach(src => { const pre = new Image(); pre.src = assetUrl(src); });
    slideTimer = setInterval(() => {
      const host = document.getElementById('heroSlides');
      if (!host || host !== box || slideKey !== item.id) { stopHeroSlides(); return; }
      if (!box.offsetWidth) return;
      const on = box.querySelector('.hero__slide.is-on');
      const off = box.querySelector('.hero__slide:not(.is-on)');
      if (!on || !off) return;
      slideIdx = (slideIdx + 1) % arr.length;
      const img = off.querySelector('img');
      if (img) img.src = assetUrl(arr[slideIdx]);
      off.classList.add('is-on');
      on.classList.remove('is-on');
    }, 5000);
  }

  function renderHero(animate = true) {
    const item = current();
    const content = document.getElementById('heroContent');
    const art = document.getElementById('heroArt');
    const poster = document.getElementById('heroPoster');
    if (!item) {
      content.innerHTML = `<p class="eyebrow">PS5 OS</p><h1 class="hero__title">Библиотека пуста</h1><p class="hero__meta">Добавьте игру или откройте магазин, чтобы начать.</p><div class="hero__actions"><button class="btn btn--primary" data-view="store">Открыть магазин</button></div>`;
      paintIcons(content);
      stopHeroSlides();
      art.innerHTML = '<div class="hero__layer is-on"></div><div class="hero__layer"></div>';
      poster.innerHTML = '';
      document.getElementById('heroDots').innerHTML = '';
      return;
    }

    const apply = () => {
      if (mode === 'games' && !item.trophies) return;
      if (mode !== 'games' && !item.tag) return;
      const arr = list();
      document.getElementById('heroKicker').innerHTML = mode === 'games'
        ? `Последняя игра · ${item.lastShort || 'недавно'}`
        : `Медиаприложение · ${item.tag}`;
      document.getElementById('heroTitle').textContent = item.title;
      document.getElementById('heroMeta').innerHTML = mode === 'games'
        ? `${item.logo ? `<img class="hero__brand" src="${assetUrl(item.logo)}" alt="${item.studio}">` : ''}<b>${item.sub}</b><span class="sepdot"></span><span>${item.genre}</span><span class="sepdot"></span><span>${item.year}</span>`
        : `<b>${item.tag}</b><span class="sepdot"></span><span>${item.desc}</span>`;
      document.getElementById('heroPlay').innerHTML = `${icon(mode === 'games' ? 'play' : 'arrowRight')}<span>${mode === 'games' ? 'Запустить' : 'Открыть'}</span>`;
      const fav = document.getElementById('heroFav');
      fav.hidden = mode !== 'games';
      fav.classList.toggle('is-fav', mode === 'games' && isFav(item.id));
      fav.setAttribute('aria-label', mode === 'games' && isFav(item.id) ? 'Убрать из избранного' : 'В избранное');
      document.getElementById('heroMore').hidden = mode !== 'games';
      const facts = document.getElementById('heroFacts');
      const prog = document.getElementById('heroFacts');
      if (mode === 'games') {
        facts.innerHTML = `
          <span class="chip ${item.installed ? 'chip--ok' : ''}">${icon(item.installed ? 'check' : 'download')}${item.installed ? 'Установлено' : 'Не установлено'}</span>
          <span class="chip">${icon('clock')}${item.playtime}</span>
          <span class="chip chip--gold">${icon('trophy')}${item.trophies.have}/${item.trophies.total}</span>
          <span class="chip">${icon('disc')}${fmtSize(item.size)}</span>
          <span class="hero__progress"><span class="hero__progressbar"><i style="width:${item.progress}%"></i></span>Пройдено ${item.progress}%</span>`;
      } else {
        facts.innerHTML = `<span class="chip">${icon('app')}Приложение PS5</span><span class="chip">${icon('display')}4K HDR</span><span class="chip">${icon('sound')}Объёмный звук</span>`;
      }
      paintIcons(facts);
      swapHeroArt(coverArt(item, { hero: true, plain: true }));
      startHeroSlides(item);
      setPoster(coverArt(item));
      document.getElementById('heroDots').innerHTML = arr.map(x => `<i class="${x.id === item.id ? 'is-on' : ''}"></i>`).join('');
      document.getElementById('shelfLabel').textContent = mode === 'games' ? 'Моя библиотека' : 'Медиаприложения';
      document.getElementById('openLibrary').innerHTML = mode === 'games'
        ? `Вся библиотека ${icon('chevronRight')}`
        : `Все приложения ${icon('chevronRight')}`;
      paintIcons(document.getElementById('openLibrary'));
      setAmbient(item);
      document.getElementById('heroPlay').onclick = () => launchSelected();
      document.getElementById('heroMore').onclick = () => {
        if (mode === 'games') Router.open('game', { id: item.id });
        else Router.open('apps');
      };
      document.getElementById('heroFav').onclick = () => toggleFavorite();
      if (window.CoverGlow) CoverGlow(item);
    };

    if (animate && content) {
      content.classList.add('is-swapping');
      setTimeout(() => { apply(); content.classList.remove('is-swapping'); }, 170);
    } else {
      apply();
    }
  }

  function select(id, opts = {}) {
    if (!state.ui) state.ui = {};
    if (list().some(x => x.id === id)) {
      state.ui[mode] = id;
      save();
    }
    const rail = document.getElementById('rail');
    rail?.querySelectorAll('.tile').forEach(t => {
      const on = (t.dataset.game || t.dataset.app) === id;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on);
    });
    renderHero(true);
    if (opts.focus) {
      const active = rail?.querySelector('.tile.is-active');
      active?.focus({ preventScroll: true });
    }
  }

  function move(dir) {
    const arr = list();
    if (!arr.length) return;
    let i = arr.findIndex(x => x.id === selectedId());
    i = (i + dir + arr.length) % arr.length;
    select(arr[i].id, { focus: true });
    const rail = document.getElementById('rail');
    const active = rail?.querySelector('.tile.is-active');
    centerTile(active, true);
  }

  function setMode(next, opts = {}) {
    mode = next === 'media' ? 'media' : 'games';
    state.mode = mode; save();
    document.querySelectorAll('.modeswitch__btn').forEach(b => {
      const on = b.dataset.mode === mode;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on);
    });
    document.querySelector('.modeswitch')?.classList.toggle('is-media', mode === 'media');
    document.querySelector('.home')?.classList.toggle('is-media', mode === 'media');
    renderRail(true);
    renderHero(true);
    if (window.paintIcons) paintIcons(document.getElementById('heroPlay'));
    if (opts.focus) focusSelected();
  }

  function launchSelected() {
    const item = current();
    if (!item) return;
    if (mode === 'games') Launch.start(item.id);
    else AppHost.open(item.id);
  }

  function toggleFavorite() {
    const item = current();
    if (!item || mode !== 'games') return;
    toggleFav(item.id);
    const fav = document.getElementById('heroFav');
    fav.classList.toggle('is-fav', isFav(item.id));
    const rail = document.getElementById('rail');
    renderRail(false);
    toast(isFav(item.id) ? `«${item.title}» добавлена в избранное` : `«${item.title}» удалена из избранного`, 'heart');
    renderHero(false);
    if (rail) {
      const active = rail.querySelector(`[data-game="${item.id}"]`);
      centerTile(active, false);
    }
  }

  function focusSelected() {
    const active = document.querySelector('#rail .tile.is-active');
    if (active) {
      active.focus({ preventScroll: true });
      centerTile(active, false);
    }
  }

  function refresh() {
    mode = state.mode || 'games';
    document.querySelectorAll('.modeswitch__btn').forEach(b => {
      const on = b.dataset.mode === mode;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on);
    });
    document.querySelector('.modeswitch')?.classList.toggle('is-media', mode === 'media');
    document.getElementById('homeScreen').classList.add('is-active');
    const av = document.getElementById('topAvatarImg');
    if (av) av.src = assetUrl(state.user.avatar);
    const tn = document.getElementById('topName');
    if (tn) tn.textContent = state.user.name;
    const tl = document.getElementById('topLevel');
    if (tl) tl.textContent = 'Уровень ' + state.user.level;
    const ts = document.getElementById('topStatus');
    if (ts) {
      ts.dataset.status = state.user.status || 'online';
      const st = (typeof FRIEND_STATUS !== 'undefined' && FRIEND_STATUS[state.user.status]) || { label: 'В сети' };
      ts.title = st.label;
    }
    const wifi = document.getElementById('wifi');
    wifi?.classList.toggle('is-off', !state.settings.wifi);
    const net = document.getElementById('netStat');
    if (net) net.innerHTML = `<span class="netstat__dot" style="background:${state.settings.wifi ? 'var(--ok)' : 'var(--danger)'}"></span><span class="netstat__text">${state.settings.wifi ? 'Подключено к сети' : 'Нет подключения'}</span>`;
    const badge = document.getElementById('notifBadge');
    const unread = unreadCount();
    if (badge) { badge.textContent = unread; badge.hidden = unread === 0; }
    renderRail(false);
    renderHero(false);
    Boot.applySession();
    requestAnimationFrame(() => {
      const active = document.querySelector('#rail .tile.is-active');
      centerTile(active, false);
    });
  }

  function init() {
    const rail = document.getElementById('rail');
    rail?.addEventListener('click', (e) => {
      const tile = e.target.closest('.tile');
      if (!tile) return;
      const id = tile.dataset.game || tile.dataset.app;
      if (id) select(id);
    });
    rail?.addEventListener('dblclick', (e) => {
      const tile = e.target.closest('.tile');
      if (!tile) return;
      const id = tile.dataset.game || tile.dataset.app;
      select(id);
      launchSelected();
    });
    document.querySelectorAll('.modeswitch__btn').forEach(btn => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode, { focus: true }));
    });
    document.getElementById('openLibrary')?.addEventListener('click', () => {
      Router.open(mode === 'games' ? 'library' : 'apps');
    });
    document.addEventListener('mousemove', (e) => {
      if (OS.classList.contains('has-view') || OS.classList.contains('has-app')) return;
      const art = document.getElementById('heroArt');
      if (!art) return;
      const nx = (e.clientX / window.innerWidth - .5) * 2;
      const ny = (e.clientY / window.innerHeight - .5) * 2;
      art.style.setProperty('--mx', (-nx).toFixed(3));
      art.style.setProperty('--my', (-ny).toFixed(3));
    });
    refresh();
  }

  return { init, refresh, select, move, setMode, launchSelected, focusSelected, get mode() { return mode; }, current };
})();

window.Home = Home;


