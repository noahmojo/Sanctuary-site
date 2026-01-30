const express = require('express');
const session = require('express-session');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'alpaca123';

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
app.use(session({
  secret: process.env.SESSION_SECRET || 'sanctuary-secret-key-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Auth middleware
function requireAdmin(req, res, next) {
  if (req.session.isAdmin) return next();
  res.redirect('/admin/login');
}

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
  '1': { history: "I came to the sanctuary with my twin brother Wally in summer 2025. We're Valais Blacknose sheep, originally from Switzerland!", food: "I LOVE orchard grass hay - it's my favorite! I also get grain pellets as treats.", cantEat: "Avocados, onions, chocolate, and moldy food are really bad for me.", friends: "My best friend is my twin brother Wally! I also like following Blackie around.", quirks: "I love to bounce when I'm happy! I also nibble on shoelaces.", daily: "Wake up early for breakfast hay, graze mornings, nap afternoons with Wally, grain treats evenings!" },
  '2': { history: "I arrived with my twin Buck in 2025. We're Valais Blacknose sheep - the 'cutest sheep breed in the world'!", food: "I love timothy hay and fresh grass. Apple slices and carrots are my favorite treats.", cantEat: "We can't have avocados, onions, garlic, or chocolate.", friends: "Buck is my best friend forever - we're twins! I also like when Pepper watches over us.", quirks: "I'm the calmer twin. I love head scratches SO much!", daily: "Wake up snuggled next to Buck, eat, graze, find sunny spots for cuddles, dinner, bed!" },
  '3': { history: "I've been at the sanctuary since 2014 - one of the original residents. I'm a Dorper sheep from South Africa.", food: "At my age, I need easy-to-digest hay and senior feed pellets.", cantEat: "Same as all sheep - no avocados, onions, or chocolate.", friends: "I consider myself a mentor to the youngsters. Klaus and I are old friends.", quirks: "I walk slowly now, but I still make my rounds every morning to check on everyone.", daily: "Slow breakfast, slow walk around, long afternoon naps, early bedtime. The simple life." },
  '4': { history: "I'm a Huacaya alpaca, arrived in 2014. We have fluffy, teddy bear-like fleece.", food: "Alpacas eat grass hay, orchard grass, and special alpaca pellets.", cantEat: "No treats meant for other animals! No nightshade plants, azaleas, or rhododendrons.", friends: "Klaus and I go way back. I prefer observing from a distance.", quirks: "I'm the strong, silent type. I watch everything carefully.", daily: "Morning grazing, afternoon dust bath, evening hay. I like routine." },
  '5': { history: "I came to the sanctuary in 2016. As a Huacaya alpaca, I took on the role of herd guardian.", food: "Quality grass hay and alpaca-specific minerals.", cantEat: "Alpacas should never eat meat, dairy, or processed human food. No cherry leaves or oak.", friends: "I watch over ALL the animals here. The lambs Buck and Wally especially need supervision.", quirks: "I do the 'alarm call' - a high-pitched sound when I see something suspicious!", daily: "First one up to scout for danger. Supervise breakfast, monitor pasture all day, headcount before bed." },
  '6': { history: "I'm the eldest alpaca here at 15 years old. I came in 2011. I have the softest fleece.", food: "Senior alpaca feed that's easy on my teeth. Soft hay.", cantEat: "At my age, I'm extra careful. Nothing too rich or hard to digest.", friends: "Blackie and I are the old-timers. We understand each other.", quirks: "I hum a lot - it's soothing. I also take very long dust baths.", daily: "Slow mornings, lots of rest, enjoying the sunshine. Every peaceful day is a gift." },
  '7': { history: "I was born in 2023 and came here as a young cria! I'm a Huacaya alpaca with SO much energy!", food: "Hay, grass, pellets - I'll eat it all! I burn so much energy running around!", cantEat: "Pepper taught me - no human food, no weird plants!", friends: "Everyone is my friend! I love playing with younger animals. Pepper watches over me.", quirks: "I do pronking - jumping straight up with all four legs when I'm happy!", daily: "Run, eat, run, play, run, nap, run, eat, sleep! SO much to do!" },
  '8': { history: "I was born on Valentine's Day 2024 - that's why they named me Truffle! I'm still getting used to people.", food: "I like to eat in quiet corners. Same food as other alpacas.", cantEat: "I follow what Pepper says about food.", friends: "Bluebell is becoming my friend. I like being near older alpacas for safety.", quirks: "I hide behind other alpacas when strangers come. But once I trust you, I follow you everywhere!", daily: "Stay close to the herd, eat when quiet, find safe spots to watch from." },
  '9': { history: "I just turned one in January 2025! I'm a curious yearling still learning about the world.", food: "I'm learning what's yummy! The older alpacas show me where the best grass is.", cantEat: "Pepper tells me not to eat ANYTHING outside the pasture!", friends: "Truffle is my age-mate! Rose plays with me too. I ask Klaus lots of questions.", quirks: "I tilt my head when confused. My fleece shimmers in sunlight!", daily: "Follow the herd, learn things, ask questions, figure out what humans are doing!" },
  '10': { history: "I'm the baby! Born July 2025, named Kukui after the Hawaiian candlenut tree.", food: "I just started eating solid food! Soft hay and milk.", cantEat: "I'm too little to know, but I stay close to grown-ups and copy them!", friends: "Everyone looks out for me! Pepper is very protective. I follow Rose because she's fun.", quirks: "I make tiny humming sounds when confused or lost. Big alpacas come running!", daily: "Nap, nurse, nap, try to keep up with big alpacas, nap. Being little is tiring!" },
  '11': { history: "I'm a Barbados Blackbelly sheep - originally from the Caribbean! I came in 2025 with a leg injury, now healed!", food: "I love fresh browse - leaves, shrubs, grass. Also hay and some grain.", cantEat: "Same as other sheep - no avocados, onions, chocolate.", friends: "I've bonded with everyone who helped me heal. I like playing with Linda Jr.", quirks: "I don't let my past injury slow me down! I'm one of the fastest runners here now!", daily: "Morning stretch, lots of grazing and running, showing everyone I'm 100% better!" },
  '12': { history: "I'm the newest and youngest sheep! Born September 2025. I'm a Dorper like Blackie.", food: "I'm still little, so I eat soft hay and grain mash.", cantEat: "I stay away from anything grown-ups don't eat. Blackie taught me!", friends: "I follow Blackie EVERYWHERE. Buck and Wally are fun to play with!", quirks: "I have the tiniest 'baaa'! I think I'm bigger than I am and challenge alpacas. They think it's funny.", daily: "Wake up, find Blackie, follow Blackie, copy Blackie, nap, repeat!" }
};

function generateResponse(animal, msg) {
  const m = msg.toLowerCase();
  const name = animal.name;
  const age = calcAge(animal.birthday);
  const knowledge = animalKnowledge[animal.id] || {};
  
  if (m.includes('hello') || m.includes('hi') || m === 'hey' || m.includes('good morning') || m.includes('good afternoon')) {
    const greetings = [`Hi there! I'm ${name}! So happy you came to chat with me!`, `Hello, friend! It's ${name} here. What would you like to know about me?`, `Hey! *${animal.species === 'Alpaca' ? 'hums happily' : 'baas excitedly'}* I'm ${name}!`];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  if (m.includes('how are you') || m.includes('how do you feel')) return `I'm doing wonderful! ${animal.personality} - that's just who I am!`;
  if (m.includes('age') || m.includes('old') || m.includes('birthday')) return `I'm ${age} old! ${animal.species === 'Alpaca' ? 'Alpacas' : 'Sheep'} like me can live quite a long time with good care!`;
  if (m.includes('history') || m.includes('story') || m.includes('where did you come from')) return knowledge.history || animal.description;
  if (m.includes('what do you eat') || m.includes('favorite food') || m.includes('feed')) return knowledge.food || `I eat hay and grass!`;
  if (m.includes('can\'t eat') || m.includes('cannot eat') || m.includes('toxic')) return knowledge.cantEat || `I have to be careful about what I eat!`;
  if (m.includes('friend')) return knowledge.friends || `I have so many friends here at the sanctuary!`;
  if (m.includes('quirk') || m.includes('habit') || m.includes('personality')) return knowledge.quirks || animal.personality;
  if (m.includes('day') || m.includes('routine')) return knowledge.daily || `Every day is great here!`;
  if (m.includes('visit') || m.includes('meet you')) return `I would LOVE to meet you! We're at Sierra Alpaca Sanctuary in Camino, California. Book a visit through the website!`;
  if (m.includes('soft') || m.includes('wool') || m.includes('fleece')) return animal.species === 'Alpaca' ? `My fleece is incredibly soft! Alpaca fiber is warmer than sheep wool and hypoallergenic!` : `My wool is wonderful! It keeps me warm in winter and cool in summer!`;
  if (m.includes('your name') || m.includes('nickname')) return animal.nickname ? `I'm ${name}, but friends call me ${animal.nickname}!` : `My name is ${name}!`;
  if (m.includes('love you') || m.includes('cute')) return `Aww, you're making me *${animal.species === 'Alpaca' ? 'hum with joy' : 'baa happily'}*! 💕`;
  if (m.includes('joke') || m.includes('funny')) {
    const jokes = animal.species === 'Alpaca' ? [`Why don't alpacas like fast food? Because they can't catch it!`] : [`Why did the sheep go to the spa? For a baa-th!`];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  
  const defaults = [`That's interesting! Ask me about my food, friends, or daily routine!`, `I like talking with you! What else would you like to know?`, `*${animal.species === 'Alpaca' ? 'tilts head curiously' : 'wiggles ears'}* Tell me more?`];
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

// Admin login routes
app.get('/admin/login', (req, res) => {
  res.render('admin/login', { error: null });
});

app.post('/admin/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.render('admin/login', { error: 'Incorrect password' });
  }
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Protected admin routes
app.get('/admin', requireAdmin, async (req, res) => {
  const animals = (await pool.query('SELECT * FROM animals')).rows.map(formatAnimal);
  const settings = formatSettings((await pool.query('SELECT * FROM settings WHERE id = 1')).rows[0]);
  const bookings = (await pool.query('SELECT * FROM bookings')).rows;
  res.render('admin/dashboard', { animals, settings, bookings });
});

app.get('/admin/animals', requireAdmin, async (req, res) => {
  const animals = (await pool.query('SELECT * FROM animals')).rows.map(formatAnimal);
  res.render('admin/animals', { animals, calcAge });
});

app.get('/admin/animals/new', requireAdmin, (req, res) => res.render('admin/animal-form', { animal: null, calcAge }));

app.get('/admin/animals/:id/edit', requireAdmin, async (req, res) => {
  const result = await pool.query('SELECT * FROM animals WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).send('Not found');
  res.render('admin/animal-form', { animal: formatAnimal(result.rows[0]), calcAge });
});

app.post('/admin/animals', requireAdmin, upload.array('photos', 10), async (req, res) => {
  const photos = req.files ? req.files.map(f => f.path) : [];
  await pool.query(
    'INSERT INTO animals (id, name, nickname, species, breed, birthday, personality, description, chat_personality, photos, featured) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
    [uuidv4(), req.body.name, req.body.nickname, req.body.species, req.body.breed, req.body.birthday, req.body.personality, req.body.description, req.body.chatPersonality, photos, req.body.featured === 'on']
  );
  res.redirect('/admin/animals');
});

app.post('/admin/animals/:id', requireAdmin, upload.array('photos', 10), async (req, res) => {
  const newPhotos = req.files ? req.files.map(f => f.path) : [];
  let existingPhotos = req.body.existingPhotos ? (Array.isArray(req.body.existingPhotos) ? req.body.existingPhotos : [req.body.existingPhotos]) : [];
  const deletePhotos = req.body.deletePhotos ? (Array.isArray(req.body.deletePhotos) ? req.body.deletePhotos : [req.body.deletePhotos]) : [];
  existingPhotos = existingPhotos.filter(p => !deletePhotos.includes(p));
  await pool.query(
    'UPDATE animals SET name=$1, nickname=$2, species=$3, breed=$4, birthday=$5, personality=$6, description=$7, chat_personality=$8, photos=$9, featured=$10 WHERE id=$11',
    [req.body.name, req.body.nickname, req.body.species, req.body.breed, req.body.birthday, req.body.personality, req.body.description, req.body.chatPersonality, [...existingPhotos, ...newPhotos], req.body.featured === 'on', req.params.id]
  );
  res.redirect('/admin/animals');
});

app.post('/admin/animals/:id/delete', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM animals WHERE id = $1', [req.params.id]);
  res.redirect('/admin/animals');
});

app.get('/admin/bookings', requireAdmin, async (req, res) => {
  const bookings = (await pool.query('SELECT * FROM bookings ORDER BY created_at DESC')).rows;
  res.render('admin/bookings', { bookings });
});

app.post('/admin/bookings/:id/status', requireAdmin, async (req, res) => {
  await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [req.body.status, req.params.id]);
  res.redirect('/admin/bookings');
});

app.get('/admin/settings', requireAdmin, async (req, res) => {
  const settings = formatSettings((await pool.query('SELECT * FROM settings WHERE id = 1')).rows[0]);
  res.render('admin/settings', { settings });
});

app.post('/admin/settings', requireAdmin, upload.single('heroImage'), async (req, res) => {
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
