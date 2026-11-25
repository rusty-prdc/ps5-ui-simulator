const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const OS = document.getElementById('os');

const SESSION = { name: 'Stepa_', level: 24, guest: false, avatar: state.user.avatar };

const DATE_FMT = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
const TIME_FMT = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });

function clockTick() {
  const now = new Date();
  const time = TIME_FMT.format(now);
  const date = DATE_FMT.format(now);
  const c = document.getElementById('clock');
  if (c) c.textContent = time;
  const d = document.getElementById('clockDate');
  if (d) d.textContent = date;
  const lc = document.getElementById('lockClock');
  if (lc) lc.textContent = time;
  const ld = document.getElementById('lockDate');
  if (ld) ld.textContent = date;
  const ss = document.getElementById('ssClock');
  if (ss) ss.textContent = time;
  const ssd = document.getElementById('ssDate');
  if (ssd) ssd.textContent = date;
}

/* ============ toast ============ */
let toastTimer = 0;
function toast(text, iconName = 'info', ms = 3800) {
  const box = document.getElementById('toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${icon(iconName)}<span>${text}</span>`;
  box.appendChild(el);
  while (box.children.length > 4) box.removeChild(box.firstElementChild);
  const t = setTimeout(() => {
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 320);
  }, ms);
  el.addEventListener('click', () => { clearTimeout(t); el.remove(); });
}

/* ============ layer ============ */
const Layer = {
  open(html, opts = {}) {
    const layer = document.getElementById('layer');
    layer.className = 'layer is-on ' + (opts.cls || '');
    layer.innerHTML = `<div class="layer__scrim" data-layer-close></div><div class="layer__panel ${opts.panelCls || ''}" role="dialog" aria-modal="true">${html}</div>`;
    paintIcons(layer);
    layer.dataset.kind = opts.kind || '';
    requestAnimationFrame(() => layer.classList.add('is-in'));
    const focusable = layer.querySelector('button:not([disabled]), [href], input');
    if (focusable && opts.focus !== false) setTimeout(() => focusable.focus({ preventScroll: true }), 60);
    if (opts.onMount) opts.onMount(layer);
    this.isOpen = true;
  },
  close() {
    const layer = document.getElementById('layer');
    if (!layer || !layer.classList.contains('is-on')) return;
    layer.classList.remove('is-in');
    this.isOpen = false;
    setTimeout(() => {
      if (!layer.classList.contains('is-in')) { layer.className = 'layer'; layer.innerHTML = ''; layer.dataset.kind = ''; }
    }, 260);
  }
};

function dialog({ title, text, iconName = 'info', actions = [], dismiss = true, tone = '' }) {
  const buttons = actions.map((a, i) =>
    `<button class="btn ${a.cls || (i === 0 ? 'btn--primary' : 'btn--ghost')}" data-dialog-act="${i}">${a.label}</button>`
  ).join('');
  Layer.open(`
    <div class="dialog ${tone ? 'dialog--' + tone : ''}">
      <div class="dialog__icon">${icon(iconName)}</div>
      <h3>${title}</h3>
      ${text ? `<p>${text}</p>` : ''}
      <div class="dialog__actions">${buttons}</div>
    </div>`, {
    cls: 'layer--center',
    onMount(el) {
      el.querySelectorAll('[data-dialog-act]').forEach(btn => {
        btn.addEventListener('click', () => {
          const a = actions[Number(btn.dataset.dialogAct)];
          Layer.close();
          if (a && a.onClick) setTimeout(a.onClick, 80);
        });
      });
    }
  });
  if (dismiss) {
    const scrim = document.querySelector('#layer .layer__scrim');
    scrim?.addEventListener('click', () => Layer.close());
  }
}

/* ============ router ============ */
const Router = {
  stack: [],
  open(name, params = {}) {
    this.saveScroll();
    const top = this.stack[this.stack.length - 1];
    if (top && top.name === name && name !== 'game') {
      top.params = Object.assign(top.params, params);
    } else {
      this.stack.push({ name, params, scroll: 0 });
    }
    this.render();
    document.getElementById('viewScreen').classList.add('is-active');
    OS.classList.add('has-view');
    document.getElementById('homeScreen').classList.add('is-active');
  },
  replace(name, params = {}) {
    if (this.stack.length) this.stack.pop();
    this.open(name, params);
  },
  render() {
    const entry = this.stack[this.stack.length - 1];
    if (!entry) return this.close();
    const root = document.getElementById('viewRoot');
    if (!window.Views) return;
    root.innerHTML = Views.render(entry.name, entry.params);
    paintIcons(root);
    if (Views.mount) Views.mount(entry.name, entry.params);
    requestAnimationFrame(() => {
      const scroll = root.querySelector('.view__scroll');
      if (scroll) scroll.scrollTop = entry.scroll || 0;
    });
  },
  saveScroll() {
    const entry = this.stack[this.stack.length - 1];
    const scroll = document.querySelector('#viewRoot .view__scroll');
    if (entry && scroll) entry.scroll = scroll.scrollTop;
  },
  back() {
    if (Layer.isOpen) { Layer.close(); return; }
    const appScreen = document.getElementById('appScreen');
    if (appScreen.classList.contains('is-active')) { AppHost.close(); return; }
    if (!this.stack.length) return;
    this.stack.pop();
    if (!this.stack.length) { this.close(); return; }
    this.render();
  },
  close() {
    this.stack = [];
    document.getElementById('viewScreen').classList.remove('is-active');
    OS.classList.remove('has-view');
    document.getElementById('viewRoot').innerHTML = '';
    if (window.Home) Home.focusSelected();
  }
};

/* ============ boot ============ */
const Boot = {
  active: false,
  stage: 'idle',
  timers: [],
  start(opts = {}) {
    this.clear();
    if (typeof Launch !== 'undefined') Launch.abort();
    this.active = true;
    OS.dataset.screen = 'boot';
    const boot = document.getElementById('boot');
    boot.classList.remove('is-done', 'is-logo', 'is-reel', 'is-user', 'is-load');
    document.getElementById('lock').classList.remove('is-on');
    document.getElementById('powerOff').classList.remove('is-on');
    document.getElementById('restScreen').classList.remove('is-on');
    document.getElementById('gameView').classList.remove('is-on');
    document.getElementById('screensaver').classList.remove('is-on');
    document.getElementById('homeScreen').classList.remove('is-active');
    document.getElementById('viewScreen').classList.remove('is-active');
    document.getElementById('appScreen').classList.remove('is-active');
    OS.classList.remove('has-view', 'has-app', 'is-paused');

    if (opts.userOnly) {
      this.setStage('user');
      return;
    }
    this.stage = 'black';
    this.timers.push(setTimeout(() => { if (this.active && this.stage === 'black') this.setStage('logo'); }, 520));
    this.timers.push(setTimeout(() => { if (this.active && this.stage === 'logo') this.setStage('reel'); }, 2800));
    this.timers.push(setTimeout(() => { if (this.active && this.stage === 'reel') this.setStage('user'); }, 5800));
  },
  clear() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  },
  setStage(stage) {
    this.stage = stage;
    const boot = document.getElementById('boot');
    boot.classList.toggle('is-logo', stage === 'logo');
    boot.classList.toggle('is-reel', stage === 'reel');
    boot.classList.toggle('is-user', stage === 'user');
    boot.classList.toggle('is-load', stage === 'load');
    if (stage === 'user') this.renderUsers();
    if (stage === 'load') this.loadUser();
  },
  renderUsers() {
    const wall = document.getElementById('userWall');
    if (!wall) return;
    wall.innerHTML = `
      <button class="userpick" data-boot-user="main">
        ${avatarHTML(state.user, 'avatar')}
        <strong>${state.user.name}</strong>
        <small>Уровень ${state.user.level} · PS Plus</small>
      </button>
      <button class="userpick" data-boot-user="guest">
        <span class="avatar avatar--guest">Г</span>
        <strong>Гость</strong>
        <small>Локальный профиль</small>
      </button>`;
    wall.querySelectorAll('[data-boot-user]').forEach(btn => {
      btn.addEventListener('click', () => {
        const who = btn.dataset.bootUser;
        if (who === 'add') return;
        this.choose(who);
      });
    });
  },
  choose(who) {
    if (this.stage !== 'user') return;
    if (who === 'guest') { SESSION.name = 'Гость'; SESSION.level = 0; SESSION.guest = true; SESSION.avatar = null; }
    else { SESSION.name = state.user.name; SESSION.level = state.user.level; SESSION.guest = false; SESSION.avatar = state.user.avatar; }
    this.applySession();
    this.setStage('load');
  },
  applySession() {
    const nameEl = document.getElementById('topName');
    if (nameEl) nameEl.textContent = SESSION.name;
    const lvlEl = document.getElementById('topLevel');
    if (lvlEl) lvlEl.textContent = SESSION.guest ? 'Гостевой профиль' : `Уровень ${SESSION.level}`;
    const qn = document.getElementById('quickName');
    if (qn) qn.textContent = SESSION.name;
    const bName = document.getElementById('bootName');
    if (bName) bName.textContent = SESSION.name;
    const bAv = document.getElementById('bootAvatar');
    if (bAv) {
      if (SESSION.guest || !SESSION.avatar) {
        bAv.classList.remove('avatar--photo');
        bAv.textContent = 'Г';
      } else {
        bAv.classList.add('avatar--photo');
        bAv.innerHTML = `<img src="${assetUrl(SESSION.avatar)}" alt="">`;
      }
    }
  },
  loadUser() {
    const bar = document.getElementById('bootBar');
    const status = document.getElementById('bootStatus');
    bar.style.width = '0%';
    const steps = [
      { at: 120, w: 18, t: 'Подготовка системы…' },
      { at: 620, w: 42, t: 'Вход в профиль…' },
      { at: 1150, w: 63, t: 'Загрузка библиотеки…' },
      { at: 1750, w: 82, t: 'Проверка обновлений…' },
      { at: 2250, w: 100, t: 'Почти готово…' }
    ];
    this.applySession();
    steps.forEach(s => {
      this.timers.push(setTimeout(() => {
        if (this.stage !== 'load') return;
        bar.style.width = s.w + '%';
        status.textContent = s.t;
      }, s.at));
    });
    this.timers.push(setTimeout(() => this.finish(), 2850));
  },
  finish() {
    const boot = document.getElementById('boot');
    boot.classList.add('is-done');
    boot.classList.remove('is-logo', 'is-reel', 'is-user', 'is-load');
    document.getElementById('homeScreen').classList.add('is-active');
    OS.dataset.screen = 'home';
    this.active = false;
    if (window.Home) Home.refresh();
    setTimeout(() => toast(`Добро пожаловать, ${SESSION.name}`, 'user'), 700);
  },
  skip() {
    if (!this.active) return;
    if (this.stage === 'black' || this.stage === 'logo' || this.stage === 'reel') {
      this.clear();
      this.setStage('user');
    } else if (this.stage === 'user') {
      this.choose('main');
    }
  }
};

/* ============ lock ============ */
const Lock = {
  on: false,
  show() {
    Layer.close();
    this.on = true;
    const lock = document.getElementById('lock');
    const av = document.getElementById('lockAvatar');
    const nm = document.getElementById('lockName');
    if (av) {
      if (SESSION.guest || !SESSION.avatar) { av.classList.remove('avatar--photo'); av.textContent = 'Г'; }
      else { av.classList.add('avatar--photo'); av.innerHTML = `<img src="${assetUrl(SESSION.avatar)}" alt="">`; }
    }
    if (nm) nm.textContent = SESSION.name;
    lock.classList.add('is-on');
    document.getElementById('screensaver').classList.remove('is-on');
    clockTick();
  },
  hide() {
    if (!this.on) return;
    this.on = false;
    document.getElementById('lock').classList.remove('is-on');
    OS.dataset.screen = 'home';
    if (window.Home) Home.refresh();
    toast(`С возвращением, ${SESSION.name}`, 'unlock');
  },
  toggle() { this.on ? this.hide() : this.show(); }
};

/* ============ power ============ */
const Power = {
  menu() {
    Layer.close();
    const rest = state.settings.restMode;
    Layer.open(`
      <div class="quickmenu">
        <div class="quickmenu__head">
          ${SESSION.guest || !SESSION.avatar ? `<span class="avatar avatar--sm">Г</span>` : `<span class="avatar avatar--sm avatar--photo"><img src="${assetUrl(SESSION.avatar)}" alt=""></span>`}
          <div><strong id="quickName">${SESSION.name}</strong><small>${SESSION.guest ? 'Гостевой профиль' : 'Уровень ' + SESSION.level}</small></div>
          <span class="quickmenu__net">${icon('wifi')} Wi-Fi</span>
        </div>
        <div class="quickmenu__grid quickmenu__grid--quick">
          <button class="quickitem" data-quick="downloads">
            <span class="quickitem__ico">${icon('download')}</span><span>Загрузки</span><small>${window.Downloads ? Downloads.activeCount() + ' в работе' : 'нет'}</small>
          </button>
          <button class="quickitem" data-quick="friends">
            <span class="quickitem__ico">${icon('users')}</span><span>Друзья</span><small>${state.friends.filter(f => f.status === 'online').length} в сети</small>
          </button>
          <button class="quickitem" data-quick="party">
            <span class="quickitem__ico">${icon('users')}</span><span>Party</span><small>${state.party && state.party.open ? (state.party.members || []).length + ' в party' : 'создать'}</small>
          </button>
          <button class="quickitem" data-quick="music">
            <span class="quickitem__ico">${icon(state.settings.musicPlaying === false ? 'play' : 'pause')}</span><span>Музыка</span><small>${state.settings.musicPlaying === false ? 'пауза' : 'играет'}</small>
          </button>
          <button class="quickitem" data-quick="mic">
            <span class="quickitem__ico">${icon('controller')}</span><span>Микрофон</span><small>${state.settings.micMuted ? 'выключен' : 'включён'}</small>
          </button>
          <button class="quickitem" data-quick="notifications">
            <span class="quickitem__ico">${icon('bell')}</span><span>Уведомления</span><small>${unreadCount()} новых</small>
          </button>
          <button class="quickitem" data-quick="capture">
            <span class="quickitem__ico">${icon('camera')}</span><span>Снимок экрана</span><small>${state.captures || 0} в галерее</small>
          </button>
          <button class="quickitem" data-quick="trophies">
            <span class="quickitem__ico">${icon('trophy')}</span><span>Трофеи</span><small>последняя игра</small>
          </button>
        </div>
        <div class="quickmenu__grid">
          <button class="quickitem" data-power="rest" ${rest ? '' : 'disabled'}>
            <span class="quickitem__ico">${icon('moon')}</span><span>Режим покоя</span>
          </button>
          <button class="quickitem" data-power="off">
            <span class="quickitem__ico">${icon('power')}</span><span>Выключить PS5</span>
          </button>
          <button class="quickitem" data-power="restart">
            <span class="quickitem__ico">${icon('restart')}</span><span>Перезагрузить</span>
          </button>
          <button class="quickitem" data-power="logout">
            <span class="quickitem__ico">${icon('logout')}</span><span>Выйти из системы</span>
          </button>
          <button class="quickitem" data-power="lock">
            <span class="quickitem__ico">${icon('lock')}</span><span>Заблокировать</span>
          </button>
          <button class="quickitem" data-power="settings">
            <span class="quickitem__ico">${icon('settings')}</span><span>Настройки</span>
          </button>
        </div>
        <div class="quickmenu__foot">
          <div class="quickmenu__row">
            <span>${icon('sound')} Громкость</span>
            <div class="volslider" data-volslider><i style="width:${state.settings.volume}%"></i></div>
            <b data-vol-label>${state.settings.volume}</b>
          </div>
          <div class="quickmenu__row">
            <span>${icon('display')} Яркость</span>
            <div class="volslider" data-brightslider><i style="width:${state.settings.brightness}%"></i></div>
            <b data-bright-label>${state.settings.brightness}</b>
          </div>
          <div class="quickmenu__row">
            <span>${icon('controller')} Контроллер</span>
            <span class="quickmenu__ok"><span class="dot dot--live"></span> DualSense подключён</span>
          </div>
        </div>
      </div>`, { cls: 'layer--quick', kind: 'quick' });

    const layer = document.getElementById('layer');
    layer.querySelectorAll('[data-power]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.dataset.power;
        if (p === 'lock') { Layer.close(); Lock.show(); }
        else if (p === 'settings') { Layer.close(); Router.open('settings', { tab: 'system' }); }
        else if (p === 'rest') this.rest();
        else if (p === 'off') this.confirmOff();
        else if (p === 'restart') this.confirmRestart();
        else if (p === 'logout') this.confirmLogout();
      });
    });
    layer.querySelectorAll('[data-quick]').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.dataset.quick;
        if (q === 'downloads') { Layer.close(); if (window.Downloads) Downloads.openManager(); }
        else if (q === 'friends') { Layer.close(); Router.open('friends'); }
        else if (q === 'party') { Layer.close(); if (window.Extras) Extras.openParty(); }
        else if (q === 'notifications') { Layer.close(); Router.open('notifications'); }
        else if (q === 'trophies') { Layer.close(); if (window.Extras) Extras.openTrophiesForLast(); }
        else if (q === 'capture') {
          state.captures = (state.captures || 0) + 1; save();
          btn.querySelector('small').textContent = state.captures + ' в галерее';
          toast('Снимок сохранён в галерею', 'camera');
        } else if (q === 'music') {
          state.settings.musicPlaying = state.settings.musicPlaying === false; save();
          btn.querySelector('small').textContent = state.settings.musicPlaying ? 'играет' : 'пауза';
          btn.querySelector('.quickitem__ico').innerHTML = icon(state.settings.musicPlaying ? 'pause' : 'play');
          toast(state.settings.musicPlaying ? 'Музыка играет' : 'Музыка на паузе', 'sound');
        } else if (q === 'mic') {
          state.settings.micMuted = !state.settings.micMuted; save();
          btn.querySelector('small').textContent = state.settings.micMuted ? 'выключен' : 'включён';
          toast(state.settings.micMuted ? 'Микрофон выключен' : 'Микрофон включён', 'controller');
        }
      });
    });
    const slider = layer.querySelector('[data-volslider]');
    slider?.addEventListener('click', (e) => {
      const r = slider.getBoundingClientRect();
      const v = Math.max(0, Math.min(100, Math.round((e.clientX - r.left) / r.width * 100)));
      state.settings.volume = v; save();
      slider.querySelector('i').style.width = v + '%';
      layer.querySelector('[data-vol-label]').textContent = v;
    });
    const bright = layer.querySelector('[data-brightslider]');
    bright?.addEventListener('click', (e) => {
      const r = bright.getBoundingClientRect();
      const v = Math.max(20, Math.min(100, Math.round((e.clientX - r.left) / r.width * 100)));
      state.settings.brightness = v; save();
      bright.querySelector('i').style.width = v + '%';
      layer.querySelector('[data-bright-label]').textContent = v;
      document.getElementById('os').style.filter = `brightness(${v}%)`;
    });
  },
  rest() {
    Layer.close();
    if (window.AppHost) AppHost.close(true);
    if (typeof Launch !== 'undefined') Launch.abort();
    const rest = document.getElementById('restScreen');
    document.getElementById('restScreen').classList.add('is-on');
    OS.dataset.screen = 'rest';
    const wake = () => {
      rest.classList.remove('is-on');
      OS.dataset.screen = 'home';
      document.removeEventListener('keydown', wake);
      rest.removeEventListener('click', wake);
      toast('Консоль вышла из режима покоя', 'sun');
      if (window.Home) Home.focusSelected();
    };
    setTimeout(() => {
      document.addEventListener('keydown', wake);
      rest.addEventListener('click', wake);
    }, 350);
  },
  confirmOff() {
    dialog({
      title: 'Выключить PlayStation 5?',
      text: 'Все несохранённые данные будут потеряны. Консоль можно будет включить снова в любой момент.',
      iconName: 'power',
      actions: [
        { label: 'Выключить', cls: 'btn--danger', onClick: () => this.off() },
        { label: 'Отмена', cls: 'btn--ghost', onClick: () => {} }
      ]
    });
  },
  off() {
    if (typeof Launch !== 'undefined') Launch.abort();
    const off = document.getElementById('powerOff');
    document.getElementById('powerOffText').textContent = 'Система выключена';
    document.getElementById('powerOnBtn').hidden = false;
    off.classList.add('is-on');
    OS.dataset.screen = 'off';
    document.getElementById('screensaver').classList.remove('is-on');
  },
  confirmRestart() {
    dialog({
      title: 'Перезагрузить консоль?',
      text: 'Система закроет все приложения и выполнит полную перезагрузку.',
      iconName: 'restart',
      actions: [
        { label: 'Перезагрузить', cls: 'btn--primary', onClick: () => this.restart() },
        { label: 'Отмена', cls: 'btn--ghost', onClick: () => {} }
      ]
    });
  },
  restart() {
    Layer.close();
    const off = document.getElementById('powerOff');
    document.getElementById('powerOffText').textContent = 'Перезагрузка…';
    document.getElementById('powerOnBtn').hidden = true;
    off.classList.add('is-on');
    OS.dataset.screen = 'boot';
    setTimeout(() => { off.classList.remove('is-on'); Boot.start(); }, 1500);
  },
  confirmLogout() {
    dialog({
      title: `Выйти из профиля ${SESSION.name}?`,
      text: 'Вы вернётесь к выбору пользователя. Загрузки и сохранения останутся на консоли.',
      iconName: 'logout',
      actions: [
        { label: 'Выйти', cls: 'btn--danger', onClick: () => { Layer.close(); setTimeout(() => Boot.start({ userOnly: true }), 120); } },
        { label: 'Отмена', cls: 'btn--ghost', onClick: () => {} }
      ]
    });
  }
};

/* ============ app host ============ */
const AppHost = {
  current: null,
  open(id) {
    const app = getApp(id);
    if (!app) return;
    this.current = app;
    state.recentApps = [id, ...(state.recentApps || []).filter(x => x !== id)].slice(0, 6);
    save();
    const host = document.getElementById('appHost');
    host.innerHTML = Views.renderApp(app);
    paintIcons(host);
    document.getElementById('appScreen').classList.add('is-active');
    OS.classList.add('has-app');
    OS.dataset.app = app.id;
    if (Views.mountApp) Views.mountApp(app);
  },
  close(silent = false) {
    if (!this.current) return;
    this.current = null;
    document.getElementById('appScreen').classList.remove('is-active');
    OS.classList.remove('has-app');
    OS.dataset.app = '';
    document.getElementById('appHost').innerHTML = '';
    if (!silent && window.Home) Home.focusSelected();
  }
};

/* ============ game launch ============ */
const Launch = {
  game: null,
  active: false,
  session: 0,
  timer: null,
  bootTimer: null,
  start(id) {
    const g = getGame(id);
    if (!g) return;
    clearInterval(this.timer);
    clearTimeout(this.bootTimer);
    Layer.close();
    Router.close();
    AppHost.close(true);
    this.game = g;
    this.active = true;
    this.session = 0;
    const view = document.getElementById('gameView');
    const art = document.getElementById('gameViewArt');
    art.innerHTML = coverArt(g, { hero: true, plain: true });
    document.getElementById('gvTitle').textContent = g.title;
    document.getElementById('gvSub').textContent = 'Запуск игры…';
    document.getElementById('gvKicker').textContent = `${g.studio} · ${g.genre}`;
    document.getElementById('gvStatus').textContent = 'Запуск';
    document.getElementById('gvClock').textContent = '00:00';
    document.getElementById('pauseTitle').textContent = g.title;
    document.getElementById('pauseSession').textContent = '00:00';
    document.getElementById('pauseMenu').classList.remove('is-on');
    document.getElementById('gvLoader').hidden = false;
    document.getElementById('gvHud').style.opacity = '0';
    view.classList.add('is-on');
    OS.dataset.screen = 'game';
    OS.classList.remove('has-view');
    const bar = document.querySelector('#gvLoader i');
    bar.style.transition = 'none';
    bar.style.width = '0%';
    requestAnimationFrame(() => {
      bar.style.transition = 'width 2.6s cubic-bezier(.3,.7,.2,1)';
      bar.style.width = '100%';
    });
    document.getElementById('gvSub').textContent = 'Загрузка сохранения и ресурсов…';
    this.bootTimer = setTimeout(() => {
      if (!this.active) return;
      document.getElementById('gvLoader').hidden = true;
      document.getElementById('gvStatus').textContent = 'Игра запущена';
      document.getElementById('gvSub').innerHTML = `Нажмите <kbd>Esc</kbd>, чтобы открыть меню паузы`;
      document.getElementById('gvHud').style.opacity = '1';
      this.timer = setInterval(() => this.tick(), 1000);
      toast(`${g.title} — игра запущена`, 'controller');
    }, 2750);
  },
  tick() {
    if (!this.active) return;
    this.session++;
    const m = String(Math.floor(this.session / 60)).padStart(2, '0');
    const s = String(this.session % 60).padStart(2, '0');
    const t = `${m}:${s}`;
    const a = document.getElementById('gvClock');
    const b = document.getElementById('pauseSession');
    if (a) a.textContent = t;
    if (b) b.textContent = t;
  },
  abort() {
    this.active = false;
    clearInterval(this.timer);
    clearTimeout(this.bootTimer);
    const menu = document.getElementById('pauseMenu');
    if (menu) menu.classList.remove('is-on');
    const view = document.getElementById('gameView');
    if (view) view.classList.remove('is-on');
    OS.classList.remove('is-paused');
    this.game = null;
  },
  togglePause(force) {
    if (!this.active) return;
    const menu = document.getElementById('pauseMenu');
    const open = typeof force === 'boolean' ? force : !menu.classList.contains('is-on');
    menu.classList.toggle('is-on', open);
    OS.classList.toggle('is-paused', open);
  },
  resume() { this.togglePause(false); },
  close() {
    if (!this.active) return;
    this.active = false;
    clearInterval(this.timer);
    clearTimeout(this.bootTimer);
    document.getElementById('pauseMenu').classList.remove('is-on');
    document.getElementById('gameView').classList.remove('is-on');
    OS.classList.remove('is-paused');
    OS.dataset.screen = 'home';
    const g = this.game;
    this.game = null;
    setTimeout(() => toast(`${g ? g.title : 'Игра'} — приложение закрыто`, 'x'), 250);
    if (window.Home) Home.focusSelected();
  }
};

/* ============ screensaver ============ */
const Saver = {
  timer: null,
  on: false,
  reset() {
    clearTimeout(this.timer);
    if (this.on) this.hide();
    this.timer = setTimeout(() => this.show(), 180000);
  },
  show() {
    if (!state.settings.screensaver) return;
    if (Boot.active || Lock.on || OS.dataset.screen === 'game' || OS.dataset.screen === 'rest') return;
    if (Layer.isOpen || Router.stack.length || AppHost.current) return;
    this.on = true;
    document.getElementById('screensaver').classList.add('is-on');
  },
  hide() {
    if (!this.on) return;
    this.on = false;
    document.getElementById('screensaver').classList.remove('is-on');
    this.reset();
  }
};

/* ============ pages ============ */
function openView(name, params) { Router.open(name, params); }

/* clock */
setInterval(clockTick, 1000);

window.Boot = Boot; window.Router = Router; window.Lock = Lock; window.Power = Power; window.Launch = Launch; window.AppHost = AppHost; window.Layer = Layer; window.Saver = Saver;
