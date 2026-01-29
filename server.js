const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Cloudinary config
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

// Initialize database
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS animals (
      id TEXT PRIMARY KEY,
      name TEXT,
      nickname TEXT,
      species TEXT,
      breed TEXT,
      birthday TEXT,
      personality TEXT,
      description TEXT,
      chat_personality TEXT,
      photos TEXT[],
      featured BOOLEAN DEFAULT false
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      site_name TEXT,
      tagline TEXT,
      location TEXT,
      about TEXT,
      hero_image TEXT,
      donate_url TEXT,
      email TEXT,
      phone TEXT
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      type TEXT,
      organization TEXT,
      contact TEXT,
      email TEXT,
      phone TEXT,
      date TEXT,
      attendees TEXT,
      message TEXT,
      created_at TEXT,
      status TEXT
    )
  `);

  // Seed settings if empty
  const settingsCheck = await pool.query('SELECT * FROM settings WHERE id = 1');
  if (settingsCheck.rows.length === 0) {
    await pool.query(`
      INSERT INTO settings (id, site_name, tagline, location, about, hero_image, donate_url, email, phone)
      VALUES (1, 'Sierra Alpaca Sanctuary', 'Where every animal finds love', 'Camino, California', 
      'Nestled in the Sierra Nevada foothills, we provide a forever home for alpacas, sheep, and other barnyard friends.', '', '', '', '')
    `);
  }

  // Seed animals if empty
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

// Helper to format animal from DB
const formatAnimal = (row) => ({
  id: row.id,
  name: row.name,
  nickname: row.nickname,
  species: row.species,
  breed: row.breed,
  birthday: row.birthday,
  personality: row.personality,
  description: row.description,
  chatPersonality: row.chat_personality,
  photos: row.photos || [],
  featured: row.featured
});

const formatSettings = (row) => ({
  siteName: row.site_name,
  tagline: row.tagline,
  location: row.location,
  about: row.about,
  heroImage: row.hero_image,
  donateUrl: row.donate_url,
  email: row.email,
  phone: row.phone
});

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
  const speciesList = [...new Set(animals.map(a => a.species))];
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
  const { message } = req.body;
  const response = generateResponse(animal, message);
  res.json({ response });
});

function generateResponse(animal, msg) {
  const m = msg.toLowerCase();
  const name = animal.name;
  const age = calcAge(animal.birthday);
  if (m.includes('hello') || m.includes('hi') || m === 'hey') return [`Hi there! I'm ${name}!`, `Hello friend!`, `Hey!`][Math.floor(Math.random() * 3)];
  if (m.includes('how are you')) return `I'm doing great! ${animal.personality}!`;
  if (m.includes('age') || m.includes('old')) return `I'm ${age} old!`;
  if (m.includes('eat') || m.includes('food')) return animal.species === 'Alpaca' ? `I love fresh hay and grass!` : `I love hay and pasture grass!`;
  if (m.includes('name')) return animal.nickname ? `I'm ${name}, but friends call me ${animal.nickname}!` : `My name is ${name}!`;
  return [`That's interesting!`, `Tell me more!`, `I like talking with you!`][Math.floor(Math.random() * 3)];
}

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
  const allPhotos = [...existingPhotos, ...newPhotos];
  await pool.query(
    'UPDATE animals SET name=$1, nickname=$2, species=$3, breed=$4, birthday=$5, personality=$6, description=$7, chat_personality=$8, photos=$9, featured=$10 WHERE id=$11',
    [req.body.name, req.body.nickname, req.body.species, req.body.breed, req.body.birthday, req.body.personality, req.body.description, req.body.chatPersonality, allPhotos, req.body.featured === 'on', req.params.id]
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
    'UPDATE settings SET site_name=$1, tagline=$2, location=$3, about=$4, hero_image=$5, donate_url=$6, email=$7, phone=$8 WHERE id=1',
    [req.body.siteName, req.body.tagline, req.body.location, req.body.about, heroImage, req.body.donateUrl, req.body.email, req.body.phone]
  );
  res.redirect('/admin/settings');
});

app.listen(PORT, () => console.log(`Sanctuary running on port ${PORT}`));
