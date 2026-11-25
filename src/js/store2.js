(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function head(k, t, a = '') { return `<header class="view__bar"><button class="view__back" data-back>${icon('arrowLeft')} Назад</button><div class="view__titles">${k ? `<p class="eyebrow">${k}</p>` : ''}<h1>${t}</h1></div>${a ? `<div class="view__actions">${a}</div>` : ''}</header>`; }
  function shell(o) { return `<div class="view__bg"></div>${head(o.k, o.t, o.a || '')}<div class="view__scroll"><div class="view__inner ${o.wide ? 'wide' : ''}">${o.body}</div></div>`; }
  const rub = n => formatRub(n);
  const CATS = [
    ['home', 'Главная'], ['new', 'Новинки'], ['popular', 'Популярное'], ['best', 'Самые продаваемые'],
    ['free', 'Бесплатные'], ['discount', 'Скидки'], ['exclusive', 'Эксклюзивы PlayStation'],
    ['adventure', 'Приключения'], ['action', 'Экшены'], ['racing', 'Гонки'], ['sport', 'Спорт'],
    ['horror', 'Хорроры'], ['rpg', 'RPG'], ['multiplayer', 'Мультиплеер']
  ];
  const store = { cat: 'home', sort: 'popular', free: false, q: '' };

  function allGames() { return GAMES.filter(g => g.store); }
  function priceOf(g, ed) {
    if (ed) return { now: ed.price, old: ed.old || 0 };
    const base = g.price || 0;
    if (!base) return { now: 0, old: 0 };
    const now = Math.round(base * (1 - (g.discount || 0) / 100));
    return { now, old: g.discount ? base : 0 };
  }
  function discountOf(g) { return g.discount || 0; }
  function ownedState(g) { return isOwned(g.id); }
  function installedState(g) { return isInstalled(g.id); }

  function card(g) {
    const p = priceOf(g);
    const owned = ownedState(g);
    const inst = installedState(g);
    return `<div class="store-card2" data-storeopen="${g.id}">
      <div class="sc2-cover">${coverArt(g)}
        ${discountOf(g) ? `<span class="sc2-badge sc2-badge--sale">−${discountOf(g)}%</span>` : ''}
        ${inst ? `<span class="sc2-badge sc2-badge--own">Установлено</span>` : owned ? `<span class="sc2-badge sc2-badge--own">В библиотеке</span>` : ''}
      </div>
      <div class="sc2-body"><b>${esc(g.title)}</b><small>${esc(g.studio)} · ${esc(g.genre)}</small>
        <div class="sc2-price">${p.old ? `<s>${rub(p.old)}</s>` : ''}<b>${p.now === 0 ? 'Бесплатно' : rub(p.now)}</b></div>
      </div>
    </div>`;
  }

  function filterSort() {
    let arr = allGames();
    if (store.cat !== 'home') arr = arr.filter(g => (g.categories || []).includes(store.cat));
    if (store.free) arr = arr.filter(g => (g.price || 0) === 0);
    if (store.q) {
      const q = store.q.toLowerCase();
      arr = arr.filter(g => (g.title + ' ' + g.studio + ' ' + g.publisher + ' ' + g.genre).toLowerCase().includes(q));
    }
    const sorters = {
      popular: (a, b) => (b.rating || 0) - (a.rating || 0),
      priceAsc: (a, b) => priceOf(a).now - priceOf(b).now,
      priceDesc: (a, b) => priceOf(b).now - priceOf(a).now,
      new: (a, b) => (b.year || 0) - (a.year || 0),
      discount: (a, b) => (b.discount || 0) - (a.discount || 0)
    };
    arr.sort(sorters[store.sort] || sorters.popular);
    return arr;
  }

  function storeView2() {
    const feat = getGame('gta6') || allGames()[0];
    const p = feat ? priceOf(feat) : { now: 0, old: 0 };
    const hero = feat ? `<div class="storehero2">
      <div class="storehero2__bg">${coverArt(feat, { hero: true, plain: true })}</div><div class="storehero2__shade"></div>
      <div class="storehero2__inner"><p class="eyebrow">Rockstar Games · Скоро</p><h2>${esc(feat.title)}</h2><p>${esc(feat.desc)}</p>
        <div class="storehero2__price"><b>${rub(p.now)}</b>${p.old ? `<s>${rub(p.old)}</s>` : ''}<span>${feat.editions ? feat.editions.length + ' издания' : ''}</span></div>
        <div style="display:flex;gap:.5rem;margin-top:.8rem"><button class="btn btn--primary btn--sm" data-shero="${feat.id}">${icon('store')} Купить</button><button class="btn btn--ghost btn--sm" data-storeopen="${feat.id}">Подробнее</button></div>
      </div></div>` : '';
    const body = `${hero}
      <div class="wallet2">${icon('store')}<div><b>${rub(state.balance)}</b><small>Кошелёк PS Store</small></div><button class="btn btn--ghost btn--sm" data-stopup>Пополнить</button></div>
      <div class="store-toolbar2">
        <div class="store-search2">${icon('search')}<input data-ssearch placeholder="Поиск игр, студий и жанров…" autocomplete="off"></div>
        <select class="sortselect" data-ssort><option value="popular">По популярности</option><option value="new">Новинки</option><option value="priceAsc">Сначала дешёвые</option><option value="priceDesc">Сначала дорогие</option><option value="discount">Больше скидка</option></select>
        <button class="segchip" data-sfree>Бесплатные</button>
      </div>
      <div class="store-cats">${CATS.map(([id, label]) => `<button class="segchip ${id === store.cat ? 'is-on' : ''}" data-scat="${id}">${label}</button>`).join('')}</div>
      <div class="store-count" data-scount></div>
      <div class="store-grid2" data-sgrid>${filterSort().map(card).join('')}</div>`;
    return shell({ k: 'PlayStation Store', t: 'Магазин', a: `<span class="count-pill">${allGames().length} игр</span>`, body, wide: true });
  }

  function bindStore2(root) {
    const grid = root.querySelector('[data-sgrid]');
    const count = root.querySelector('[data-scount]');
    const renderGrid = () => {
      const arr = filterSort();
      grid.innerHTML = arr.length ? arr.map(card).join('') : `<div class="empty glass" style="grid-column:1/-1">${icon('store')}<h3>Ничего не найдено</h3><p>Измените категорию или поисковый запрос.</p></div>`;
      count.innerHTML = `<span>${arr.length} игр</span><span>${store.cat === 'home' ? 'Весь каталог' : CATS.find(c => c[0] === store.cat)?.[1] || ''}</span>`;
      bindCards();
    };
    const bindCards = () => {
      grid.querySelectorAll('[data-storeopen]').forEach(c => c.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        Router.open('game', { id: c.dataset.storeopen });
      }));
    };
    root.querySelector('[data-ssearch]').addEventListener('input', (e) => { store.q = e.target.value.trim(); renderGrid(); });
    root.querySelector('[data-ssort]').addEventListener('change', (e) => { store.sort = e.target.value; renderGrid(); });
    root.querySelector('[data-sfree]').addEventListener('click', (e) => { store.free = !store.free; e.currentTarget.classList.toggle('is-on', store.free); renderGrid(); });
    root.querySelectorAll('[data-scat]').forEach(b => b.addEventListener('click', () => {
      store.cat = b.dataset.scat;
      root.querySelectorAll('[data-scat]').forEach(x => x.classList.toggle('is-on', x === b));
      renderGrid();
    }));
    root.querySelector('[data-stopup]')?.addEventListener('click', topUpDialog);
    root.querySelectorAll('[data-storeopen]').forEach(b => b.addEventListener('click', (e) => { if (!e.target.closest('[data-storeopen]')) return; }));
    const hero = root.querySelector('[data-shero]');
    if (hero) hero.addEventListener('click', () => openBuyDialog(getGame(hero.dataset.shero)));
    renderGrid();
  }

  function gamePage2(params) {
    const g = getGame(params.id);
    if (!g) return shell({ k: 'Магазин', t: 'Игра не найдена', body: '<div class="empty glass">Игра не найдена</div>' });
    const owned = ownedState(g), inst = installedState(g);
    const p = priceOf(g);
    const shots = ((g.screenshots && g.screenshots.length) ? g.screenshots : [g.hero || g.cover, g.cover]).filter(Boolean).slice(0, 3);
    const editions = (g.editions || []).length ? g.editions : [{ id: 'standard', name: 'Standard Edition', price: p.now, old: p.old }];
    const body = `<div class="gamepage2">
      <div class="gp2hero">${coverArt(g, { hero: true, plain: true })}<div class="gp2shade"></div>
        <div class="gp2heroinner"><div class="gp2cover">${coverArt(g)}</div>
          <div class="gp2info">
            ${g.logo ? `<img class="gp2logo ${/\.(jpg|jpeg)$/i.test(g.logo) ? 'gp2logo--raster' : ''} ${g.id === 'gta6' ? 'gp2logo--color' : ''}" src="${assetUrl(g.logo)}" alt="${esc(g.title)}">` : ''}
            <p class="eyebrow">${esc(g.publisher || 'PlayStation Store')} · ${g.year || ''}</p>
            <h1>${esc(g.title)}</h1><p class="sub">${esc(g.genre)} · ${esc(g.studio)}</p>
            <div class="gp2badges"><span class="age-badge age-${g.age || 16}">${g.age || 16}+</span>${owned ? `<span class="chip chip--ok">${icon('check')} ${inst ? 'Установлено' : 'В библиотеке'}</span>` : ''}<span class="chip">${icon('trophy')} ${g.trophies?.total || 40} трофеев</span><span class="chip">${icon('disc')} ${g.size || 60} ГБ</span></div>
            <div class="gp2buy">
              ${owned ? (inst ? `<button class="btn btn--primary" data-play="${g.id}">${icon('play')} Запустить</button>` : `<button class="btn btn--primary" data-install="${g.id}">${icon('download')} Установить</button>`) : `<div class="gp2price"><b>${rub(p.now)}</b>${p.old ? `<s>${rub(p.old)}</s>` : ''}${g.discount ? `<span>−${g.discount}%</span>` : ''}</div><button class="btn btn--primary" data-buy="${g.id}">${icon('store')} Купить</button>`}
              <button class="btn btn--ghost" data-gfav="${g.id}">${icon('heart')} ${isFav(g.id) ? 'В избранном' : 'В избранное'}</button>
            </div>
          </div>
        </div>
      </div>
      <div class="gp2body"><div class="gp2main">
        <div class="gpcard"><h3>${icon('info')} Об игре</h3><p class="gpdesc">${esc(g.desc)}</p></div>
        <div class="gpcard"><h3>${icon('camera')} Скриншоты</h3><div class="shots2">${shots.map(s => `<button class="shot2" data-shot="${assetUrl(s)}"><img src="${assetUrl(s)}" alt=""></button>`).join('')}</div></div>
        <div class="gpcard"><h3>${icon('store')} Издания</h3><div class="edition-list">${editions.map(e => {
          const ep = e.price === 0 ? 'Бесплатно' : rub(e.price);
          return `<div class="edition ${e.id === 'standard' ? 'is-on' : ''}"><div><b>${esc(e.name)}</b><small>${e.id === 'standard' ? 'Базовая игра' : 'Дополнительные материалы'}</small></div><span>${ep}</span>${owned ? '<span class="chip chip--ok">В библиотеке</span>' : `<button class="btn btn--primary btn--sm" data-sbuy="${g.id}" data-edition="${e.id}">Купить</button>`}</div>`;
        }).join('')}</div></div>
      </div>
      <div class="gp2side">
        <div class="gpcard"><h3>${icon('check')} Детали</h3><div class="detailrows">
          ${[['Разработчик', g.studio], ['Издатель', g.publisher], ['Жанр', g.genre], ['Возраст', (g.age || 16) + '+'], ['Размер', (g.size || 60) + ' ГБ'], ['Версия', g.version || '1.0']].map(([k, v]) => `<div class="row"><span>${k}</span><b>${esc(v)}</b></div>`).join('')}
        </div></div>
        <div class="gpcard"><h3>${icon('controller')} DualSense</h3><div class="featurelist">${(g.features || ['4K · HDR', '60 FPS', 'DualSense', 'Быстрая загрузка']).map(f => `<span class="chip">${icon('check')} ${esc(f)}</span>`).join('')}</div></div>
      </div></div>
    </div>`;
    return shell({ k: 'PlayStation Store', t: 'Страница игры', body, wide: true });
  }

  function bindGamePage2(root, params) {
    const g = getGame(params.id); if (!g) return;
    root.querySelector('[data-buy]')?.addEventListener('click', () => openBuyDialog(g));
    root.querySelector('[data-install]')?.addEventListener('click', () => installFlow(g));
    root.querySelector('[data-play]')?.addEventListener('click', () => Launch.start(g.id));
    root.querySelector('[data-gfav]')?.addEventListener('click', () => { toggleFav(g.id); Router.render(); });
    root.querySelectorAll('[data-sbuy]').forEach(b => b.addEventListener('click', () => openBuyDialog(g, b.dataset.edition)));
    root.querySelectorAll('[data-shot]').forEach(b => b.addEventListener('click', () => {
      Layer.open(`<div class="shotview"><img src="${b.dataset.shot}" alt=""><button class="iconbtn" data-shotclose>${icon('x')}</button></div>`, { cls: 'layer--center layer--wide', onMount(el) { el.querySelector('[data-shotclose]').addEventListener('click', () => Layer.close()); } });
    }));
  }

  function openBuyDialog(g, editionId) {
    if (!g) return;
    const editions = (g.editions || []).length ? g.editions : [{ id: 'standard', name: 'Standard Edition', price: g.price || 0, old: 0 }];
    let selected = editionId || editions[0].id;
    Layer.open(`<div class="buydialog">
      <div class="buydialog__head"><div class="buydialog__cover">${coverArt(g)}</div><div><p class="eyebrow">Покупка в PlayStation Store</p><h2>${esc(g.title)}</h2><p>${esc(g.genre)} · ${esc(g.studio)}</p></div><button class="iconbtn" data-bclose>${icon('x')}</button></div>
      <div class="buydialog__editions">${editions.map(e => `<button class="buyed ${e.id === selected ? 'is-on' : ''}" data-buyed="${e.id}"><b>${esc(e.name)}</b><span>${e.price === 0 ? 'Бесплатно' : rub(e.price)}</span></button>`).join('')}</div>
      <div class="buydialog__total"><div><span>Баланс</span><b data-bbalance>${rub(state.balance)}</b></div><div><span>К оплате</span><b data-btotal>${rub(priceOf(g, editions.find(e => e.id === selected)).now)}</b></div></div>
      <div class="dialog__actions"><button class="btn btn--primary" data-bconfirm>Подтвердить покупку</button><button class="btn btn--ghost" data-btopup>Пополнить кошелёк</button><button class="btn btn--ghost" data-bclose2>Отмена</button></div>
    </div>`, { cls: 'layer--center layer--wide', onMount(el) {
      const update = () => {
        const ed = editions.find(e => e.id === selected) || editions[0];
        const price = priceOf(g, ed).now;
        el.querySelector('[data-btotal]').textContent = rub(price);
        el.querySelectorAll('[data-buyed]').forEach(b => b.classList.toggle('is-on', b.dataset.buyed === selected));
      };
      el.querySelectorAll('[data-buyed]').forEach(b => b.addEventListener('click', () => { selected = b.dataset.buyed; update(); }));
      el.querySelector('[data-bclose]').addEventListener('click', () => Layer.close());
      el.querySelector('[data-bclose2]').addEventListener('click', () => Layer.close());
      el.querySelector('[data-btopup]').addEventListener('click', () => { Layer.close(); topUpDialog(); });
      el.querySelector('[data-bconfirm]').addEventListener('click', () => {
        const ed = editions.find(e => e.id === selected) || editions[0];
        const price = priceOf(g, ed).now;
        if (state.balance < price) { toast('Недостаточно средств в кошельке', 'store'); return; }
        const res = buyGame(g.id, price);
        if (!res.ok) { toast(res.reason === 'owned' ? 'Игра уже в библиотеке' : 'Не удалось оформить покупку', 'store'); return; }
        Layer.close(); toast(`«${g.title}» добавлена в библиотеку`, 'check'); Home.refresh(); Router.render();
      });
      update();
    } });
  }

  function installFlow(g) {
    if (window.Downloads) return Downloads.start(g);
    toast('Менеджер загрузок недоступен', 'x');
  }

  function topUpDialog() {
    Layer.open(`<div class="dialog"><div class="dialog__icon">${icon('store')}</div><h3>Пополнить кошелёк</h3><p>Выберите сумму пополнения.</p><div class="topup-grid">${[1000, 3000, 5000, 10000].map(n => `<button class="topup-opt" data-topup="${n}">${rub(n)}</button>`).join('')}</div><div class="dialog__actions"><button class="btn btn--ghost" data-tclose>Закрыть</button></div></div>`, { cls: 'layer--center', onMount(el) {
      el.querySelectorAll('[data-topup]').forEach(b => b.addEventListener('click', () => {
        state.balance += +b.dataset.topup; save(); Layer.close(); toast('Кошелёк пополнен', 'check'); Router.render();
      }));
      el.querySelector('[data-tclose]').addEventListener('click', () => Layer.close());
    } });
  }

  const prevRender = Views.render.bind(Views);
  const prevMount = Views.mount.bind(Views);
  Views.render = function (name, params = {}) {
    if (name === 'store') return storeView2();
    if (name === 'game') return gamePage2(params);
    return prevRender(name, params);
  };
  Views.mount = function (name, params = {}) {
    if (name === 'store') return bindStore2(document.getElementById('viewRoot'));
    if (name === 'game') return bindGamePage2(document.getElementById('viewRoot'), params);
    return prevMount(name, params);
  };
})();
