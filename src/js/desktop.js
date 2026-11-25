(() => {
  if (!window.__PS5_DESKTOP__) return;

  function start() {
  const LIB = Array.isArray(window.__PS5_DESKTOP_LIBRARY__) ? window.__PS5_DESKTOP_LIBRARY__ : [];

  const PALETTES = [
    ['#5b8bff', '#1d3f9e', '#070d22'],
    ['#ff7a4d', '#8a2d12', '#1a0803'],
    ['#43d6a1', '#0f5f49', '#04150f'],
    ['#b07bff', '#3d1f7a', '#0d0618'],
    ['#ffd166', '#8c5a12', '#1b1204'],
    ['#69e0ff', '#155a7a', '#041018']
  ];

  function glyphOf(title) {
    return String(title || 'PC').replace(/[^A-Za-zА-Яа-я0-9]/g, '').slice(0, 3).toUpperCase() || 'PC';
  }

  function makeGame(item, index) {
    const pal = PALETTES[index % PALETTES.length];
    const isSteam = item.kind === 'steam';
    return {
      id: item.id,
      title: item.title,
      sub: isSteam ? 'PS5 · Steam' : 'PS5 · ПК',
      studio: isSteam ? 'Steam' : 'Локальная игра',
      publisher: isSteam ? 'Steam' : 'ПК',
      genre: isSteam ? 'Игра из Steam' : 'Добавленная игра',
      year: new Date().getFullYear(),
      size: item.sizeGb || 0,
      version: '1.0',
      rating: 0,
      lastPlayed: 'Не запускалась',
      lastShort: '',
      playtime: '0 ч',
      progress: 0,
      installed: true,
      fav: false,
      trophies: { have: 0, total: 0 },
      price: 0,
      discount: 0,
      desc: isSteam
        ? 'Найдена автоматически в библиотеке Steam. Запускается своим exe.'
        : 'Добавлена вручную. Запускается своим exe.',
      features: ['Steam', 'Exe'],
      art: { c1: pal[0], c2: pal[1], c3: pal[2], pat: 'blocks', glyph: glyphOf(item.title) },
      accent: pal[0],
      cover: item.cover || null,
      hero: item.hero || item.cover || null,
      logo: item.logo || null,
      screenshots: [],
      editions: [],
      exePath: item.exePath,
      ext: true,
      source: item.kind
    };
  }

  let injected = 0;
  LIB.forEach((item, i) => {
    if (!item || !item.id || GAME_MAP[item.id]) return;
    const game = makeGame(item, i);
    GAMES.push(game);
    GAME_MAP[game.id] = game;
    if (!state.gameOrder.includes(game.id)) state.gameOrder.push(game.id);
    injected++;
  });
  state.gameOrder = [...new Set(state.gameOrder)];
  if (injected && typeof save === 'function') save();

  const origStart = Launch.start.bind(Launch);
  Launch.start = function (id, ...rest) {
    const game = getGame(id);
    if (game && game.exePath && game.ext) {
      if (typeof toast === 'function') toast(`${game.title} — запуск…`, 'controller');
      fetch('/api/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: game.id, exePath: game.exePath })
      })
        .then(r => r.json())
        .then(res => {
          if (!res.ok && typeof toast === 'function') toast('Не удалось запустить: ' + (res.error || 'ошибка'), 'alert');
        })
        .catch(() => { if (typeof toast === 'function') toast('Не удалось запустить игру', 'alert'); });
      return;
    }
    return origStart(id, ...rest);
  };

  const style = document.createElement('style');
  style.textContent = `
  .dt-fab{position:fixed;right:1.6rem;bottom:1.4rem;z-index:9000;display:flex;align-items:center;gap:.5rem;
    padding:.7rem 1.1rem;border-radius:999px;border:1px solid rgba(255,255,255,.22);
    background:rgba(14,18,30,.82);backdrop-filter:blur(18px);color:#fff;font:600 .82rem/1 "Inter",system-ui,sans-serif;
    letter-spacing:.02em;cursor:pointer;box-shadow:0 18px 40px rgba(0,0,0,.55);transition:transform .18s,background .18s}
  .dt-fab:hover{transform:translateY(-2px);background:rgba(30,38,60,.92)}
  .dt-fab span{font-size:1.05rem}
  .dt-modal{position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;
    background:rgba(3,5,12,.72);backdrop-filter:blur(10px);font:500 .92rem/1.4 "Inter",system-ui,sans-serif;color:#fff}
  .dt-card{width:min(560px,92vw);border-radius:18px;background:#0b1220;border:1px solid rgba(255,255,255,.12);
    box-shadow:0 40px 90px rgba(0,0,0,.7);padding:1.5rem 1.6rem 1.4rem;display:flex;flex-direction:column;gap:1rem}
  .dt-card h2{margin:0;font-size:1.15rem;font-weight:700;letter-spacing:-.01em}
  .dt-card p{margin:0;color:rgba(255,255,255,.6);font-size:.84rem}
  .dt-actions{display:flex;flex-wrap:wrap;gap:.6rem}
  .dt-btn{appearance:none;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;
    border-radius:10px;padding:.62rem .95rem;font:600 .84rem/1 "Inter",system-ui,sans-serif;cursor:pointer;transition:background .16s}
  .dt-btn:hover{background:rgba(255,255,255,.14)}
  .dt-btn--primary{background:#fff;color:#0a0c12;border-color:#fff}
  .dt-btn--primary:hover{background:#e8ecf7}
  .dt-field{display:flex;flex-direction:column;gap:.35rem}
  .dt-field label{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.45)}
  .dt-input{width:100%;box-sizing:border-box;border-radius:10px;border:1px solid rgba(255,255,255,.16);
    background:rgba(0,0,0,.35);color:#fff;padding:.6rem .7rem;font:500 .86rem/1.3 "Inter",system-ui,sans-serif}
  .dt-path{font:500 .78rem/1.35 ui-monospace,Consolas,monospace;color:rgba(255,255,255,.55);word-break:break-all}
  .dt-close{align-self:flex-end;background:none;border:0;color:rgba(255,255,255,.5);font-size:1.2rem;cursor:pointer}
  .dt-note{color:#7fc7a8;font-size:.8rem;min-height:1.1em}
  `;
  document.head.appendChild(style);

  const fab = document.createElement('button');
  fab.className = 'dt-fab';
  fab.innerHTML = '<span>＋</span> Добавить игру';
  document.body.appendChild(fab);

  const dlg = { exePath: '', cover: '' };

  function closeModal() {
    const m = document.querySelector('.dt-modal');
    if (m) m.remove();
  }

  function openModal() {
    closeModal();
    const modal = document.createElement('div');
    modal.className = 'dt-modal';
    modal.innerHTML = `
      <div class="dt-card">
        <button class="dt-close" aria-label="Закрыть">×</button>
        <h2>Библиотека игр</h2>
        <p>Steam сканируется автоматически. Можно добавить любой .exe вручную и выбрать обложку.</p>
        <div class="dt-actions">
          <button class="dt-btn" data-act="scan">Сканировать Steam</button>
          <button class="dt-btn dt-btn--primary" data-act="pick">Добавить .exe</button>
        </div>
        <div class="dt-field" hidden data-field="form">
          <label>Название</label>
          <input class="dt-input" data-role="name" placeholder="Название игры">
          <label>Файл</label>
          <div class="dt-path" data-role="path"></div>
          <label>Обложка</label>
          <div class="dt-actions">
            <button class="dt-btn" data-act="cover">Выбрать обложку</button>
            <span class="dt-path" data-role="cover"></span>
          </div>
        </div>
        <div class="dt-actions" hidden data-field="save">
          <button class="dt-btn dt-btn--primary" data-act="save">Добавить в библиотеку</button>
        </div>
        <div class="dt-note" data-role="note"></div>
      </div>`;
    document.body.appendChild(modal);

    const form = modal.querySelector('[data-field="form"]');
    const saveRow = modal.querySelector('[data-field="save"]');
    const note = modal.querySelector('[data-role="note"]');
    const nameInput = modal.querySelector('[data-role="name"]');
    const pathBox = modal.querySelector('[data-role="path"]');
    const coverBox = modal.querySelector('[data-role="cover"]');

    const setNote = (text) => { note.textContent = text || ''; };

    modal.addEventListener('click', async (e) => {
      if (e.target === modal || e.target.classList.contains('dt-close')) { closeModal(); return; }
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'scan') {
        setNote('Сканирую Steam…');
        btn.disabled = true;
        try {
          const res = await fetch('/api/scan', { method: 'POST' }).then(r => r.json());
          setNote(`Найдено игр: ${(res.library || []).length}. Перезагружаю…`);
          setTimeout(() => location.reload(), 600);
        } catch (err) {
          setNote('Ошибка сканирования');
          btn.disabled = false;
        }
        return;
      }
      if (act === 'pick') {
        setNote('Выберите .exe…');
        try {
          const res = await fetch('/api/pick', { method: 'POST' }).then(r => r.json());
          if (!res.ok) { setNote(''); return; }
          dlg.exePath = res.exePath;
          dlg.cover = res.cover || '';
          form.hidden = false;
          saveRow.hidden = false;
          pathBox.textContent = res.exePath;
          coverBox.textContent = dlg.cover ? 'обложка найдена рядом с игрой' : 'не выбрана';
          nameInput.value = res.name || '';
          nameInput.focus();
          setNote('');
        } catch (err) {
          setNote('Ошибка выбора файла');
        }
        return;
      }
      if (act === 'cover') {
        try {
          const res = await fetch('/api/pick-cover', { method: 'POST' }).then(r => r.json());
          if (!res.ok) return;
          dlg.cover = res.file;
          coverBox.textContent = res.file;
        } catch (err) {}
        return;
      }
      if (act === 'save') {
        if (!dlg.exePath) return;
        setNote('Добавляю…');
        try {
          const res = await fetch('/api/custom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exePath: dlg.exePath, title: nameInput.value.trim(), cover: dlg.cover || null })
          }).then(r => r.json());
          if (!res.ok) { setNote(res.error || 'Ошибка'); return; }
          setNote('Готово. Перезагружаю…');
          setTimeout(() => location.reload(), 600);
        } catch (err) {
          setNote('Ошибка добавления');
        }
      }
    });

    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', onEsc);
      }
    });
  }

  fab.addEventListener('click', openModal);

  if (injected && typeof toast === 'function') {
    toast(`Библиотека ПК: добавлено игр — ${injected}`, 'controller');
  }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
