const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', '..', 'ps5-os.html');
const destDir = path.join(__dirname, '..', 'app', 'ui');
const dest = path.join(destDir, 'index.html');

if (!fs.existsSync(src)) {
  console.error('Не найден ps5-os.html рядом с папкой desktop');
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
const kb = Math.round(fs.statSync(dest).size / 1024);
console.log('UI скопирован: app/ui/index.html (' + kb + ' КБ)');
