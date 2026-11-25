const FRIENDS_DATA = [
  { id:'artem', name:'Artem_Pro', level:32, status:'online', statusText:'В сети', activity:'Играет в Marvel’s Spider-Man 2', game:'Marvel’s Spider-Man 2', trophies:148, avatar:'assets/avatars/av-02.png' },
  { id:'ksenia', name:'Ksenia_Star', level:27, status:'online', statusText:'В сети', activity:'Играет в Fortnite', game:'Fortnite', trophies:96, avatar:'assets/avatars/av-09.png' },
  { id:'dimka', name:'Dimka_777', level:19, status:'dnd', statusText:'Не беспокоить', activity:'Играет в EA SPORTS FC 26', game:'EA SPORTS FC 26', trophies:54, avatar:'assets/avatars/av-17.png' },
  { id:'lera', name:'LeraFox', level:41, status:'online', statusText:'В сети', activity:'Играет в Hogwarts Legacy', game:'Hogwarts Legacy', trophies:220, avatar:'assets/avatars/av-10.png' },
  { id:'nikita', name:'Nikita_Play', level:22, status:'offline', statusText:'Не в сети', activity:'Был в сети 2 ч назад', game:'', trophies:61, avatar:'assets/avatars/av-23.png' },
  { id:'sonya', name:'Sonya_Moon', level:35, status:'busy', statusText:'Занят', activity:'Играет в The Last of Us Part II', game:'The Last of Us Part II', trophies:175, avatar:'assets/avatars/av-12.png' },
  { id:'max', name:'MaxPower', level:16, status:'offline', statusText:'Не в сети', activity:'Был в сети вчера', game:'', trophies:38, avatar:'assets/avatars/av-18.png' },
  { id:'ilya', name:'Ilya_Wolf', level:29, status:'online', statusText:'В сети', activity:'Играет в Elden Ring', game:'Elden Ring', trophies:132, avatar:'assets/avatars/av-31.png' },
  { id:'masha', name:'Masha_Neon', level:24, status:'dnd', statusText:'Не беспокоить', activity:'Играет в Cyberpunk 2077', game:'Cyberpunk 2077', trophies:77, avatar:'assets/avatars/av-36.png' },
  { id:'gleb', name:'Gleb_Racer', level:38, status:'online', statusText:'В сети', activity:'Играет в Gran Turismo 7', game:'Gran Turismo 7', trophies:201, avatar:'assets/avatars/av-20.png' },
  { id:'anna', name:'Anna_Art', level:21, status:'offline', statusText:'Не в сети', activity:'Была в сети вчера', game:'', trophies:44, avatar:'assets/avatars/av-46.png' },
  { id:'oleg', name:'Oleg_Boss', level:44, status:'busy', statusText:'Занят', activity:'Играет в Red Dead Redemption 2', game:'Red Dead Redemption 2', trophies:310, avatar:'assets/avatars/av-04.png' },
  { id:'vika', name:'Vika_Star', level:26, status:'online', statusText:'В сети', activity:'Играет в Fortnite', game:'Fortnite', trophies:88, avatar:'assets/avatars/av-14.png' },
  { id:'roma', name:'Roma_King', level:31, status:'offline', statusText:'Не в сети', activity:'Был в сети 5 ч назад', game:'', trophies:119, avatar:'assets/avatars/av-27.png' },
  { id:'dima', name:'Dima_Shadow', level:20, status:'offline', statusText:'Не в сети', activity:'Был в сети 3 дня назад', game:'', trophies:29, avatar:'assets/avatars/av-33.png' },
  { id:'sasha', name:'Sasha_Blade', level:28, status:'online', statusText:'В сети', activity:'Играет в Stellar Blade', game:'Stellar Blade', trophies:102, avatar:'assets/avatars/av-11.png', candidate:true },
  { id:'nadya', name:'Nadya_Fox', level:23, status:'online', statusText:'В сети', activity:'Играет в Hogwarts Legacy', game:'Hogwarts Legacy', trophies:67, avatar:'assets/avatars/av-30.png', candidate:true },
  { id:'kostya', name:'Kostya_Pro', level:36, status:'offline', statusText:'Не в сети', activity:'Был в сети 4 ч назад', game:'', trophies:154, avatar:'assets/avatars/av-06.png', candidate:true },
  { id:'alina', name:'Alina_Moon', level:25, status:'online', statusText:'В сети', activity:'Играет в Astro Bot', game:'Astro Bot', trophies:71, avatar:'assets/avatars/av-15.png', candidate:true },
  { id:'timur', name:'Timur_Zero', level:30, status:'dnd', statusText:'Не беспокоить', activity:'Играет в Cyberpunk 2077', game:'Cyberpunk 2077', trophies:93, avatar:'assets/avatars/av-39.png', candidate:true }
];

const FRIEND_STATUS = {
  online: { label:'В сети', color:'#4ad6a0' },
  offline:{ label:'Не в сети', color:'#70798c' },
  dnd:    { label:'Не беспокоить', color:'#ff5c72' },
  busy:   { label:'Занят', color:'#ffb74a' }
};

function defaultFriends() { return FRIENDS_DATA.filter(f => !f.candidate).map(f => ({ ...f })); }
function friendCandidates() { return FRIENDS_DATA.filter(f => f.candidate); }
