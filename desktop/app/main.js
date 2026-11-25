const { app, BrowserWindow, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { scanSteam, readCustom, writeCustom, fetchCovers } = require('./scanner');
const { startServer } = require('./server');

app.setName('PS5 UI Simulator');
if (process.platform === 'win32') app.setAppUserModelId('os.xprodc.ps5ui');

const userData = app.getPath('userData');
const mediaDir = path.join(userData, 'media');
const libFile = path.join(userData, 'library.json');
const uiFile = path.join(__dirname, 'ui', 'index.html');

fs.mkdirSync(mediaDir, { recursive: true });

let win = null;
const cache = { steamPath: null, steamGames: [] };

function customList() {
  return readCustom(libFile);
}

function saveCustom(list) {
  writeCustom(libFile, list);
}

function library() {
  const out = [];
  for (const g of cache.steamGames) {
    if (!g.exePath) continue;
    out.push({
      id: g.id,
      kind: 'steam',
      appid: g.appid,
      title: g.title,
      cover: g.cover ? '/media/' + g.cover : null,
      hero: g.hero ? '/media/' + g.hero : null,
      logo: g.logo ? '/media/' + g.logo : null,
      sizeGb: g.sizeGb,
      exePath: g.exePath
    });
  }
  for (const c of customList()) {
    out.push({
      id: c.id,
      kind: 'custom',
      appid: null,
      title: c.title,
      cover: c.cover ? '/media/' + c.cover : null,
      hero: c.hero ? '/media/' + c.hero : null,
      logo: null,
      sizeGb: null,
      exePath: c.exePath
    });
  }
  return out;
}

const api = {
  library,
  state() {
    return { ok: true, steamPath: cache.steamPath, library: library() };
  },
  async scan() {
    const res = await scanSteam({ mediaDir, covers: true });
    cache.steamPath = res.steamPath;
    cache.steamGames = res.games;
    return { ok: true, steamPath: cache.steamPath, library: library() };
  },
  async pickExe() {
    const r = await dialog.showOpenDialog(win, {
      title: 'Выберите .exe игры',
      properties: ['openFile'],
      filters: [{ name: 'Исполняемые файлы', extensions: ['exe'] }]
    });
    if (r.canceled || !r.filePaths.length) return { ok: false, canceled: true };
    const exePath = r.filePaths[0];
    const name = path.basename(exePath, '.exe');
    const folder = path.dirname(exePath);
    const heroGuess = ['library_hero.jpg', 'header.jpg'].map(f => path.join(folder, f)).find(f => fs.existsSync(f));
    let cover = null;
    if (heroGuess) {
      cover = 'custom-' + crypto.createHash('sha1').update(exePath).digest('hex').slice(0, 10) + path.extname(heroGuess);
      fs.copyFileSync(heroGuess, path.join(mediaDir, cover));
    }
    return { ok: true, exePath, name, cover };
  },
  async pickCover() {
    const r = await dialog.showOpenDialog(win, {
      title: 'Выберите обложку',
      properties: ['openFile'],
      filters: [{ name: 'Изображения', extensions: ['jpg', 'jpeg', 'png', 'webp'] }]
    });
    if (r.canceled || !r.filePaths.length) return { ok: false, canceled: true };
    const src = r.filePaths[0];
    const file = 'custom-' + Date.now().toString(36) + path.extname(src).toLowerCase();
    fs.copyFileSync(src, path.join(mediaDir, file));
    return { ok: true, file };
  },
  addCustom(body) {
    const exePath = String(body.exePath || '');
    if (!exePath || !fs.existsSync(exePath)) return { ok: false, error: 'Файл не найден' };
    const title = String(body.title || path.basename(exePath, '.exe')).trim() || path.basename(exePath, '.exe');
    const id = 'custom-' + crypto.createHash('sha1').update(exePath.toLowerCase()).digest('hex').slice(0, 10);
    const list = customList().filter(c => c.id !== id);
    list.unshift({ id, title, exePath, cover: body.cover || null, addedAt: Date.now() });
    saveCustom(list);
    return { ok: true, id, library: library() };
  },
  removeCustom(body) {
    const id = String(body.id || '');
    const list = customList().filter(c => c.id !== id);
    saveCustom(list);
    return { ok: true, library: library() };
  },
  launch(body) {
    const item = library().find(g => g.id === body.id) || library().find(g => g.exePath === body.exePath);
    if (!item) return { ok: false, error: 'Игра не найдена' };
    if (!fs.existsSync(item.exePath)) return { ok: false, error: 'Файл игры не найден: ' + item.exePath };
    try {
      const child = spawn(item.exePath, [], {
        detached: true,
        stdio: 'ignore',
        cwd: path.dirname(item.exePath),
        windowsHide: false
      });
      child.on('error', e => {
        dialog.showErrorBox('Не удалось запустить игру', String(e && e.message || e));
      });
      child.unref();
      return { ok: true, title: item.title, exePath: item.exePath };
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  }
};

async function createWindow() {
  await api.scan();
  const { port } = await startServer({ uiFile, mediaDir, api, port: Number(process.env.PS5UI_PORT) || 0 });
  console.log('PS5UI listening on http://127.0.0.1:' + port);
  win = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1100,
    minHeight: 680,
    backgroundColor: '#04060c',
    autoHideMenuBar: true,
    title: 'PS5 UI Simulator',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
  });
  win.loadURL('http://127.0.0.1:' + port + '/');
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}
