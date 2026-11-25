const http = require('http');
const fs = require('fs');
const path = require('path');

function readBody(req) {
  return new Promise(resolve => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve({}); }
    });
  });
}

function sendJson(res, code, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function startServer(opts) {
  const uiFile = opts.uiFile;
  const mediaDir = opts.mediaDir;
  const api = opts.api;

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const p = decodeURIComponent(url.pathname);

    try {
      if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
        let html = fs.readFileSync(uiFile, 'utf8');
        const library = api.library();
        const inject = '<script>window.__PS5_DESKTOP__=true;window.__PS5_DESKTOP_LIBRARY__=' + JSON.stringify(library) + ';</script>';
        const marker = '<script src="js/icons.js"></script>';
        html = html.includes(marker) ? html.replace(marker, inject + '\n' + marker) : html.replace('</head>', inject + '</head>');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(html);
        return;
      }

      if (req.method === 'GET' && p.startsWith('/media/')) {
        const name = path.basename(p.slice('/media/'.length));
        const file = path.join(mediaDir, name);
        if (!fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
        const ext = path.extname(file).toLowerCase();
        const types = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon' };
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=86400' });
        fs.createReadStream(file).pipe(res);
        return;
      }

      if (p === '/api/state' && req.method === 'GET') {
        sendJson(res, 200, api.state());
        return;
      }
      if (p === '/api/scan' && req.method === 'POST') {
        sendJson(res, 200, await api.scan());
        return;
      }
      if (p === '/api/pick' && req.method === 'POST') {
        sendJson(res, 200, await api.pickExe());
        return;
      }
      if (p === '/api/pick-cover' && req.method === 'POST') {
        sendJson(res, 200, await api.pickCover());
        return;
      }
      if (p === '/api/custom' && req.method === 'POST') {
        const body = await readBody(req);
        sendJson(res, 200, api.addCustom(body));
        return;
      }
      if (p === '/api/custom/remove' && req.method === 'POST') {
        const body = await readBody(req);
        sendJson(res, 200, api.removeCustom(body));
        return;
      }
      if (p === '/api/launch' && req.method === 'POST') {
        const body = await readBody(req);
        sendJson(res, 200, api.launch(body));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('not found');
    } catch (e) {
      sendJson(res, 500, { ok: false, error: String(e && e.message || e) });
    }
  });

  return new Promise(resolve => {
    server.listen(opts.port || 0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

module.exports = { startServer };
