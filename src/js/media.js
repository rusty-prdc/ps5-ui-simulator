const MEDIA_APPS = [
  {
    id:'youtube', title:'YouTube', kind:'video', screen:'video', logo:'assets/media/youtube.svg',
    c1:'#ff0033', c2:'#3a0008', tag:'Видео и стримы', cat:'video', featured:true,
    desc:'Ролики, музыка, трансляции и подкасты на большом экране.',
    rows:[
      { title:'Продолжить просмотр', items:['Игровые итоги недели','Ночной город','Лучшие моменты PS5','Стрим: прохождение','Музыкальный вечер','Обзор новинок'] },
      { title:'В тренде', items:['GTA VI: разбор трейлера','Топ-10 игр года','Секреты DualSense','Киберпанк сегодня','Гонки на выживание','Аниме-дайджест'] }
    ]
  },
  {
    id:'spotify', title:'Spotify', kind:'music', screen:'music', logo:'assets/media/spotify.svg',
    c1:'#1ed760', c2:'#064d2a', tag:'Музыка и подкасты', cat:'music', featured:true,
    desc:'Плейлисты, альбомы и подкасты без ограничений.',
    tracks:[
      { n:'Night Drive', a:'Stepa_ Mix', d:'3:42' }, { n:'Neon Rain', a:'Midnight FM', d:'4:08' },
      { n:'Afterglow', a:'Solar Fields', d:'5:11' }, { n:'Low Orbit', a:'Kosmos', d:'3:27' },
      { n:'Frost', a:'Northern Lights', d:'4:36' }, { n:'Signal', a:'Waveform', d:'2:58' }
    ]
  },
  {
    id:'netflix', title:'Netflix', kind:'video', screen:'streaming', logo:'assets/media/netflix.svg',
    c1:'#e50914', c2:'#360207', tag:'Фильмы и сериалы', cat:'video',
    desc:'Оригинальные сериалы, фильмы и документальные проекты.',
    rows:[
      { title:'Оригиналы Netflix', items:['Stranger Things','The Witcher','Arcane','Dark','The Crown','Wednesday'] },
      { title:'Популярно сегодня', items:['Extraction 2','Leave the World Behind','Rebel Moon','Atlas','The Gray Man','Old Guard'] },
      { title:'Новинки недели', items:['3 Body Problem','The Gentlemen','Ripley','Baby Reindeer','Eric','Supacell'] }
    ]
  },
  {
    id:'twitch', title:'Twitch', kind:'stream', screen:'stream', logo:'assets/media/twitch.svg',
    c1:'#9146ff', c2:'#2a0b4d', tag:'Стримы и сообщество', cat:'stream',
    desc:'Прямые трансляции игр, турниров и общения.',
    streams:[
      { t:'Ранкед до алмаза', c:'Artem_Pro', g:'Fortnite', v:'2,4 тыс.' },
      { t:'Проходим Hogwarts', c:'LeraFox', g:'Hogwarts Legacy', v:'860' },
      { t:'Вечерний кооп', c:'Ksenia_Star', g:'Spider-Man 2', v:'1,8 тыс.' },
      { t:'Турнир FC 26', c:'Dimka_777', g:'EA SPORTS FC 26', v:'3,1 тыс.' },
      { t:'Спидран Astro Bot', c:'MaxPower', g:'Astro Bot', v:'640' },
      { t:'Хоррор-ночь', c:'Sonya_Moon', g:'Resident Evil 4', v:'1,2 тыс.' }
    ]
  },
  {
    id:'disney', title:'Disney+', kind:'video', screen:'streaming', logo:'assets/media/disney.svg',
    c1:'#113ccf', c2:'#06143d', tag:'Disney · Pixar · Marvel', cat:'video',
    desc:'Фильмы и сериалы Disney, Pixar, Marvel и Star Wars.',
    rows:[
      { title:'Marvel', items:['Loki','WandaVision','Moon Knight','She-Hulk','Echo','Agatha All Along'] },
      { title:'Star Wars', items:['The Mandalorian','Andor','Ahsoka','The Acolyte','Skeleton Crew','Obi-Wan Kenobi'] },
      { title:'Pixar и Disney', items:['Inside Out 2','Elemental','Luca','Soul','Encanto','Moana 2'] }
    ]
  },
  {
    id:'appletv', title:'Apple TV+', kind:'video', screen:'streaming', logo:'assets/media/appletv.svg',
    c1:'#f5f5f7', c2:'#1a1a1c', tag:'Оригиналы Apple', cat:'video',
    desc:'Оригинальные фильмы и сериалы Apple.',
    rows:[
      { title:'Оригиналы Apple TV+', items:['Severance','Ted Lasso','Foundation','Silo','Slow Horses','Shrinking'] },
      { title:'Фильмы', items:['Killers of the Flower Moon','Napoleon','CODA','The Family Plan','Fly Me to the Moon','Wolfs'] },
      { title:'Документальное', items:['Prehistoric Planet','The Dynasty','Circus','Mess','They Call Me Magic','Visible'] }
    ]
  },
  {
    id:'crunchyroll', title:'Crunchyroll', kind:'video', screen:'streaming', logo:'assets/media/crunchyroll.svg',
    c1:'#f47521', c2:'#4d1e05', tag:'Аниме и симулкаст', cat:'video',
    desc:'Аниме, симулкаст и новые эпизоды.',
    rows:[
      { title:'Сейчас в симулкасте', items:['One Piece','Jujutsu Kaisen','Solo Leveling','Kaiju No. 8','Dandadan','Blue Box'] },
      { title:'Популярное аниме', items:['Attack on Titan','Demon Slayer','Chainsaw Man','My Hero Academia','Spy x Family','Frieren'] },
      { title:'Классика', items:['Naruto','Bleach','Death Note','Fullmetal Alchemist','Steins;Gate','Code Geass'] }
    ]
  },
  {
    id:'plex', title:'Plex', kind:'media', screen:'plex', logo:'assets/media/plex.svg',
    c1:'#e5a00d', c2:'#3d2a02', tag:'Домашняя медиатека', cat:'media',
    desc:'Домашняя библиотека фильмов, музыки и фото.',
    rows:[
      { title:'Недавно добавлено', items:['Семейный архив','Отпуск 2025','Концерт в Москве','Домашнее видео','Фото с PS5','Коллекция фильмов'] },
      { title:'Фильмы', items:['Наука и жизнь','Глубина','Последний рейс','Тихий океан','Архив 81','Северный ветер'] }
    ]
  },
  {
    id:'gallery', title:'Media Gallery', kind:'gallery', screen:'gallery', logo:'assets/media/gallery.svg',
    c1:'#5aa2ff', c2:'#102a4d', tag:'Фото и видео PS5', cat:'gallery',
    desc:'Скриншоты и видеозаписи с PS5, USB и облака.'
  },
  {
    id:'psmedia', title:'PlayStation Media', kind:'media', screen:'psmedia', logo:'assets/logos/playstation.svg',
    c1:'#0070d1', c2:'#001c3d', tag:'Видео · Музыка · Галерея', cat:'media',
    desc:'Единый центр видео, музыки и галереи PlayStation.',
    rows:[
      { title:'Продолжить', items:['The Last of Us','Gran Turismo: фильм','Uncharted','Twisted Metal','Ghost of Tsushima','Helldivers'] },
      { title:'Музыка', items:['God of War: Ragnarök','The Last of Us Part II','Ghost of Tsushima','Cyberpunk 2077','Astro Bot','Spider-Man 2'] }
    ]
  }
];

APPS.length = 0;
Object.keys(APP_MAP).forEach(k => delete APP_MAP[k]);
MEDIA_APPS.forEach(a => { APPS.push(a); APP_MAP[a.id] = a; });
