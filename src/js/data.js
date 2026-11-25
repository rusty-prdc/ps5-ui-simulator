const GAMES = [
  {
    id:'gta', title:'Grand Theft Auto V', sub:'PlayStation 5 Edition', studio:'Rockstar North', publisher:'Rockstar Games',
    genre:'Экшен · Открытый мир', year:2022, size:98.4, version:'1.064', rating:4.8,
    lastPlayed:'Сегодня, 21:14', lastShort:'сегодня', playtime:'184 ч', progress:68, installed:true, fav:true,
    trophies:{have:38, total:77}, price:2999, discount:40,
    desc:'Лос-Сантос — город, который не заканчивается. Три героя, три взгляда на один мегаполис и свобода решать, чем закончится очередная история. На PS5 игра получила режим производительности, поддержку HDR и расширенную дальность прорисовки.',
    features:['4K · HDR','60 FPS','DualSense','Быстрая загрузка'],
    art:{ c1:'#ffb057', c2:'#a92b62', c3:'#180a2c', pat:'sun', glyph:'V' }, accent:'#ff9a4d'
  },
  {
    id:'minecraft', title:'Minecraft', sub:'Bedrock Edition', studio:'Mojang Studios', publisher:'Xbox Game Studios',
    genre:'Песочница · Выживание', year:2024, size:2.8, version:'1.21.4', rating:4.7,
    lastPlayed:'Вчера, 19:02', lastShort:'вчера', playtime:'312 ч', progress:44, installed:true, fav:false,
    trophies:{have:71, total:125}, price:1899, discount:0,
    desc:'Мир из кубов, в котором нет заданного сценария. Стройте, исследуйте, добывайте ресурсы и создавайте собственные правила — в одиночку или вместе с друзьями по сети. На PS5 поддерживаются большие миры и кроссплей.',
    features:['Кроссплей','Творческий режим','DualSense','4K'],
    art:{ c1:'#8fe06a', c2:'#2c7a4b', c3:'#0a2418', pat:'blocks', glyph:'MC' }, accent:'#6ed36e'
  },
  {
    id:'fortnite', title:'Fortnite', sub:'Глава 6 · Сезон 3', studio:'Epic Games', publisher:'Epic Games',
    genre:'Battle Royale · Шутер', year:2025, size:46.2, version:'34.10', rating:4.4,
    lastPlayed:'Сегодня, 18:37', lastShort:'сегодня', playtime:'96 ч', progress:52, installed:true, fav:true,
    trophies:{have:22, total:64}, price:0, discount:0,
    desc:'Сто игроков, одна карта и множество способов добраться до победы. Стройте укрытия, собирайте отряд и меняйте правила боя каждую минуту. Кроссплатформенный прогресс сохраняется между устройствами.',
    features:['Кроссплей','120 FPS','DualSense','Сезонные события'],
    art:{ c1:'#8f7bff', c2:'#2f5bff', c3:'#120a3c', pat:'storm', glyph:'FN' }, accent:'#7b6bff'
  },
  {
    id:'roblox', title:'Roblox', sub:'Бесконечная платформа', studio:'Roblox Corporation', publisher:'Roblox Corporation',
    genre:'Платформа · UGC', year:2025, size:1.4, version:'0.674', rating:4.2,
    lastPlayed:'2 дня назад', lastShort:'2 дня назад', playtime:'58 ч', progress:31, installed:true, fav:false,
    trophies:{have:9, total:40}, price:0, discount:0,
    desc:'Тысячи миров, созданных игроками: гонки, хорроры, симуляторы и целые города. Roblox — это платформа, где каждая ссылка ведёт в новое приключение, а прогресс привязан к аккаунту.',
    features:['UGC-миры','Кроссплей','Социальное','4K'],
    art:{ c1:'#ff5a5a', c2:'#a51f33', c3:'#17060c', pat:'blocks', glyph:'RB' }, accent:'#ff5151'
  },
  {
    id:'fc', title:'EA SPORTS FC 25', sub:'Standard Edition', studio:'EA Vancouver', publisher:'Electronic Arts',
    genre:'Спорт · Футбол', year:2024, size:58.9, version:'1.108', rating:4.3,
    lastPlayed:'Позавчера, 22:10', lastShort:'позавчера', playtime:'124 ч', progress:73, installed:true, fav:false,
    trophies:{have:31, total:58}, price:3999, discount:35,
    desc:'Полный контроль над каждым эпизодом матча: тактика, роли игроков и новые способы строить атаку. Ultimate Team, карьера и сетевые режимы собраны в одном футбольном хабе.',
    features:['HDR','60 FPS','DualSense','Сетевые режимы'],
    art:{ c1:'#57ffb0', c2:'#0b7d58', c3:'#03150f', pat:'pitch', glyph:'FC' }, accent:'#3be39a'
  },
  {
    id:'spiderman2', title:"Marvel's Spider-Man 2", sub:'Digital Deluxe', studio:'Insomniac Games', publisher:'Sony Interactive Entertainment',
    genre:'Экшен · Приключение', year:2023, size:98.1, version:'1.012', rating:4.9,
    lastPlayed:'Сегодня, 20:48', lastShort:'сегодня', playtime:'41 ч', progress:86, installed:true, fav:true,
    trophies:{have:42, total:71}, price:4499, discount:20,
    desc:'Питер Паркер и Майлз Моралес снова в Нью-Йорке — теперь против Венома и охотников Крейвена. Город стал больше, полёты на паутине быстрее, а переключение между героями меняет ритм боя.',
    features:['4K · HDR','60 FPS','DualSense','Трассировка'],
    art:{ c1:'#ff4a40', c2:'#8c0f22', c3:'#0a0e1c', pat:'web', glyph:'SM2' }, accent:'#ff3f3a'
  },
  {
    id:'gow', title:'God of War Ragnarök', sub:'PS5', studio:'Santa Monica Studio', publisher:'Sony Interactive Entertainment',
    genre:'Экшен · Мифология', year:2022, size:84.6, version:'1.041', rating:4.9,
    lastPlayed:'3 дня назад', lastShort:'3 дня назад', playtime:'63 ч', progress:58, installed:true, fav:true,
    trophies:{have:29, total:63}, price:4299, discount:30,
    desc:'Кратос и Атрей идут через Девять миров, пока пророчество о Рагнарёке набирает силу. Суровые бои, северные мифы и дорога, на которой каждое решение имеет вес.',
    features:['4K · HDR','60 FPS','DualSense','Режим производительности'],
    art:{ c1:'#a8dcff', c2:'#2a6a9e', c3:'#040c1a', pat:'runes', glyph:'GOW' }, accent:'#7ec8ff'
  },
  {
    id:'tlou2', title:'The Last of Us Part II', sub:'Remastered', studio:'Naughty Dog', publisher:'Sony Interactive Entertainment',
    genre:'Экшен · Драма', year:2023, size:76.3, version:'1.022', rating:4.8,
    lastPlayed:'Неделю назад', lastShort:'неделю назад', playtime:'37 ч', progress:64, installed:true, fav:false,
    trophies:{have:24, total:46}, price:3999, discount:25,
    desc:'История о мести, прощении и цене выживания в мире, который давно перестал быть прежним. Remastered-версия добавляет режим выживания, гитару и улучшенную производительность.',
    features:['4K · HDR','60 FPS','DualSense','Режим No Return'],
    art:{ c1:'#b9c7a2', c2:'#3c5342', c3:'#0c120d', pat:'moss', glyph:'II' }, accent:'#9db38c'
  },
  {
    id:'cod', title:'Call of Duty', sub:'Modern Warfare III', studio:'Sledgehammer Games', publisher:'Activision',
    genre:'Шутер · Мультиплеер', year:2023, size:142.8, version:'10.4', rating:4.1,
    lastPlayed:'Вчера, 23:41', lastShort:'вчера', playtime:'156 ч', progress:49, installed:true, fav:false,
    trophies:{have:33, total:76}, price:4699, discount:0,
    desc:'Кампания, мультиплеер и зомби-режим в одном пакете. Быстрые перестрелки, прокачка оружия и карты, которые меняются вместе с сезоном. На PS5 — 120 Гц и адаптивные триггеры.',
    features:['120 FPS','HDR','DualSense','Кроссплей'],
    art:{ c1:'#d9c48e', c2:'#5c5236', c3:'#101009', pat:'tactical', glyph:'COD' }, accent:'#c8ae72'
  },
  {
    id:'gt7', title:'Gran Turismo 7', sub:'25th Anniversary', studio:'Polyphony Digital', publisher:'Sony Interactive Entertainment',
    genre:'Гонки · Симулятор', year:2022, size:110.5, version:'1.52', rating:4.6,
    lastPlayed:'4 дня назад', lastShort:'4 дня назад', playtime:'88 ч', progress:61, installed:true, fav:false,
    trophies:{have:26, total:81}, price:4999, discount:20,
    desc:'Трассы, которые ощущаются каждой кочкой, и машины, собранные с любовью к деталям. Кафе, лицензии, тюнинг и гонки Sport — от первой поездки до профессиональной лиги.',
    features:['4K · HDR','60 FPS','DualSense','VR-совместимо'],
    art:{ c1:'#7fd0ff', c2:'#0b3f8f', c3:'#02081a', pat:'speed', glyph:'GT7' }, accent:'#49b4ff'
  },
  {
    id:'hogwarts', title:'Hogwarts Legacy', sub:'PS5', studio:'Avalanche Software', publisher:'Warner Bros. Games',
    genre:'RPG · Открытый мир', year:2023, size:87.2, version:'1.09', rating:4.5,
    lastPlayed:'5 дней назад', lastShort:'5 дней назад', playtime:'52 ч', progress:47, installed:true, fav:false,
    trophies:{have:21, total:46}, price:4599, discount:40,
    desc:'Хогвартс в XIX веке: собственные заклинания, комнаты, друзья и тайны, которые не стоит тревожить. Исследуйте школу и окрестности, собирайте зелья и выбирайте, на чьей стороне остаться.',
    features:['4K · HDR','60 FPS','DualSense','Открытый мир'],
    art:{ c1:'#f3d98b', c2:'#5a3d8f', c3:'#100a22', pat:'magic', glyph:'HL' }, accent:'#d9b968'
  },
  {
    id:'rdr2', title:'Red Dead Redemption 2', sub:'PS4 · Обратная совместимость', studio:'Rockstar Studios', publisher:'Rockstar Games',
    genre:'Экшен · Вестерн', year:2018, size:116.4, version:'1.32', rating:4.9,
    lastPlayed:'Неделю назад', lastShort:'неделю назад', playtime:'203 ч', progress:79, installed:true, fav:true,
    trophies:{have:34, total:52}, price:3499, discount:50,
    desc:'Эпоха Дикого Запада уходит, а банда Ван дер Линде пытается удержаться на краю. Охота, лагерь, поезда и снежные перевалы — история, в которой важна каждая остановка.',
    features:['4K','HDR','30 FPS','Онлайн-режим'],
    art:{ c1:'#f08a5e', c2:'#7d2a22', c3:'#1a0a06', pat:'west', glyph:'RDR2' }, accent:'#e2794f'
  },
  {
    id:'cyberpunk', title:'Cyberpunk 2077', sub:'Ultimate Edition', studio:'CD Projekt Red', publisher:'CD Projekt',
    genre:'RPG · Киберпанк', year:2023, size:72.9, version:'2.21', rating:4.7,
    lastPlayed:'2 недели назад', lastShort:'2 недели назад', playtime:'91 ч', progress:56, installed:true, fav:false,
    trophies:{have:27, total:57}, price:3999, discount:45,
    desc:'Найт-Сити сверкает неоном и обещает свободу — за определённую цену. Соберите импланты, найдите свой стиль боя и решите, кем станет V в городе, где корпорации не спят.',
    features:['4K · HDR','60 FPS','DualSense','Phantom Liberty'],
    art:{ c1:'#f8ea5a', c2:'#12c4d8', c3:'#120a2c', pat:'neon', glyph:'CP77' }, accent:'#f2df4c'
  },
  {
    id:'re4', title:'Resident Evil 4', sub:'Remake', studio:'Capcom', publisher:'Capcom',
    genre:'Хоррор · Выживание', year:2023, size:54.7, version:'1.410', rating:4.8,
    lastPlayed:'3 недели назад', lastShort:'3 недели назад', playtime:'33 ч', progress:38, installed:true, fav:false,
    trophies:{have:16, total:46}, price:3599, discount:30,
    desc:'Леон Кеннеди отправляется в деревню, где всё идёт не по плану. Ремастер сохраняет напряжение оригинала и добавляет современное управление, нож и режим Mercenaries.',
    features:['4K · HDR','60 FPS','DualSense','VR-режим'],
    art:{ c1:'#e0453f', c2:'#4c0a12', c3:'#050203', pat:'blood', glyph:'RE4' }, accent:'#d93b38'
  },
  {
    id:'astro', title:'Astro Bot', sub:'PS5', studio:'Team Asobi', publisher:'Sony Interactive Entertainment',
    genre:'Платформер · Приключение', year:2024, size:34.2, version:'1.008', rating:4.9,
    lastPlayed:'Сегодня, 16:05', lastShort:'сегодня', playtime:'19 ч', progress:92, installed:true, fav:true,
    trophies:{have:38, total:44}, price:4199, discount:0,
    desc:'Астро отправляется спасать потерянных ботов по галактике из десятков миров. Каждый уровень — новая механика, а DualSense превращает происходящее в маленький аттракцион.',
    features:['4K · HDR','60 FPS','DualSense','Семейная игра'],
    art:{ c1:'#f2f8ff', c2:'#6fb8ff', c3:'#123a6e', pat:'bubbles', glyph:'AB' }, accent:'#8cc6ff'
  }
];

const GAME_MAP = Object.fromEntries(GAMES.map(g => [g.id, g]));

const APPS = [
  { id:'youtube', title:'YouTube', kind:'video', c1:'#ff4d4d', c2:'#8b0f14', tag:'Видео и стримы', desc:'Ролики, музыка, трансляции и подкасты на большом экране.' },
  { id:'netflix', title:'Netflix', kind:'video', c1:'#e50914', c2:'#420207', tag:'Фильмы и сериалы', desc:'Оригинальные сериалы, фильмы и документальные проекты.' },
  { id:'spotify', title:'Spotify', kind:'music', c1:'#1ed760', c2:'#075c2c', tag:'Музыка', desc:'Плейлисты, альбомы и подкасты без ограничений.' },
  { id:'twitch', title:'Twitch', kind:'stream', c1:'#9146ff', c2:'#3a1378', tag:'Стримы', desc:'Прямые трансляции игр, турниров и общения.' },
  { id:'disney', title:'Disney+', kind:'video', c1:'#1f5bff', c2:'#0a1a5c', tag:'Фильмы и сериалы', desc:'Классика, Marvel, Star Wars и новые оригиналы.' },
  { id:'prime', title:'Prime Video', kind:'video', c1:'#33c4ff', c2:'#053a5c', tag:'Фильмы и сериалы', desc:'Кино, сериалы и спортивные трансляции.' },
  { id:'appletv', title:'Apple TV+', kind:'video', c1:'#f4f4f7', c2:'#3a3a44', tag:'Оригиналы', desc:'Оригинальные фильмы и сериалы Apple.' },
  { id:'crunchyroll', title:'Crunchyroll', kind:'video', c1:'#f78b2e', c2:'#6b2a08', tag:'Аниме', desc:'Симулкаст аниме и манга в одном месте.' },
  { id:'plex', title:'Plex', kind:'media', c1:'#e9b949', c2:'#4c3508', tag:'Медиасервер', desc:'Ваша домашняя библиотека фильмов, музыки и фото.' },
  { id:'vlc', title:'VLC', kind:'media', c1:'#ff8a1f', c2:'#5a2a04', tag:'Медиаплеер', desc:'Воспроизведение локальных видео и аудиофайлов.' },
  { id:'browser', title:'Браузер', kind:'browser', c1:'#4d8cff', c2:'#10275c', tag:'Интернет', desc:'Веб-браузер PS5 с вкладками и закладками.' },
  { id:'media', title:'Медиаплеер', kind:'media', c1:'#9aa7bd', c2:'#2a3242', tag:'Медиа', desc:'Фото, видео и музыка с USB-накопителя.' }
];
const APP_MAP = Object.fromEntries(APPS.map(a => [a.id, a]));

const FRIENDS = [
  { id:'artem', name:'Artem_Pro', level:32, status:'online', text:'В сети', game:'Marvel\'s Spider-Man 2', color:['#4f9bff','#1a3fb0'], msg:'Го в кооператив вечером?' },
  { id:'ksenia', name:'Ksenia_Star', level:27, status:'online', text:'В сети', game:'Fortnite', color:['#ff7bd5','#7a1a5c'], msg:'Скинь скрин, где ты это нашёл' },
  { id:'dimka', name:'Dimka_777', level:19, status:'away', text:'Отошёл', game:'EA SPORTS FC 25', color:['#7bd6a7','#176040'], msg:'Турнир в субботу?' },
  { id:'lera', name:'LeraFox', level:41, status:'online', text:'В сети', game:'Hogwarts Legacy', color:['#ffcb5e','#7a4a10'], msg:'Я нашла последнюю комнату!' },
  { id:'nikita', name:'Nikita_Play', level:22, status:'offline', text:'Был в сети 2 ч назад', game:'', color:['#9b8cff','#3c2a8c'], msg:'Ок, до завтра' },
  { id:'sonya', name:'Sonya_Moon', level:35, status:'online', text:'В сети', game:'The Last of Us Part II', color:['#a8c4ff','#2a4b8c'], msg:'Только не спойлери финал' },
  { id:'max', name:'MaxPower', level:16, status:'away', text:'Отошёл', game:'Call of Duty', color:['#ff9a7b','#7a2a10'], msg:'Заходи в лобби' },
  { id:'guest', name:'Гость', level:1, status:'offline', text:'Локальный профиль', game:'', color:['#7c879c','#2a3142'], msg:'' }
];

const NOTIFICATIONS = [
  { id:'n1', type:'trophy', unread:true, time:'5 мин назад', title:'Получен трофей «С верой в сердце»', text:'Marvel\'s Spider-Man 2 · Золото', target:{view:'game', id:'spiderman2'} },
  { id:'n2', type:'download', unread:true, time:'18 мин назад', title:'Gran Turismo 7 обновлена до 1.52', text:'Обновление 2,4 ГБ установлено. Консоль готова к запуску.', target:{view:'game', id:'gt7'} },
  { id:'n3', type:'friend', unread:true, time:'42 мин назад', title:'LeraFox вышла в сеть', text:'Играет в Hogwarts Legacy', target:{view:'friends'} },
  { id:'n4', type:'system', unread:false, time:'Сегодня, 18:02', title:'Резервная копия завершена', text:'Сохранения синхронизированы с облаком PS Plus.', target:{view:'settings', tab:'system'} },
  { id:'n5', type:'message', unread:false, time:'Вчера, 22:31', title:'Сообщение от Artem_Pro', text:'Го в кооператив вечером?', target:{view:'friends'} },
  { id:'n6', type:'store', unread:false, time:'Вчера, 12:10', title:'Скидки недели в PlayStation Store', text:'До 55% на избранные игры. Предложение до 1 декабря.', target:{view:'store'} }
];

const STORE_FEATURED = ['spiderman2','fc','hogwarts','cyberpunk','gt7'];

const TROPHIES = { level:24, progress:62, platinum:3, gold:27, silver:88, bronze:214 };

const STORAGE = { total:825, used:402, system:68, apps:96 };

function fmtSize(gb) {
  return gb >= 1 ? gb.toFixed(1).replace('.', ',') + ' ГБ' : Math.round(gb * 1024) + ' МБ';
}
function minutesAgoLabel() { return ''; }
