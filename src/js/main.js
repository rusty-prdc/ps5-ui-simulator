(function () {
  const bootEl = document.getElementById('boot');

  function applyPrefs() {
    const os = document.getElementById('os');
    if (os) os.style.filter = state.settings.brightness === 100 ? '' : `brightness(${state.settings.brightness}%)`;
    const wifi = document.getElementById('wifi');
    if (wifi) wifi.classList.toggle('is-off', !state.settings.wifi);
  }

  function wireStatic() {
    document.getElementById('psBtn')?.addEventListener('click', (e) => { e.stopPropagation(); Power.menu(); });
    document.getElementById('lockLogin')?.addEventListener('click', (e) => { e.stopPropagation(); Lock.hide(); });
    document.getElementById('lock')?.addEventListener('click', () => Lock.hide());
    document.getElementById('powerOnBtn')?.addEventListener('click', () => { SESSION.name = state.user.name; Boot.start(); });
    document.getElementById('bootSkip')?.addEventListener('click', (e) => { e.stopPropagation(); Boot.skip(); });
    document.getElementById('screensaver')?.addEventListener('click', () => Saver.hide());

    bootEl?.addEventListener('click', (e) => {
      if (e.target.closest('[data-boot-user]') || e.target.closest('#bootSkip')) return;
      Boot.skip();
    });

    document.getElementById('resumeBtn')?.addEventListener('click', () => Launch.resume());
    document.getElementById('closeGameBtn')?.addEventListener('click', () => Launch.close());
    document.getElementById('pauseSettings')?.addEventListener('click', () => toast('Настройки игры доступны внутри игры', 'settings'));

    window.addEventListener('beforeunload', () => { try { save(); } catch (e) {} });
  }

  let topbarIndex = 0;
  let topbarTouched = false;
  function topbarButtons() {
    return [...document.querySelectorAll('#topbar button')].filter(b => {
      const r = b.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    });
  }
  function focusTopbar() {
    const list = topbarButtons();
    if (!list.length) return;
    if (!topbarTouched) {
      const act = document.querySelector('.modeswitch__btn.is-active');
      const idx = list.indexOf(act);
      if (idx >= 0) topbarIndex = idx;
      topbarTouched = true;
    }
    list[Math.min(topbarIndex, list.length - 1)].focus({ preventScroll: true });
  }
  function moveTopbar(dir) {
    const list = topbarButtons();
    if (!list.length) return;
    const cur = list.indexOf(document.activeElement);
    topbarIndex = ((cur < 0 ? 0 : cur) + dir + list.length) % list.length;
    list[topbarIndex].focus({ preventScroll: true });
  }

  function handleAction(action) {
    if (action === 'search') Views.openSearch();
    else if (action === 'settings') Router.open('settings', { tab: 'system' });
    else if (action === 'notifications') Router.open('notifications');
    else if (action === 'friends') Router.open('friends');
    else if (action === 'profile') Router.open('profile');
    else if (action === 'store') Router.open('store');
    else if (action === 'library') Router.open('library');
    else if (action === 'apps') Router.open('apps');
    else if (action === 'lock') Lock.show();
  }

  document.addEventListener('click', (e) => {
    const actionEl = e.target.closest('[data-action]');
    if (actionEl) {
      e.preventDefault();
      handleAction(actionEl.dataset.action);
      return;
    }
    const viewEl = e.target.closest('[data-view]');
    if (viewEl) {
      e.preventDefault();
      const p = {};
      Object.keys(viewEl.dataset).forEach(k => { if (k !== 'view') p[k] = viewEl.dataset[k]; });
      Router.open(viewEl.dataset.view, p);
      return;
    }
    const backEl = e.target.closest('[data-back]');
    if (backEl) {
      e.preventDefault();
      Router.back();
      return;
    }
    if (e.target.closest('[data-layer-close]')) {
      Layer.close();
    }
  });

  document.addEventListener('keydown', (e) => {
    Saver.reset();
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || document.activeElement?.isContentEditable;

    if (Saver.on) { Saver.hide(); return; }

    if (e.key === 'Escape') {
      if (document.getElementById('pauseMenu')?.classList.contains('is-on')) { Launch.resume(); return; }
      if (Layer.isOpen) { Layer.close(); return; }
      if (Launch.active) { Launch.togglePause(true); return; }
      if (Boot.active) { Boot.skip(); return; }
      if (Lock.on) { Lock.hide(); return; }
      if (AppHost.current) { AppHost.close(); return; }
      if (Router.stack.length) { Router.back(); return; }
      return;
    }

    if (Boot.active) {
      if (e.key === 'Enter') { e.preventDefault(); Boot.skip(); }
      return;
    }
    if (Lock.on) {
      if (e.key === 'Enter') { e.preventDefault(); Lock.hide(); }
      return;
    }
    if (OS.dataset.screen === 'off' || OS.dataset.screen === 'rest') return;
    if (Launch.active) {
      if (e.key === 'Escape') { Launch.togglePause(); }
      return;
    }
    if (typing) return;
    if (Layer.isOpen) return;
    if (AppHost.current) return;
    if (Router.stack.length) return;

    const inTopbar = !!(document.activeElement && document.activeElement.closest('#topbar'));
    if (inTopbar) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        moveTopbar(e.key === 'ArrowLeft' ? -1 : 1);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (window.Home && Home.focusSelected) Home.focusSelected();
        else { const hp = document.getElementById('heroPlay'); if (hp) hp.focus(); }
        return;
      }
    }
    if (e.key === 'ArrowUp' && !inTopbar) {
      e.preventDefault();
      focusTopbar();
      return;
    }
    if (e.key === 'ArrowLeft') { e.preventDefault(); Home.move(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); Home.move(1); }
    else if (e.key === 'Enter') {
      if (document.activeElement?.closest('.topbar') || document.activeElement?.closest('.modeswitch')) return;
      e.preventDefault();
      Home.launchSelected();
    } else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault(); Views.openSearch();
    } else if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault(); Power.menu();
    } else if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault(); Home.setMode(Home.mode === 'games' ? 'media' : 'games', { focus: true });
    }
  });

  document.addEventListener('mousemove', () => Saver.reset(), { passive: true });
  document.addEventListener('pointerdown', () => Saver.reset(), { passive: true });

  function init() {
    paintIcons(document);
    SESSION.name = state.user.name;
    SESSION.level = state.user.level;
    applyPrefs();
    Home.init();
    wireStatic();
    Boot.start();
    Saver.reset();
    setTimeout(() => { if (Boot.active) toast('Нажмите Enter, чтобы выбрать профиль', 'user', 2600); }, 5200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
