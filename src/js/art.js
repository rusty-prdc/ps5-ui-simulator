const PATTERNS = ['sun','blocks','storm','pitch','web','runes','moss','tactical','speed','magic','west','neon','blood','bubbles'];

const GAME_ART = {
  gta:        { cover:'assets/covers/gta.jpg',        hero:'assets/heroes/gta.jpg',        logo:'assets/logos/rockstar.svg' },
  minecraft:  { cover:'assets/covers/minecraft.jpg',  hero:'assets/heroes/minecraft.jpg',  logo:'assets/logos/mojang.svg' },
  fortnite:   { cover:'assets/covers/fortnite.jpg',   hero:'assets/heroes/fortnite.jpg',   logo:'assets/logos/epic.svg' },
  roblox:     { cover:'assets/covers/roblox.jpg',     hero:'assets/heroes/roblox.jpg',     logo:'assets/logos/roblox.svg' },
  fc:         { cover:'assets/covers/fc.jpg',         hero:'assets/heroes/fc.jpg',         logo:'assets/logos/easports.svg' },
  spiderman2: { cover:'assets/covers/spiderman2.jpg', hero:'assets/heroes/spiderman2.jpg', logo:'assets/logos/insomniac.png' },
  gow:        { cover:'assets/covers/gow.jpg',        hero:'assets/heroes/gow.jpg',        logo:'assets/logos/santamonica.svg' },
  tlou2:      { cover:'assets/covers/tlou2.jpg',      hero:'assets/heroes/tlou2.jpg',      logo:'assets/logos/naughtydog.png' },
  cod:        { cover:'assets/covers/cod.jpg',        hero:'assets/heroes/cod.jpg',        logo:'assets/logos/activision.svg' },
  gt7:        { cover:'assets/covers/gt7.jpg',        hero:'assets/heroes/gt7.jpg',        logo:'assets/logos/polyphony.png' },
  hogwarts:   { cover:'assets/covers/hogwarts.jpg',   hero:'assets/heroes/hogwarts.jpg',   logo:'assets/logos/wbgames.svg' },
  rdr2:       { cover:'assets/covers/rdr2.jpg',       hero:'assets/heroes/rdr2.jpg',       logo:'assets/logos/rockstar.svg' },
  cyberpunk:  { cover:'assets/covers/cyberpunk.jpg',  hero:'assets/heroes/cyberpunk.jpg',  logo:'assets/logos/cdpr.svg' },
  re4:        { cover:'assets/covers/re4.jpg',        hero:'assets/heroes/re4.jpg',        logo:'assets/logos/capcom.png' },
  astro:      { cover:'assets/covers/astro.jpg',      hero:'assets/heroes/astro.jpg',      logo:'assets/logos/teamasobi.svg' }
};
GAMES.forEach(g => Object.assign(g, GAME_ART[g.id] || {}));

function artOf(item) {
  if (item.art) return item.art;
  return {
    c1: item.c1 || '#4f9bff',
    c2: item.c2 || '#1a3fb0',
    c3: item.c3 || '#081020',
    pat: 'blocks',
    glyph: (item.glyph || item.title || '?').replace(/[^A-Za-zА-Яа-я0-9]/g, '').slice(0, 3).toUpperCase()
  };
}

function assetUrl(src) {
  if (!src) return '';
  return (typeof ASSET_INLINE !== 'undefined' && ASSET_INLINE[src]) ? ASSET_INLINE[src] : src;
}

function coverArt(item, opts = {}) {
  const a = artOf(item);
  const isHero = !!opts.hero;
  const src = assetUrl(isHero ? (item.hero || item.cover || '') : (item.cover || ''));
  const cls = `cover${isHero ? ' cover--hero' : ''}${opts.compact ? ' cover--compact' : ''}`;
  const meta = (opts.plain || isHero) ? '' : `<div class="cover__meta">
      <span class="cover__studio">${item.studio || ''}</span>
      <span class="cover__title">${item.title || ''}</span>
    </div>`;
  if (!src && item.logo) {
    return `<div class="${cls} cover--brand" style="--c1:${a.c1};--c2:${a.c2};--c3:${a.c3}">
      <div class="cover__brandbg"></div>
      <img class="cover__brandlogo" src="${assetUrl(item.logo)}" alt="">
      <div class="cover__scrim"></div>
      ${meta}
    </div>`;
  }
  return `<div class="${cls}" style="--c1:${a.c1};--c2:${a.c2};--c3:${a.c3}">
    ${src ? `<img class="cover__img" src="${src}" alt="" ${isHero ? 'loading="eager"' : 'loading="lazy"'} decoding="async" draggable="false">` : ''}
    <div class="cover__scrim"></div>
    ${meta}
  </div>`;
}

function appArt(app) {
  if (app.logo) {
    return `<div class="appart appart--brand" style="--c1:${app.c1 || '#2f7df6'};--c2:${app.c2 || '#081020'}" aria-hidden="true">
      <div class="appart__wash"></div>
      <img class="appart__brand" src="${assetUrl(app.logo)}" alt="">
      <div class="appart__sheen"></div>
    </div>`;
  }
  const glyph = (app.title || '?').replace(/[^A-Za-zА-Яа-я0-9+]/g, '').slice(0, 2).toUpperCase();
  return `<div class="appart" style="--c1:${app.c1};--c2:${app.c2}" aria-hidden="true">
    <div class="appart__wash"></div>
    <div class="appart__glyph">${glyph}</div>
    <div class="appart__sheen"></div>
  </div>`;
}

function setAmbient(item) {
  const a = artOf(item);
  const amb = document.getElementById('ambient');
  if (!amb) return;
  const layers = amb.querySelectorAll('.ambient__layer');
  const next = layers[1].classList.contains('is-on') ? layers[0] : layers[1];
  const prev = next === layers[0] ? layers[1] : layers[0];
  next.style.setProperty('--amb-a', shade(a.c3, -0.25));
  next.style.setProperty('--amb-b', a.c2);
  next.style.setProperty('--amb-c', a.c1);
  next.style.setProperty('--amb-d', shade(a.c3, -0.55));
  next.classList.add('is-on');
  prev.classList.remove('is-on');
  document.documentElement.style.setProperty('--accent-live', item.accent || a.c1);
  amb.dataset.pattern = a.pat || 'blocks';
}

function shade(hex, amt) {
  if (!hex || hex[0] !== '#') return '#081020';
  let c = hex.slice(1);
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  let r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  if (amt < 0) { r = Math.round(r * (1 + amt)); g = Math.round(g * (1 + amt)); b = Math.round(b * (1 + amt)); }
  else { r = Math.round(r + (255 - r) * amt); g = Math.round(g + (255 - g) * amt); b = Math.round(b + (255 - b) * amt); }
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

function coverColor(item) {
  const a = artOf(item);
  return { a: a.c1, b: a.c2, c: a.c3 };
}
