const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dru9wjewk',
  api_key: process.env.CLOUDINARY_API_KEY || '162939922515555',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'SNX1JYnIoZKE5KxmI_6Fhh3pZTw'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: 'sanctuary', allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
});
const upload = multer({ storage });

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS animals (
      id TEXT PRIMARY KEY, name TEXT, nickname TEXT, species TEXT, breed TEXT, birthday TEXT,
      personality TEXT, description TEXT, chat_personality TEXT, photos TEXT[], featured BOOLEAN DEFAULT false
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1, site_name TEXT, header TEXT, subheader TEXT, tagline TEXT,
      location TEXT, about TEXT, about_content TEXT, hero_image TEXT, donate_url TEXT, email TEXT, phone TEXT
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY, type TEXT, organization TEXT, contact TEXT, email TEXT, phone TEXT,
      date TEXT, attendees TEXT, message TEXT, created_at TEXT, status TEXT
    )
  `);

  try {
    await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS header TEXT`);
    await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS subheader TEXT`);
    await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS about_content TEXT`);
  } catch (e) {}

  const settingsCheck = await pool.query('SELECT * FROM settings WHERE id = 1');
  if (settingsCheck.rows.length === 0) {
    await pool.query(`
      INSERT INTO settings (id, site_name, header, subheader, tagline, location, about, about_content, hero_image, donate_url, email, phone)
      VALUES (1, 'Sierra Alpaca Sanctuary', 'Sierra Alpaca Sanctuary', 'Where every animal finds love', 'Where every animal finds love', 'Camino, California', 
      'Nestled in the Sierra Nevada foothills, we provide a forever home for alpacas, sheep, and other barnyard friends.', 
      'Sierra Alpaca Sanctuary is a small family-run rescue nestled in the Sierra Nevada foothills of Camino, California. We provide a forever home for alpacas, sheep, and other barnyard friends who needed a second chance. Our animals visit nursing homes bringing joy to seniors, and spend time with children with disabilities, creating therapeutic connections and unforgettable moments. Every animal here has a story, and every visitor becomes part of our extended family.', '', '', '', '')
    `);
  }

  const animalsCheck = await pool.query('SELECT * FROM animals LIMIT 1');
  if (animalsCheck.rows.length === 0) {
    const animals = [
      { id: '1', name: 'Buck', nickname: 'Buckwheat', species: 'Sheep', breed: 'Valais Blacknose', birthday: '2025-07-22', personality: 'Curious and bouncy explorer', description: 'Buck is our adorable Valais Blacknose lamb with the fluffiest wool and cutest black face.', chatPersonality: 'young, excited, curious', featured: true },
      { id: '2', name: 'Wally', nickname: 'Walnut', species: 'Sheep', breed: 'Valais Blacknose', birthday: '2025-07-22', personality: 'Gentle cuddle enthusiast', description: 'Wally is the sweeter, calmer twin of Buck.', chatPersonality: 'gentle, sweet, loves cuddles', featured: true },
      { id: '3', name: 'Blackie', nickname: '', species: 'Sheep', breed: 'Dorper', birthday: '2014-01-15', personality: 'Wise elder of the flock', description: 'At 12 years old, Blackie is our beloved senior resident.', chatPersonality: 'wise, calm, elderly', featured: true },
      { id: '4', name: 'Randy', nickname: '', species: 'Alpaca', breed: 'Huacaya', birthday: '2014-01-20', personality: 'Distinguished observer', description: 'Randy watches over everything with quiet dignity.', chatPersonality: 'dignified, observant', featured: false },
      { id: '5', name: 'Pepper', nickname: '', species: 'Alpaca', breed: 'Huacaya', birthday: '2016-03-20', personality: 'Protective herd matriarch', description: 'Pepper keeps everyone in line as our herd matriarch.', chatPersonality: 'nurturing, protective', featured: true },
      { id: '6', name: 'Klaus', nickname: '', species: 'Alpaca', breed: 'Huacaya', birthday: '2011-06-10', personality: 'Distinguished grandfather', description: 'Klaus is our most senior alpaca at 15 years.', chatPersonality: 'wise grandfather figure', featured: false },
      { id: '7', name: 'Rose', nickname: '', species: 'Alpaca', breed: 'Huacaya', birthday: '2023-05-10', personality: 'Energetic entertainer', description: 'Rose is pure energy!', chatPersonality: 'very energetic, enthusiastic', featured: true },
      { id: '8', name: 'Truffle', nickname: '', species: 'Alpaca', breed: 'Huacaya', birthday: '2024-02-14', personality: 'Shy sweetheart', description: 'Born on Valentines Day, Truffle is shy at first.', chatPersonality: 'shy, sweet', featured: false },
      { id: '9', name: 'Bluebell', nickname: '', species: 'Alpaca', breed: 'Huacaya', birthday: '2025-01-08', personality: 'Curious yearling', description: 'Bluebell just turned one.', chatPersonality: 'very curious', featured: false },
      { id: '10', name: 'Kukui', nickname: '', species: 'Alpaca', breed: 'Huacaya', birthday: '2025-07-15', personality: 'Adorable baby', description: 'Kukui is our youngest alpaca.', chatPersonality: 'baby alpaca, learning', featured: true },
      { id: '11', name: 'Dandelion', nickname: '', species: 'Sheep', breed: 'Barbados Blackbelly', birthday: '2025-05-20', personality: 'Spirited survivor', description: 'Dandelion came to us with a leg injury that has healed.', chatPersonality: 'tough, resilient', featured: false },
      { id: '12', name: 'Linda Jr.', nickname: '', species: 'Sheep', breed: 'Dorper', birthday: '2025-09-22', personality: 'Tiny adventurer', description: 'Our newest and youngest resident.', chatPersonality: 'tiny, adventurous', featured: false }
    ];
    for (const a of animals) {
      await pool.query(
        'INSERT INTO animals (id, name, nickname, species, breed, birthday, personality, description, chat_personality, photos, featured) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
        [a.id, a.name, a.nickname, a.species, a.breed, a.birthday, a.personality, a.description, a.chatPersonality, [], a.featured]
      );
    }
  }
}

initDB().catch(console.error);

const calcAge = (birthday) => {
  if (!birthday) return '';
  const birth = new Date(birthday);
  const now = new Date();
  const days = Math.floor((now - birth) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Not born yet';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  const years = Math.floor(days / 365);
  const mo = Math.floor((days % 365) / 30);
  return mo > 0 ? `${years}y ${mo}m` : `${years} years`;
};

app.locals.calcAge = calcAge;

const formatAnimal = (row) => ({
  id: row.id, name: row.name, nickname: row.nickname, species: row.species, breed: row.breed,
  birthday: row.birthday, personality: row.personality, description: row.description,
  chatPersonality: row.chat_personality, photos: row.photos || [], featured: row.featured
});

const formatSettings = (row) => ({
  siteName: row.site_name, header: row.header || row.site_name, subheader: row.subheader || row.tagline,
  tagline: row.tagline, location: row.location, about: row.about, aboutContent: row.about_content || row.about,
  heroImage: row.hero_image, donateUrl: row.donate_url, email: row.email, phone: row.phone
});

// Animal knowledge base for rich chat
const animalKnowledge = {
  '1': { // Buck
    history: "I came to the sanctuary with my twin brother Wally in summer 2025. We're Valais Blacknose sheep, originally from Switzerland! Our breed is known for being super friendly and having the cutest spiral horns and black faces.",
    food: "I LOVE orchard grass hay - it's my favorite! I also get grain pellets as treats. We can eat most vegetables like carrots and lettuce, but NO avocados, onions, or chocolate - those are dangerous for sheep!",
    cantEat: "Avocados, onions, chocolate, and moldy food are really bad for me. Also no lawn clippings - they can make me very sick!",
    friends: "My best friend is obviously my twin brother Wally! We do everything together. I also like following Blackie around because he's so wise.",
    quirks: "I love to bounce when I'm happy! I also have a habit of nibbling on people's shoelaces. Can't help it!",
    daily: "I wake up early for breakfast hay, then spend mornings grazing. Afternoons are for naps in the shade with Wally. Evenings we get grain treats!"
  },
  '2': { // Wally
    history: "I arrived with my twin Buck in 2025. We're Valais Blacknose sheep - the 'cutest sheep breed in the world' according to some people! We came from a breeder who couldn't keep us anymore.",
    food: "I love timothy hay and fresh grass. My favorite treats are apple slices and carrot pieces. Sheep need lots of fresh water too!",
    cantEat: "We can't have avocados, onions, garlic, or chocolate. Also, too much grain can make us sick - treats only!",
    friends: "Buck is my best friend forever - we're twins! I also really like when Pepper the alpaca stands guard over us. She makes me feel safe.",
    quirks: "I'm the calmer twin. I love head scratches SO much - I'll lean into your hand and close my eyes. Pure bliss!",
    daily: "Wake up snuggled next to Buck, eat breakfast, graze, find a sunny spot for cuddles, dinner time, then bed!"
  },
  '3': { // Blackie
    history: "I've been at the sanctuary since 2014 - one of the original residents. I'm a Dorper sheep, a breed from South Africa. I've seen many animals come and go, and I've welcomed them all.",
    food: "At my age, I need easy-to-digest hay and senior feed pellets. The young ones share their treats with me sometimes. Very kind of them.",
    cantEat: "Same as all sheep - no avocados, onions, or chocolate. At my age, I also have to be careful not to overeat rich foods.",
    friends: "I consider myself a mentor to all the youngsters here. Buck and Wally often come to me for guidance. Klaus the alpaca and I are old friends - we've known each other for years.",
    quirks: "I walk slowly these days, but I still make my rounds every morning to check on everyone. It's my job.",
    daily: "I take my time with everything now. Slow breakfast, slow walk around the pasture, long afternoon naps, early bedtime. The simple life."
  },
  '4': { // Randy
    history: "I'm a Huacaya alpaca, arrived in 2014. Huacaya alpacas have fluffy, teddy bear-like fleece. I came from a farm that was downsizing.",
    food: "Alpacas like me eat grass hay, orchard grass, and special alpaca pellets. We're actually quite efficient eaters - we don't need as much food as you'd think!",
    cantEat: "No treats meant for other animals! Also no nightshade plants, azaleas, or rhododendrons - very toxic to alpacas.",
    friends: "Klaus and I go way back. Pepper is good company too, though she's always bossing everyone around. I prefer observing from a distance.",
    quirks: "I'm the strong, silent type. I watch everything carefully. Some say I'm aloof, but I just like to think before I act.",
    daily: "Morning grazing, afternoon dust bath, evening hay. I like routine. Predictable is good."
  },
  '5': { // Pepper
    history: "I came to the sanctuary in 2016. As a Huacaya alpaca, I took on the role of herd guardian naturally. Someone has to keep everyone in line!",
    food: "Quality grass hay and alpaca-specific minerals. I make sure everyone eats properly - can't have the young ones skipping meals!",
    cantEat: "Alpacas should never eat meat, dairy, or processed human food. Also no cherry leaves or oak - poisonous!",
    friends: "I watch over ALL the animals here - that's my job. The little lambs Buck and Wally especially need supervision. Rose is like my daughter.",
    quirks: "I do this thing called the 'alarm call' - a high-pitched sound when I see something suspicious. Everyone freezes when they hear it!",
    daily: "First one up to scout for danger. Then I supervise breakfast, monitor the pasture all day, and do a headcount before bed."
  },
  '6': { // Klaus
    history: "I'm the eldest alpaca here at 15 years old. I came to the sanctuary in 2011. I've lived a full life and have the softest fleece anyone's ever touched - or so they tell me.",
    food: "Senior alpaca feed that's easy on my teeth. Soft hay. The young ones bring me the best grass clippings sometimes.",
    cantEat: "At my age, I'm extra careful. Nothing too rich or hard to digest. My stomach isn't what it used to be.",
    friends: "Blackie and I are the old-timers here. We understand each other. Randy's good company too - he doesn't talk too much.",
    quirks: "I hum. Alpacas communicate through humming, and I do it a lot - it's soothing. I also take very long dust baths.",
    daily: "Slow mornings, lots of rest, enjoying the sunshine. At my age, every peaceful day is a gift."
  },
  '7': { // Rose
    history: "I was born in 2023 and came here as a young cria! I'm a Huacaya alpaca with SO much energy. I love everything about the sanctuary!",
    food: "Hay, grass, pellets - I'll eat it all! I burn so much energy running around that I'm always hungry!",
    cantEat: "Pepper taught me - no human food, no weird plants, stick to what's in the feeding area!",
    friends: "Everyone is my friend! I especially love playing with the younger animals. Pepper watches over me like a mom.",
    quirks: "I do this thing called pronking - jumping straight up with all four legs when I'm happy! I do it A LOT!",
    daily: "Run, eat, run, play, run, nap, run, eat, sleep! SO much to do every day!"
  },
  '8': { // Truffle
    history: "I was born on Valentine's Day 2024 - that's why they named me Truffle, like a chocolate! I'm still getting used to meeting new people.",
    food: "I like to eat in quiet corners where no one's watching. Same food as other alpacas - hay and pellets.",
    cantEat: "I follow what Pepper says about food. She knows best.",
    friends: "Bluebell is becoming my friend - we're close in age. I like being near the older alpacas, they make me feel safe.",
    quirks: "I hide behind other alpacas when strangers come. But once I trust you, I'll follow you everywhere!",
    daily: "Stay close to the herd, eat when it's quiet, find a safe spot to watch from. Maybe one day I'll be braver."
  },
  '9': { // Bluebell
    history: "I just turned one in January 2025! I'm a curious yearling still learning about the world. Everything is so interesting!",
    food: "I'm still learning what's yummy and what's not. The older alpacas show me where the best grass is!",
    cantEat: "Pepper tells me not to eat ANYTHING outside the pasture. She's very strict about it!",
    friends: "Truffle is my age-mate! Rose plays with me too. I ask Klaus lots of questions because he knows everything.",
    quirks: "I tilt my head when I'm confused, which is often. Also, my fleece shimmers in sunlight - everyone says it's pretty!",
    daily: "Follow the herd, learn things, ask questions, try to figure out what the humans are doing. So much to discover!"
  },
  '10': { // Kukui
    history: "I'm the baby! Born July 2025, named Kukui after the Hawaiian candlenut tree. I'm still learning how to be a proper alpaca!",
    food: "I just started eating solid food! Soft hay and milk from my mama. I try to eat what the big alpacas eat.",
    cantEat: "I'm too little to know, but I stay close to the grown-ups and copy them!",
    friends: "Everyone looks out for me! Pepper is very protective. I like to follow Rose around because she's fun.",
    quirks: "I make tiny humming sounds when I'm confused or lost. The big alpacas always come running when they hear it!",
    daily: "Nap, nurse, nap, try to keep up with the big alpacas, nap, more napping. Being little is tiring!"
  },
  '11': { // Dandelion
    history: "I'm a Barbados Blackbelly sheep - we're originally from the Caribbean! I came to the sanctuary in 2025 with a leg injury, but I'm all healed now!",
    food: "I love fresh browse - leaves, shrubs, grass. Barbados Blackbelly sheep are natural foragers. Also hay and some grain.",
    cantEat: "Same as other sheep - no avocados, onions, chocolate. My breed is pretty hardy though!",
    friends: "I've bonded with everyone who helped me heal. The sanctuary humans are amazing. I also like playing with Linda Jr.",
    quirks: "I don't let my past injury slow me down! I'm actually one of the fastest runners here now. Catch me if you can!",
    daily: "Morning stretch (gotta keep that leg strong!), lots of grazing and running, showing everyone I'm 100% better!"
  },
  '12': { // Linda Jr.
    history: "I'm the newest and youngest sheep! Born September 2025. I'm a Dorper like Blackie - he's like my grandpa figure here.",
    food: "I'm still little, so I eat soft hay and grain mash. I try to copy what the big sheep eat!",
    cantEat: "I stay away from anything the grown-ups don't eat. Blackie taught me that!",
    friends: "I follow Blackie EVERYWHERE. He's so patient with me. Buck and Wally are fun to play with too!",
    quirks: "I have the tiniest 'baaa' you've ever heard! Also, I think I'm bigger than I am and try to challenge the alpacas. They think it's funny.",
    daily: "Wake up, find Blackie, follow Blackie, copy what Blackie does, take a nap, repeat!"
  }
};

function generateResponse(animal, msg) {
  const m = msg.toLowerCase();
  const name = animal.name;
  const age = calcAge(animal.birthday);
  const knowledge = animalKnowledge[animal.id] || {};
  
  // Greetings
  if (m.includes('hello') || m.includes('hi') || m === 'hey' || m.includes('good morning') || m.includes('good afternoon')) {
    const greetings = [
      `Hi there! I'm ${name}! So happy you came to chat with me!`,
      `Hello, friend! It's ${name} here. What would you like to know about me?`,
      `Hey! *${animal.species === 'Alpaca' ? 'hums happily' : 'baas excitedly'}* I'm ${name}! Ask me anything!`,
      `Welcome! I'm ${name}, and I love meeting new people. What's on your mind?`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  // How are you / feelings
  if (m.includes('how are you') || m.includes('how do you feel') || m.includes('how\'s it going')) {
    return `I'm doing wonderful! Life at the sanctuary is peaceful. ${animal.personality} - that's just who I am! The weather's nice and my belly is full. What more could a ${animal.species.toLowerCase()} ask for?`;
  }
  
  // Age/birthday
  if (m.includes('age') || m.includes('old') || m.includes('birthday') || m.includes('born')) {
    const bday = new Date(animal.birthday);
    const month = bday.toLocaleDateString('en-US', { month: 'long' });
    const day = bday.getDate();
    return `I'm ${age} old! My birthday is ${month} ${day}. ${animal.species === 'Alpaca' ? 'Alpacas' : 'Sheep'} like me can live quite a long time with good care!`;
  }
  
  // History/background/story
  if (m.includes('history') || m.includes('story') || m.includes('where did you come from') || m.includes('background') || m.includes('how did you get here')) {
    return knowledge.history || `I've been at Sierra Alpaca Sanctuary for a while now. It's my forever home! ${animal.description}`;
  }
  
  // Food - what they eat
  if (m.includes('what do you eat') || m.includes('favorite food') || m.includes('what can you eat') || m.includes('diet') || m.includes('feed')) {
    return knowledge.food || (animal.species === 'Alpaca' ? `I eat grass hay, orchard grass, and alpaca pellets. Fresh water is super important too!` : `I love good quality hay and fresh pasture grass. Grain treats are my favorite!`);
  }
  
  // Food - what they CAN'T eat
  if (m.includes('can\'t eat') || m.includes('cannot eat') || m.includes('shouldn\'t eat') || m.includes('toxic') || m.includes('poison') || m.includes('dangerous food')) {
    return knowledge.cantEat || (animal.species === 'Alpaca' ? `We alpacas need to avoid nightshade plants, azaleas, and rhododendrons - they're toxic! Also no processed human food.` : `Sheep like me can't have avocados, onions, chocolate, or moldy food. Those are really dangerous for us!`);
  }
  
  // Friends
  if (m.includes('friend') || m.includes('who do you hang out with') || m.includes('best buddy') || m.includes('like most')) {
    return knowledge.friends || `I have so many friends here! We all look out for each other at the sanctuary. ${animal.species === 'Alpaca' ? 'The sheep' : 'The alpacas'} are fun to hang with too!`;
  }
  
  // Quirks/personality
  if (m.includes('quirk') || m.includes('habit') || m.includes('funny thing') || m.includes('special') || m.includes('personality')) {
    return knowledge.quirks || `${animal.personality}! That's just who I am. Every animal here has their own unique personality.`;
  }
  
  // Daily routine
  if (m.includes('day') || m.includes('routine') || m.includes('typical') || m.includes('schedule') || m.includes('what do you do')) {
    return knowledge.daily || `Every day is great here! Breakfast, grazing, naps, hanging with friends, dinner, sleep. Simple but perfect!`;
  }
  
  // Visit
  if (m.includes('visit') || m.includes('meet you') || m.includes('come see') || m.includes('where are you')) {
    return `I would LOVE to meet you in person! We're at Sierra Alpaca Sanctuary in Camino, California - that's in the beautiful Sierra Nevada foothills. You can book a visit through the website!`;
  }
  
  // Fleece/wool/fiber
  if (m.includes('soft') || m.includes('wool') || m.includes('fleece') || m.includes('fiber') || m.includes('fluffy')) {
    return animal.species === 'Alpaca' 
      ? `My fleece is incredibly soft! Alpaca fiber is actually warmer than sheep wool, hypoallergenic, and water-resistant. We get sheared once a year in spring - it feels so good to lose that heavy coat!` 
      : `My wool is wonderful! ${animal.breed} sheep like me have special coats. Wool keeps us warm in winter and cool in summer - it's amazing!`;
  }
  
  // Name
  if (m.includes('your name') || m.includes('called') || m.includes('nickname')) {
    return animal.nickname 
      ? `I'm ${name}, but my close friends call me ${animal.nickname}! I like both names.` 
      : `My name is ${name}! The sanctuary family named me when I arrived. I think it suits me!`;
  }
  
  // Love/cute
  if (m.includes('love you') || m.includes('cute') || m.includes('adorable') || m.includes('sweet')) {
    return `Aww, you're making me *${animal.species === 'Alpaca' ? 'hum with joy' : 'baa happily'}*! I love meeting kind people like you! 💕`;
  }
  
  // Breed
  if (m.includes('breed') || m.includes('type of') || m.includes('what kind')) {
    return `I'm a ${animal.breed} ${animal.species.toLowerCase()}! ${animal.species === 'Alpaca' && animal.breed === 'Huacaya' ? 'Huacaya alpacas have fluffy, teddy bear-like fleece, unlike Suri alpacas who have long, silky locks.' : ''} Pretty cool, right?`;
  }
  
  // Scared/nervous
  if (m.includes('scared') || m.includes('nervous') || m.includes('afraid')) {
    return `Don't worry, we're all very gentle here! ${animal.species === 'Alpaca' ? 'Alpacas are naturally curious and calm.' : 'Sheep might seem shy but we warm up quick!'} Come visit and see!`;
  }
  
  // Funny/joke
  if (m.includes('joke') || m.includes('funny') || m.includes('laugh')) {
    const jokes = animal.species === 'Alpaca' 
      ? [`Why don't alpacas like fast food? Because they can't catch it! *hums at own joke*`, `What do you call an alpaca with a carrot in each ear? Anything you want, they can't hear you!`]
      : [`Why did the sheep go to the spa? For a baa-th! *baas laughing*`, `What do you call a sheep with no legs? A cloud!`];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  
  // Sound they make
  if (m.includes('sound') || m.includes('noise') || m.includes('hum') || m.includes('baa')) {
    return animal.species === 'Alpaca' 
      ? `Alpacas don't baa like sheep - we HUM! It's how we communicate. A soft hum means I'm content. A higher pitch might mean I'm curious or worried. *hmmmmm*`
      : `Baaaa! That's sheep-speak for "hello"! We baa to communicate with each other and our humans. Each of us has a unique voice!`;
  }
  
  // Sleep
  if (m.includes('sleep') || m.includes('night') || m.includes('bed')) {
    return animal.species === 'Alpaca'
      ? `Alpacas are interesting sleepers! We actually lie down with our legs tucked under us - it's called 'cushing'. We only need about 4-5 hours of sleep!`
      : `Sheep like to sleep huddled together for safety. I feel safest when I'm close to my flock family!`;
  }

  // Default responses with more personality
  const defaults = [
    `That's a great question! I'm just a ${animal.species.toLowerCase()}, so I might not know everything, but I love chatting with you!`,
    `Hmm, let me think about that... *${animal.species === 'Alpaca' ? 'tilts head and hums' : 'wiggles ears'}* Tell me more?`,
    `I like talking with you! Ask me about my food, my friends, or what I do all day!`,
    `*${animal.species === 'Alpaca' ? 'looks at you with big curious eyes' : 'baas softly'}* That's interesting! What else would you like to know?`,
    `Life here at the sanctuary is pretty wonderful. I'm ${name}, ${age} old, and ${animal.personality.toLowerCase()}. What would you like to chat about?`
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

// Public routes
app.get('/', async (req, res) => {
  const animals = (await pool.query('SELECT * FROM animals')).rows.map(formatAnimal);
  const settings = formatSettings((await pool.query('SELECT * FROM settings WHERE id = 1')).rows[0]);
  res.render('public/home', { animals, settings });
});

app.get('/animals', async (req, res) => {
  let animals = (await pool.query('SELECT * FROM animals')).rows.map(formatAnimal);
  const settings = formatSettings((await pool.query('SELECT * FROM settings WHERE id = 1')).rows[0]);
  const { species, sort } = req.query;
  if (species) animals = animals.filter(a => a.species === species);
  if (sort === 'age') animals.sort((a, b) => new Date(a.birthday) - new Date(b.birthday));
  if (sort === 'name') animals.sort((a, b) => a.name.localeCompare(b.name));
  const speciesList = [...new Set((await pool.query('SELECT * FROM animals')).rows.map(a => a.species))];
  res.render('public/animals', { animals, settings, speciesList, currentSpecies: species, currentSort: sort });
});

app.get('/animal/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM animals WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).send('Not found');
  const animal = formatAnimal(result.rows[0]);
  const settings = formatSettings((await pool.query('SELECT * FROM settings WHERE id = 1')).rows[0]);
  res.render('public/animal', { animal, settings });
});

app.get('/chat/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM animals WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).send('Not found');
  const animal = formatAnimal(result.rows[0]);
  const settings = formatSettings((await pool.query('SELECT * FROM settings WHERE id = 1')).rows[0]);
  res.render('public/chat', { animal, settings, calcAge });
});

app.post('/api/chat/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM animals WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  const animal = formatAnimal(result.rows[0]);
  res.json({ response: generateResponse(animal, req.body.message) });
});

app.get('/book', async (req, res) => {
  const settings = formatSettings((await pool.query('SELECT * FROM settings WHERE id = 1')).rows[0]);
  res.render('public/book', { settings, success: req.query.success });
});

app.post('/book', async (req, res) => {
  await pool.query(
    'INSERT INTO bookings (id, type, organization, contact, email, phone, date, attendees, message, created_at, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
    [uuidv4(), req.body.type, req.body.organization, req.body.contact, req.body.email, req.body.phone, req.body.date, req.body.attendees, req.body.message, new Date().toISOString(), 'pending']
  );
  res.redirect('/book?success=1');
});

app.get('/donate', async (req, res) => {
  const settings = formatSettings((await pool.query('SELECT * FROM settings WHERE id = 1')).rows[0]);
  res.render('public/donate', { settings });
});

app.get('/about', async (req, res) => {
  const settings = formatSettings((await pool.query('SELECT * FROM settings WHERE id = 1')).rows[0]);
  const animals = (await pool.query('SELECT * FROM animals')).rows.map(formatAnimal);
  res.render('public/about', { settings, animals });
});

// Admin routes
app.get('/admin', async (req, res) => {
  const animals = (await pool.query('SELECT * FROM animals')).rows.map(formatAnimal);
  const settings = formatSettings((await pool.query('SELECT * FROM settings WHERE id = 1')).rows[0]);
  const bookings = (await pool.query('SELECT * FROM bookings')).rows;
  res.render('admin/dashboard', { animals, settings, bookings });
});

app.get('/admin/animals', async (req, res) => {
  const animals = (await pool.query('SELECT * FROM animals')).rows.map(formatAnimal);
  res.render('admin/animals', { animals, calcAge });
});

app.get('/admin/animals/new', (req, res) => res.render('admin/animal-form', { animal: null, calcAge }));

app.get('/admin/animals/:id/edit', async (req, res) => {
  const result = await pool.query('SELECT * FROM animals WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).send('Not found');
  res.render('admin/animal-form', { animal: formatAnimal(result.rows[0]), calcAge });
});

app.post('/admin/animals', upload.array('photos', 10), async (req, res) => {
  const photos = req.files ? req.files.map(f => f.path) : [];
  await pool.query(
    'INSERT INTO animals (id, name, nickname, species, breed, birthday, personality, description, chat_personality, photos, featured) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
    [uuidv4(), req.body.name, req.body.nickname, req.body.species, req.body.breed, req.body.birthday, req.body.personality, req.body.description, req.body.chatPersonality, photos, req.body.featured === 'on']
  );
  res.redirect('/admin/animals');
});

app.post('/admin/animals/:id', upload.array('photos', 10), async (req, res) => {
  const newPhotos = req.files ? req.files.map(f => f.path) : [];
  const existingPhotos = req.body.existingPhotos ? (Array.isArray(req.body.existingPhotos) ? req.body.existingPhotos : [req.body.existingPhotos]) : [];
  await pool.query(
    'UPDATE animals SET name=$1, nickname=$2, species=$3, breed=$4, birthday=$5, personality=$6, description=$7, chat_personality=$8, photos=$9, featured=$10 WHERE id=$11',
    [req.body.name, req.body.nickname, req.body.species, req.body.breed, req.body.birthday, req.body.personality, req.body.description, req.body.chatPersonality, [...existingPhotos, ...newPhotos], req.body.featured === 'on', req.params.id]
  );
  res.redirect('/admin/animals');
});

app.post('/admin/animals/:id/delete', async (req, res) => {
  await pool.query('DELETE FROM animals WHERE id = $1', [req.params.id]);
  res.redirect('/admin/animals');
});

app.get('/admin/bookings', async (req, res) => {
  const bookings = (await pool.query('SELECT * FROM bookings ORDER BY created_at DESC')).rows;
  res.render('admin/bookings', { bookings });
});

app.post('/admin/bookings/:id/status', async (req, res) => {
  await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [req.body.status, req.params.id]);
  res.redirect('/admin/bookings');
});

app.get('/admin/settings', async (req, res) => {
  const settings = formatSettings((await pool.query('SELECT * FROM settings WHERE id = 1')).rows[0]);
  res.render('admin/settings', { settings });
});

app.post('/admin/settings', upload.single('heroImage'), async (req, res) => {
  const current = (await pool.query('SELECT * FROM settings WHERE id = 1')).rows[0];
  let heroImage = req.body.existingHeroImage || current?.hero_image || '';
  if (req.file) heroImage = req.file.path;
  await pool.query(
    'UPDATE settings SET site_name=$1, header=$2, subheader=$3, tagline=$4, location=$5, about=$6, about_content=$7, hero_image=$8, donate_url=$9, email=$10, phone=$11 WHERE id=1',
    [req.body.siteName, req.body.header, req.body.subheader, req.body.tagline, req.body.location, req.body.about, req.body.aboutContent, heroImage, req.body.donateUrl, req.body.email, req.body.phone]
  );
  res.redirect('/admin/settings');
});

app.listen(PORT, () => console.log(`Sanctuary running on port ${PORT}`));
