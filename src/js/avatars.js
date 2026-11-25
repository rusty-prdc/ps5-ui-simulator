const AVATARS = [
  { id:'av-01', src:'assets/avatars/av-01.png', name:'Kratos', cat:'fantasy' },
  { id:'av-02', src:'assets/avatars/av-02.png', name:'Aloy', cat:'fantasy' },
  { id:'av-03', src:'assets/avatars/av-03.png', name:'Geralt', cat:'fantasy' },
  { id:'av-04', src:'assets/avatars/av-04.png', name:'Lara', cat:'fantasy' },
  { id:'av-05', src:'assets/avatars/av-05.png', name:'Jin', cat:'fantasy' },
  { id:'av-06', src:'assets/avatars/av-06.png', name:'Ellie', cat:'fantasy' },
  { id:'av-07', src:'assets/avatars/av-07.png', name:'Nathan', cat:'fantasy' },
  { id:'av-08', src:'assets/avatars/av-08.png', name:'Chloe', cat:'fantasy' },
  { id:'av-09', src:'assets/avatars/av-09.png', name:'Yuna', cat:'anime' },
  { id:'av-10', src:'assets/avatars/av-10.png', name:'Tifa', cat:'anime' },
  { id:'av-11', src:'assets/avatars/av-11.png', name:'Aerith', cat:'anime' },
  { id:'av-12', src:'assets/avatars/av-12.png', name:'2B', cat:'anime' },
  { id:'av-13', src:'assets/avatars/av-13.png', name:'Makoto', cat:'anime' },
  { id:'av-14', src:'assets/avatars/av-14.png', name:'Asuka', cat:'anime' },
  { id:'av-15', src:'assets/avatars/av-15.png', name:'Rei', cat:'anime' },
  { id:'av-16', src:'assets/avatars/av-16.png', name:'Sakura', cat:'anime' },
  { id:'av-17', src:'assets/avatars/av-17.png', name:'Astro', cat:'game' },
  { id:'av-18', src:'assets/avatars/av-18.png', name:'Mario', cat:'game' },
  { id:'av-19', src:'assets/avatars/av-19.png', name:'Link', cat:'game' },
  { id:'av-20', src:'assets/avatars/av-20.png', name:'Samus', cat:'game' },
  { id:'av-21', src:'assets/avatars/av-21.png', name:'Sonic', cat:'game' },
  { id:'av-22', src:'assets/avatars/av-22.png', name:'Kirby', cat:'game' },
  { id:'av-23', src:'assets/avatars/av-23.png', name:'R2-D2', cat:'game' },
  { id:'av-24', src:'assets/avatars/av-24.png', name:'C-3PO', cat:'game' },
  { id:'av-25', src:'assets/avatars/av-25.png', name:'Baymax', cat:'game' },
  { id:'av-26', src:'assets/avatars/av-26.png', name:'WALL-E', cat:'game' },
  { id:'av-27', src:'assets/avatars/av-27.png', name:'Optimus', cat:'game' },
  { id:'av-28', src:'assets/avatars/av-28.png', name:'RoboCop', cat:'game' },
  { id:'av-29', src:'assets/avatars/av-29.png', name:'Fox', cat:'animals' },
  { id:'av-30', src:'assets/avatars/av-30.png', name:'Panda', cat:'animals' },
  { id:'av-31', src:'assets/avatars/av-31.png', name:'Cat', cat:'animals' },
  { id:'av-32', src:'assets/avatars/av-32.png', name:'Wolf', cat:'animals' },
  { id:'av-33', src:'assets/avatars/av-33.png', name:'Owl', cat:'animals' },
  { id:'av-34', src:'assets/avatars/av-34.png', name:'Tiger', cat:'animals' },
  { id:'av-35', src:'assets/avatars/av-35.png', name:'Neon', cat:'abstract' },
  { id:'av-36', src:'assets/avatars/av-36.png', name:'Pulse', cat:'abstract' },
  { id:'av-37', src:'assets/avatars/av-37.png', name:'Prism', cat:'abstract' },
  { id:'av-38', src:'assets/avatars/av-38.png', name:'Orbit', cat:'abstract' },
  { id:'av-39', src:'assets/avatars/av-39.png', name:'Flux', cat:'abstract' },
  { id:'av-40', src:'assets/avatars/av-40.png', name:'Nova', cat:'minimal' },
  { id:'av-41', src:'assets/avatars/av-41.png', name:'Echo', cat:'minimal' },
  { id:'av-42', src:'assets/avatars/av-42.png', name:'Vega', cat:'minimal' },
  { id:'av-43', src:'assets/avatars/av-43.png', name:'Orion', cat:'minimal' },
  { id:'av-44', src:'assets/avatars/av-44.png', name:'Lyra', cat:'minimal' },
  { id:'av-45', src:'assets/avatars/av-45.png', name:'Kai', cat:'art' },
  { id:'av-46', src:'assets/avatars/av-46.png', name:'Mia', cat:'art' },
  { id:'av-47', src:'assets/avatars/av-47.png', name:'Leo', cat:'art' },
  { id:'av-48', src:'assets/avatars/av-48.png', name:'Zoe', cat:'art' },
  { id:'av-49', src:'assets/avatars/av-49.png', name:'Max', cat:'art' },
  { id:'av-50', src:'assets/avatars/av-50.png', name:'Ada', cat:'art' }
];

function avatarById(id) { return AVATARS.find(a => a.id === id) || null; }
function avatarSrc(user) {
  if (!user) return '';
  const v = user.avatar || user.id || '';
  if (v.startsWith('assets/')) return v;
  const a = avatarById(v);
  return a ? a.src : '';
}
function randomAvatar() { return AVATARS[Math.floor(Math.random() * AVATARS.length)].src; }
function avatarHTML(user, cls = 'avatar') {
  const src = avatarSrc(user);
  if (!src) return `<span class="${cls}">${(user && user.name ? user.name.charAt(0) : '')}</span>`;
  const url = (typeof assetUrl === 'function') ? assetUrl(src) : src;
  return `<span class="${cls} avatar--photo"><img src="${url}" alt=""></span>`;
}
