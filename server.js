const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '-')}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Data helpers
const DATA_DIR = './data';
const ensureData = () => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync('./public/uploads')) fs.mkdirSync('./public/uploads', { recursive: true });
  
  const files = {
    'animals.json': JSON.stringify([
      { id: '1', name: 'Blackie', species: 'Sheep', breed: 'Dorper', birthday: '2013-01-15', personality: 'Gentle and wise elder', description: 'Our senior resident who loves attention from visitors.', photos: [], featured: true },
      { id: '2', name: 'Pepper', species: 'Alpaca', breed: 'Huacaya', birthday: '2017-03-20', personality: 'Protective and nurturing', description: "Rose's mother and matriarch of our alpaca herd.", photos: [], featured: true },
      { id: '3', name: 'Rose', species: 'Alpaca', breed: 'Huacaya', birthday: '2021-05-10', personality: 'Energetic and playful', description: "Pepper's daughter, always first to greet visitors.", photos: [], featured: true },
      { id: '4', name: 'Dandelion', species: 'Ram', breed: 'Barbados Blackbelly', birthday: '2025-08-15', personality: 'Spirited little survivor', description: 'Came to us with a leg injury that has healed beautifully.', photos: [], featured: false },
      { id: '5', name: 'Randy', species: 'Lampaca', breed: 'Llama-Alpaca Cross', birthday: '2015-06-01', personality: 'Unique with striking blue eyes', description: 'A rare lampaca with part llama curiosity, part alpaca gentleness.', photos: [], featured: false }
    ], null, 2),
    'settings.json': JSON.stringify({
      siteName: 'Sierra Alpaca Sanctuary',
      tagline: 'A safe haven for alpacas and friends',
      about: 'We rescue and care for alpacas, sheep, and other barnyard animals in the beautiful Sierra Nevada foothills of Camino, California.',
      donateUrl: ''
    }, null, 2)
  };
  
  Object.entries(files).forEach(([name, content]) => {
    const p = path.join(DATA_DIR, name);
    if (!fs.existsSync(p)) fs.writeFileSync(p, content);
  });
};
ensureData();

const readData = (file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
const writeData = (file, data) => fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));

// Age calculator
const calcAge = (birthday) => {
  if (!birthday) return '';
  const birth = new Date(birthday);
  const now = new Date();
  const days = Math.floor((now - birth) / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  const years = Math.floor(days / 365);
  const mo = Math.floor((days % 365) / 30);
  return mo > 0 ? `${years} yr ${mo} mo` : `${years} years`;
};

// Make calcAge available in views
app.locals.calcAge = calcAge;

// ============ PUBLIC ROUTES ============
app.get('/', (req, res) => {
  const animals = readData('animals.json');
  const settings = readData('settings.json');
  res.render('public/home', { animals, settings });
});

app.get('/animals', (req, res) => {
  let animals = readData('animals.json');
  const settings = readData('settings.json');
  const { breed, sort } = req.query;
  
  if (breed) animals = animals.filter(a => a.breed === breed);
  if (sort === 'age') animals.sort((a, b) => new Date(a.birthday) - new Date(b.birthday));
  if (sort === 'name') animals.sort((a, b) => a.name.localeCompare(b.name));
  
  const breeds = [...new Set(readData('animals.json').map(a => a.breed))];
  res.render('public/animals', { animals, settings, breeds, currentBreed: breed, currentSort: sort });
});

app.get('/animal/:id', (req, res) => {
  const animals = readData('animals.json');
  const settings = readData('settings.json');
  const animal = animals.find(a => a.id === req.params.id);
  if (!animal) return res.status(404).send('Animal not found');
  res.render('public/animal', { animal, settings });
});

app.get('/donate', (req, res) => {
  const settings = readData('settings.json');
  res.render('public/donate', { settings });
});

// ============ ADMIN ROUTES ============
app.get('/admin', (req, res) => {
  const animals = readData('animals.json');
  const settings = readData('settings.json');
  res.render('admin/dashboard', { animals, settings });
});

app.get('/admin/animals', (req, res) => {
  const animals = readData('animals.json');
  res.render('admin/animals', { animals });
});

app.get('/admin/animals/new', (req, res) => {
  res.render('admin/animal-form', { animal: null });
});

app.get('/admin/animals/:id/edit', (req, res) => {
  const animals = readData('animals.json');
  const animal = animals.find(a => a.id === req.params.id);
  if (!animal) return res.status(404).send('Not found');
  res.render('admin/animal-form', { animal });
});

app.post('/admin/animals', upload.array('photos', 10), (req, res) => {
  const animals = readData('animals.json');
  const photos = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
  const animal = {
    id: uuidv4(),
    name: req.body.name,
    species: req.body.species,
    breed: req.body.breed,
    birthday: req.body.birthday,
    personality: req.body.personality,
    description: req.body.description,
    photos,
    featured: req.body.featured === 'on',
    createdAt: new Date().toISOString()
  };
  animals.push(animal);
  writeData('animals.json', animals);
  res.redirect('/admin/animals');
});

app.post('/admin/animals/:id', upload.array('photos', 10), (req, res) => {
  const animals = readData('animals.json');
  const idx = animals.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).send('Not found');
  
  const newPhotos = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
  const existingPhotos = req.body.existingPhotos ? (Array.isArray(req.body.existingPhotos) ? req.body.existingPhotos : [req.body.existingPhotos]) : [];
  
  animals[idx] = {
    ...animals[idx],
    name: req.body.name,
    species: req.body.species,
    breed: req.body.breed,
    birthday: req.body.birthday,
    personality: req.body.personality,
    description: req.body.description,
    photos: [...existingPhotos, ...newPhotos],
    featured: req.body.featured === 'on'
  };
  writeData('animals.json', animals);
  res.redirect('/admin/animals');
});

app.post('/admin/animals/:id/delete', (req, res) => {
  let animals = readData('animals.json');
  animals = animals.filter(a => a.id !== req.params.id);
  writeData('animals.json', animals);
  res.redirect('/admin/animals');
});

app.get('/admin/settings', (req, res) => {
  const settings = readData('settings.json');
  res.render('admin/settings', { settings });
});

app.post('/admin/settings', (req, res) => {
  const settings = {
    siteName: req.body.siteName,
    tagline: req.body.tagline,
    about: req.body.about,
    donateUrl: req.body.donateUrl
  };
  writeData('settings.json', settings);
  res.redirect('/admin/settings');
});

app.listen(PORT, () => console.log(`Sanctuary running on http://localhost:${PORT}`));
