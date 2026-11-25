const LS_KEY = 'ps5os_state_v2';
const INITIAL_LIBRARY = ['gta6', 'gta','minecraft','fortnite','roblox','fc','spiderman2','gow','tlou2','cod','gt7','hogwarts','rdr2','cyberpunk','re4','astro'];

function defaultState() {
  return {
    user: {
      name: 'Stepa_', level: 24, status: 'online', online: 'В сети',
      avatar: randomAvatar(), theme: 'blue', color: ['#4f9bff', '#1a3fb0']
    },
    mode: 'games',
    gameOrder: [...INITIAL_LIBRARY],
    appOrder: APPS.map(a => a.id),
    favorites: ['gta', 'spiderman2', 'gow', 'rdr2', 'astro'],
    hidden: [],
    removed: [],
    folders: [
      { id: 'fold1', name: 'На вечер', games: ['gta', 'rdr2', 'cyberpunk'] },
      { id: 'fold2', name: 'Золотые трофеи', games: ['gow', 'spiderman2'] }
    ],
    balance: 15000,
    storeFavs: [],
    purchaseHistory: [],
    friends: defaultFriends(),
    friendFavs: ['lera', 'gleb'],
    chats: {},
    recentApps: ['youtube', 'spotify'],
    favApps: ['youtube', 'spotify', 'netflix'],
    settings: {
      resolution: 'auto', hdr: true, vrr: false, picture: 'fidelity',
      language: 'ru', name: 'Stepa_', online: 'В сети',
      notifications: true, downloadNotif: true, friendNotif: true, storeNotif: false,
      autoUpdate: true, standbyInternet: true,
      wifi: true, bluetooth: true, ctrlSpeaker: true,
      volume: 60, brightness: 100,
      restMode: true, clock12: false, screensaver: true,
      haptics: true
    },
    notificationRead: {}
  };
}

let _persist = true;
let state = (() => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.user && Array.isArray(parsed.gameOrder) && parsed.gameOrder.length) {
        const base = defaultState();
        parsed.settings = Object.assign({}, base.settings, parsed.settings || {});
        return Object.assign(base, parsed);
      }
    }
  } catch (e) { _persist = false; }
  return defaultState();
})();

(function migrate() {
  const base = defaultState();
  if (!Array.isArray(state.gameOrder)) state.gameOrder = [...INITIAL_LIBRARY];
  if (!state.gameOrder.includes('gta6')) state.gameOrder.unshift('gta6');
  if (!state.user || typeof state.user !== 'object') state.user = base.user;
  state.user = Object.assign({}, base.user, state.user);
  if (!state.user.avatar) state.user.avatar = randomAvatar();
  if (!state.user.status) state.user.status = 'online';
  if (!Number.isFinite(state.balance)) state.balance = 15000;
  if (!Array.isArray(state.storeFavs)) state.storeFavs = [];
  if (!Array.isArray(state.purchaseHistory)) state.purchaseHistory = [];
  if (!Array.isArray(state.friendFavs)) state.friendFavs = [];
  if (!state.chats || typeof state.chats !== 'object') state.chats = {};
  if (state.ui && state.ui.chat) state.chats = Object.assign({}, state.ui.chat, state.chats);
  if (!Array.isArray(state.recentApps)) state.recentApps = ['youtube', 'spotify'];
  if (!Array.isArray(state.favApps)) state.favApps = ['youtube', 'spotify', 'netflix'];
  if (!Array.isArray(state.friends) || state.friends.length < 15 || !state.friends[0].avatar) state.friends = base.friends;
  state.friends.forEach((f, i) => {
    if (!f.avatar) f.avatar = AVATARS[(i * 3 + 5) % AVATARS.length].src;
    if (!FRIEND_STATUS[f.status]) f.status = 'offline';
    f.statusText = FRIEND_STATUS[f.status].label;
    if (!Array.isArray(f.trophies) && typeof f.trophies !== 'number') f.trophies = 0;
  });
  state.appOrder = [...new Set([
    ...(state.appOrder || []).filter(id => APP_MAP[id]),
    ...APPS.map(a => a.id)
  ])];
  state.gameOrder = [...new Set([
    ...(state.gameOrder || []).filter(id => GAME_MAP[id]),
    ...INITIAL_LIBRARY.filter(id => !(state.gameOrder || []).includes(id))
  ])];
  state.removed = (state.removed || []).filter(id => state.gameOrder.includes(id));
  state.gameOrder.forEach(id => { const g = GAME_MAP[id]; if (g) g.installed = !state.removed.includes(id); });
  state.recentApps = state.recentApps.filter(id => APP_MAP[id]);
  state.favApps = state.favApps.filter(id => APP_MAP[id]);
})();

function save() {
  if (!_persist) return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
}

function getGame(id) { return GAME_MAP[id] || null; }
function getApp(id) { return APP_MAP[id] || null; }
function getFriend(id) { return state.friends.find(f => f.id === id) || null; }

function homeList() {
  return state.gameOrder.map(getGame).filter(Boolean)
    .filter(g => !state.hidden.includes(g.id) && !state.removed.includes(g.id));
}
function homeApps() {
  return state.appOrder.map(getApp).filter(Boolean);
}
function libList(filter) {
  return state.gameOrder.map(getGame).filter(Boolean);
}
function isFav(id) { return state.favorites.includes(id); }
function toggleFav(id) {
  if (isFav(id)) state.favorites = state.favorites.filter(x => x !== id);
  else state.favorites.push(id);
  save();
}
function isOwned(id) { return state.gameOrder.includes(id); }
function isInstalled(id) { return isOwned(id) && !state.removed.includes(id); }
function addToLibrary(id) {
  if (!GAME_MAP[id]) return false;
  const game = GAME_MAP[id];
  if (!state.gameOrder.includes(id)) state.gameOrder.push(id);
  if (!state.removed.includes(id)) state.removed.push(id);
  game.installed = false;
  save();
  return true;
}
function installGame(id) {
  const game = GAME_MAP[id];
  state.removed = state.removed.filter(x => x !== id);
  if (game) game.installed = true;
  save();
  return true;
}
function buyGame(id, price) {
  if (!GAME_MAP[id]) return { ok: false, reason: 'missing' };
  if (state.gameOrder.includes(id)) return { ok: false, reason: 'owned' };
  if (state.balance < price) return { ok: false, reason: 'funds' };
  state.balance -= price;
  addToLibrary(id);
  state.purchaseHistory = state.purchaseHistory || [];
  state.purchaseHistory.unshift({ id, price, at: Date.now() });
  state.purchaseHistory = state.purchaseHistory.slice(0, 50);
  return { ok: true };
}
function formatRub(n) {
  return Math.round(n || 0).toLocaleString('ru-RU') + ' ₽';
}
function readN(nId) {
  state.notificationRead[nId] = true; save();
}
function unreadCount() {
  return NOTIFICATIONS.filter(n => !state.notificationRead[n.id]).length;
}
function orderIndexOf(id) { return state.gameOrder.indexOf(id); }

window.STATE = {
  state, save, getGame, getApp, getFriend, homeList, homeApps, isFav, toggleFav,
  isOwned, isInstalled, addToLibrary, installGame, buyGame, formatRub
};
