const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const STEAM_CDN = 'https://cdn.cloudflare.steamstatic.com/steam/apps';

const BAD_EXE = /(^unins|^setup$|^vcredist|^dxsetup|^dxwebsetup|vc_redist|crashpad|crashreport|easyanticheat|battleye|unitycrashhandler|notificationhelper|^touchup|^oalinst|^steamerrorreporter|^steamservice|^python|^node\.exe|^7z|^ffmpeg)/i;
const SKIP_DIRS = /^(directx|_commonredist|redist|redistributables|support|tools|engine|thirdparty|third_party|dotnet|vcredist|installers?|__installer|docs?|manual)$/i;
const NON_GAME = /(steamworks common redistributables|steam linux runtime|proton|steam controller configs|steamworks shared|steamvr)/i;

function regQuery(key, value) {
  try {
    const out = execFileSync('reg', ['query', key, '/v', value], { encoding: 'utf8', windowsHide: true });
    const m = out.match(new RegExp(value + '\\s+REG_\\w+\\s+(.+)', 'i'));
    return m ? m[1].trim() : null;
  } catch (e) {
    return null;
  }
}

function steamRoot() {
  const candidates = [
    regQuery('HKCU\\Software\\Valve\\Steam', 'SteamPath'),
    regQuery('HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam', 'InstallPath'),
    regQuery('HKLM\\SOFTWARE\\Valve\\Steam', 'InstallPath'),
    'C:\\Program Files (x86)\\Steam',
    'C:\\Program Files\\Steam'
  ].filter(Boolean);
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'steamapps'))) return dir.replace(/\//g, '\\');
  }
  return null;
}

function libraryFolders(root) {
  const libs = [];
  const vdf = path.join(root, 'steamapps', 'libraryfolders.vdf');
  try {
    const text = fs.readFileSync(vdf, 'utf8');
    const re = /"path"\s+"([^"]+)"/g;
    let m;
    while ((m = re.exec(text))) libs.push(m[1].replace(/\\\\/g, '\\'));
  } catch (e) {}
  if (!libs.length) libs.push(root);
  return [...new Set(libs)].filter(p => fs.existsSync(path.join(p, 'steamapps')));
}

function parseAcf(text) {
  const map = {};
  const re = /"([^"]+)"\s+"([^"]*)"/g;
  let m;
  while ((m = re.exec(text))) {
    if (!(m[1] in map)) map[m[1]] = m[2];
  }
  return map;
}

function walkExes(dir, depth, out) {
  if (depth > 3) return;
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.test(ent.name)) continue;
      walkExes(full, depth + 1, out);
      continue;
    }
    if (!/\.exe$/i.test(ent.name)) continue;
    if (BAD_EXE.test(ent.name)) continue;
    try {
      const st = fs.statSync(full);
      if (st.size < 200 * 1024) continue;
      out.push({ exe: full, size: st.size, rel: path.relative(dir, full) });
    } catch (e) {}
  }
}

function pickExe(folder, title) {
  const out = [];
  walkExes(folder, 0, out);
  if (!out.length) return null;
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9а-я]+/gi, ' ').trim();
  const titleWords = norm(title).split(' ').filter(w => w.length > 2);
  const folderName = norm(path.basename(folder));
  const scored = out.map(c => {
    const base = norm(path.basename(c.exe, '.exe'));
    let score = 0;
    if (titleWords.some(w => base.includes(w))) score += 60;
    if (folderName.includes(base) || base.includes(folderName)) score += 25;
    if (/\\(binaries|win64|win32|bin|x64)\\/i.test(c.rel)) score += 10;
    score += Math.min(20, c.size / (60 * 1024 * 1024));
    return { ...c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].exe;
}

function httpGet(url, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout, headers: { 'User-Agent': 'PS5UI/1.0' } }, res => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

async function fetchCovers(appid, mediaDir) {
  const files = {
    cover: { name: appid + '-cover.jpg', url: STEAM_CDN + '/' + appid + '/library_600x900.jpg' },
    hero: { name: appid + '-hero.jpg', url: STEAM_CDN + '/' + appid + '/library_hero.jpg' },
    logo: { name: appid + '-logo.png', url: STEAM_CDN + '/' + appid + '/logo.png' }
  };
  const out = {};
  for (const key of Object.keys(files)) {
    const dest = path.join(mediaDir, files[key].name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1024) {
      out[key] = files[key].name;
      continue;
    }
    try {
      const buf = await httpGet(files[key].url);
      if (buf.length > 1024) {
        fs.writeFileSync(dest, buf);
        out[key] = files[key].name;
      }
    } catch (e) {}
  }
  return out;
}

function readCustom(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(data.custom) ? data.custom : [];
  } catch (e) {
    return [];
  }
}

function writeCustom(file, list) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ custom: list }, null, 2), 'utf8');
}

async function scanSteam(options) {
  const opts = options || {};
  const mediaDir = opts.mediaDir || null;
  const covers = opts.covers !== false;
  const root = steamRoot();
  const games = [];
  if (!root) return { steamPath: null, games };

  for (const lib of libraryFolders(root)) {
    const appsDir = path.join(lib, 'steamapps');
    const commonDir = path.join(appsDir, 'common');
    let manifests = [];
    try {
      manifests = fs.readdirSync(appsDir).filter(f => /^appmanifest_\d+\.acf$/i.test(f));
    } catch (e) {
      manifests = [];
    }

    for (const file of manifests) {
      let acf;
      try {
        acf = parseAcf(fs.readFileSync(path.join(appsDir, file), 'utf8'));
      } catch (e) {
        continue;
      }
      const appid = String(acf.appid || file.match(/_(\d+)\.acf/i)[1]);
      const name = acf.name || acf.installdir || 'Steam Game';
      if (NON_GAME.test(name)) continue;
      const installdir = acf.installdir || name;
      const folder = path.join(commonDir, installdir);
      if (!fs.existsSync(folder)) continue;
      const exePath = pickExe(folder, name);
      const sizeBytes = Number(acf.SizeOnDisk) || 0;
      let media = {};
      if (covers && mediaDir) media = await fetchCovers(appid, mediaDir);
      games.push({
        id: 'steam-' + appid,
        appid,
        title: name,
        folder,
        exePath,
        sizeGb: sizeBytes ? +(sizeBytes / 1073741824).toFixed(1) : null,
        cover: media.cover || null,
        hero: media.hero || media.cover || null,
        logo: media.logo || null,
        source: 'steam'
      });
    }

    let folders = [];
    try {
      folders = fs.readdirSync(commonDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
    } catch (e) {}
    for (const folderName of folders) {
      if (NON_GAME.test(folderName)) continue;
      const folder = path.join(commonDir, folderName);
      if (games.some(g => g.folder && path.resolve(g.folder) === path.resolve(folder))) continue;
      const exePath = pickExe(folder, folderName);
      if (!exePath) continue;
      games.push({
        id: 'steam-dir-' + folderName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        appid: null,
        title: folderName.replace(/[_-]+/g, ' ').trim(),
        folder,
        exePath,
        sizeGb: null,
        cover: null,
        hero: null,
        logo: null,
        source: 'steam'
      });
    }
  }

  return { steamPath: root, games };
}

module.exports = { scanSteam, steamRoot, readCustom, writeCustom, fetchCovers };
