const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dru9wjewk',
  api_key: process.env.CLOUDINARY_API_KEY || '162939922515555',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'SNX1JYnIoZKE5KxmI_6Fhh3pZTw'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sanctuary',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  }
});
const upload = multer({ storage });

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DATA_DIR = './data';
const ensureData = () => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync('./public/uploads')) fs.mkdirSync('./public/uploads', { recursive: true });
  
  const animals = [
    { id: '1', name: 'Buck', nickname: 'Buckwheat', species: 'Sheep', breed: 'Valais Blacknose', birthday: '2025-07-22', personality: 'Curious and bouncy explorer', description: 'Buck is our adorable Valais Blacknose lamb with the fluffiest wool and cutest black face. He loves exploring every corner of the sanctuary with his brother Wally.', photos: [], featured: true, chatPersonality: 'young, excited, curious about everything, loves his brother Wally, bouncy and playful, uses lots of exclamation points' },
    { id: '2', name: 'Wally', nickname: 'Walnut', species: 'Sheep', breed: 'Valais Blacknose', birthday: '2025-07-22', personality: 'Gentle cuddle enthusiast', description: 'Wally is the sweeter, calmer twin of Buck. He loves nothing more than gentle head scratches and following visitors around hoping for cuddles.', photos: [], featured: true, chatPersonality: 'gentle, sweet, loves cuddles and head scratches, calmer than his brother Buck, affectionate, soft-spoken' },
    { id: '3', name: 'Blackie', species: 'Sheep', breed: 'Dorper', birthday: '2014-01-15', personality: 'Wise elder of the flock', description: 'At 12 years old, Blackie is our beloved senior resident. His calm presence brings peace to the entire sanctuary, and younger animals often seek his company.', photos: [], featured: true, chatPersonality: 'wise, calm, elderly, speaks slowly and thoughtfully, has seen many seasons, gives advice, peaceful, patient' },
    { id: '4', name: 'Randy', species: 'Alpaca', breed: 'Huacaya', birthday: '2014-01-20', personality: 'Distinguished observer', description: 'Randy watches over everything with quiet dignity. His expressive eyes and magnificent fiber make him one of our most photogenic residents.', photos: [], featured: false, chatPersonality: 'dignified, observant, thoughtful, proud of his fiber, watches everything carefully, wise but not as talkative as others' },
    { id: '5', name: 'Pepper', species: 'Alpaca', breed: 'Huacaya', birthday: '2016-03-20', personality: 'Protective herd matriarch', description: 'Pepper keeps everyone in line as our herd matriarch. She is fiercely protective of the younger alpacas while being gentle with visitors.', photos: [], featured: true, chatPersonality: 'nurturing, protective, motherly, keeps everyone in line, caring but firm, responsible, looks after the young ones' },
    { id: '6', name: 'Klaus', species: 'Alpaca', breed: 'Huacaya', birthday: '2011-06-10', personality: 'Distinguished grandfather', description: 'Klaus is our most senior alpaca at 15 years. His incredibly soft fleece and gentle demeanor have made him a sanctuary favorite for over a decade.', photos: [], featured: false, chatPersonality: 'very elderly, wise grandfather figure, has the softest fleece, reminisces about old days, gentle, moves slowly, appreciates simple pleasures' },
    { id: '7', name: 'Rose', species: 'Alpaca', breed: 'Huacaya', birthday: '2023-05-10', personality: 'Energetic entertainer', description: 'Rose is pure energy! She is always the first to greet visitors with her signature hop-skip and loves showing off her prancing skills.', photos: [], featured: true, chatPersonality: 'very energetic, enthusiastic, loves to prance and show off, always excited, greets everyone first, bubbly, uses lots of exclamation marks' },
    { id: '8', name: 'Truffle', species: 'Alpaca', breed: 'Huacaya', birthday: '2024-02-14', personality: 'Shy sweetheart', description: 'Born on Valentine\'s Day, Truffle is shy at first but becomes incredibly affectionate once she trusts you. Her patience is worth the reward.', photos: [], featured: false, chatPersonality: 'shy, quiet at first, warms up slowly, very affectionate once comfortable, born on Valentines Day which she thinks is special, sweet' },
    { id: '9', name: 'Bluebell', species: 'Alpaca', breed: 'Huacaya', birthday: '2025-01-08', personality: 'Curious yearling', description: 'Bluebell just turned one and sees wonder in everything. Her shimmering fleece catches the sunlight beautifully as she explores the pastures.', photos: [], featured: false, chatPersonality: 'very curious, asks lots of questions, only 1 year old, learning about the world, beautiful shimmering fleece, innocent and wondering' },
    { id: '10', name: 'Kukui', species: 'Alpaca', breed: 'Huacaya', birthday: '2025-07-15', personality: 'Adorable baby', description: 'Kukui is our youngest alpaca, named after the Hawaiian state tree. This little one brings pure joy and stays close to the older alpacas learning how to be a proper alpaca.', photos: [], featured: true, chatPersonality: 'baby alpaca, very young and learning, stays close to older alpacas, name means candlenut in Hawaiian, sweet and innocent, still learning' },
    { id: '11', name: 'Dandelion', species: 'Sheep', breed: 'Barbados Blackbelly', birthday: '2025-05-20', personality: 'Spirited survivor', description: 'Dandelion came to us with a leg injury that has healed beautifully. His unbreakable spirit inspires everyone who meets him.', photos: [], featured: false, chatPersonality: 'tough, resilient, had a hurt leg but healed, spirited, doesnt let anything keep him down, optimistic, determined' },
    { id: '12', name: 'Linda Jr.', species: 'Sheep', breed: 'Dorper', birthday: '2025-09-22', personality: 'Tiny adventurer', description: 'Our newest and youngest resident, Linda Jr. may be small but has a huge personality. She follows the bigger sheep everywhere, learning the ropes.', photos: [], featured: false, chatPersonality: 'very tiny and young, only 4 months old, follows bigger sheep around, copies what they do, big personality in small body, adventurous' }
  ];

  const files = {
    'animals.json': JSON.stringify(animals, null, 2),
    'settings.json': JSON.stringify({
      siteName: 'Sierra Alpaca Sanctuary',
      tagline: 'Where every animal finds love',
      location: 'Camino, California',
      about: 'Nestled in the Sierra Nevada foothills, we provide a forever home for alpacas, sheep, and other barnyard friends. Our mission is to rescue, rehabilitate, and provide sanctuary while educating the community about these wonderful creatures.',
      donateUrl: '',
      email: '',
      phone: ''
    }, null, 2),
    'bookings.json': '[]'
  };
  
  Object.entries(files).forEach(([name, content]) => {
    const p = path.join(DATA_DIR, name);
    if (!fs.existsSync(p)) fs.writeFileSync(p, content);
  });
};
ensureData();

const readData = (file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
const writeData = (file, data) => fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));

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

// Public routes
app.get('/', (req, res) => {
  const animals = readData('animals.json');
  const settings = readData('settings.json');
  res.render('public/home', { animals, settings });
});

app.get('/animals', (req, res) => {
  let animals = readData('animals.json');
  const settings = readData('settings.json');
  const { species, sort } = req.query;
  if (species) animals = animals.filter(a => a.species === species);
  if (sort === 'age') animals.sort((a, b) => new Date(a.birthday) - new Date(b.birthday));
  if (sort === 'name') animals.sort((a, b) => a.name.localeCompare(b.name));
  const speciesList = [...new Set(readData('animals.json').map(a => a.species))];
  res.render('public/animals', { animals, settings, speciesList, currentSpecies: species, currentSort: sort });
});

app.get('/animal/:id', (req, res) => {
  const animals = readData('animals.json');
  const settings = readData('settings.json');
  const animal = animals.find(a => a.id === req.params.id);
  if (!animal) return res.status(404).send('Not found');
  res.render('public/animal', { animal, settings });
});

app.get('/chat/:id', (req, res) => {
  const animals = readData('animals.json');
  const settings = readData('settings.json');
  const animal = animals.find(a => a.id === req.params.id);
  if (!animal) return res.status(404).send('Not found');
  res.render('public/chat', { animal, settings, calcAge });
});

app.post('/api/chat/:id', (req, res) => {
  const animals = readData('animals.json');
  const animal = animals.find(a => a.id === req.params.id);
  if (!animal) return res.status(404).json({ error: 'Not found' });
  const { message } = req.body;
  const response = generateResponse(animal, message);
  res.json({ response });
});

function generateResponse(animal, msg) {
  const m = msg.toLowerCase();
  const name = animal.name;
  const age = calcAge(animal.birthday);
  
  if (m.includes('hello') || m.includes('hi') || m === 'hey') {
    const g = [`Hi there! I'm ${name}!`, `Hello friend! ${name} here!`, `Hey! So nice to meet you!`];
    return g[Math.floor(Math.random() * g.length)];
  }
  if (m.includes('how are you')) return `I'm doing great! Life at the sanctuary is wonderful. ${animal.personality}!`;
  if (m.includes('age') || m.includes('old') || m.includes('birthday')) return `I'm ${age} old! My birthday is ${new Date(animal.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.`;
  if (m.includes('eat') || m.includes('food') || m.includes('favorite food')) return animal.species === 'Alpaca' ? `I love fresh hay and grass! Sometimes we get carrot treats which are the BEST.` : `I'm a ${animal.breed} sheep, so I love good quality hay and fresh pasture grass. Treats are always welcome!`;
  if (m.includes('friend')) return `I have so many friends here! We have ${animal.species === 'Alpaca' ? 'sheep' : 'alpaca'} friends too. Everyone looks out for each other.`;
  if (m.includes('visit') || m.includes('meet you') || m.includes('come see')) return `I would LOVE to meet you! You can book a visit at the sanctuary. We're in Camino, California!`;
  if (m.includes('soft') || m.includes('wool') || m.includes('fleece')) return animal.species === 'Alpaca' ? `My fleece is super soft! Alpaca fiber is warmer than sheep wool and hypoallergenic. People love touching it!` : `My wool is quite nice! ${animal.breed} sheep like me have special coats.`;
  if (m.includes('name')) return animal.nickname ? `I'm ${name}, but my friends call me ${animal.nickname}!` : `My name is ${name}! The sanctuary people gave me this name.`;
  if (m.includes('love you') || m.includes('cute') || m.includes('adorable')) return `Aww, you're so sweet! I love meeting nice people like you! 💕`;
  if (m.includes('scared') || m.includes('nervous')) return `Don't worry, we're all very gentle here! I promise I'm friendly.`;
  
  const defaults = [
    `That's interesting! I'm just a ${animal.species.toLowerCase()} so I might not understand everything, but I love chatting!`,
    `Hmm, tell me more! I'm ${name} and I'm ${age} old. ${animal.personality}.`,
    `*tilts head* That's a good question! Life here at Sierra Alpaca Sanctuary is pretty wonderful.`,
    `I like talking with you! What else do you want to know about me?`
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

app.get('/book', (req, res) => {
  const settings = readData('settings.json');
  res.render('public/book', { settings, success: req.query.success });
});

app.post('/book', (req, res) => {
  const bookings = readData('bookings.json');
  bookings.push({
    id: uuidv4(),
    type: req.body.type,
    organization: req.body.organization,
    contact: req.body.contact,
    email: req.body.email,
    phone: req.body.phone,
    date: req.body.date,
    attendees: req.body.attendees,
    message: req.body.message,
    createdAt: new Date().toISOString(),
    status: 'pending'
  });
  writeData('bookings.json', bookings);
  res.redirect('/book?success=1');
});

app.get('/donate', (req, res) => {
  const settings = readData('settings.json');
  res.render('public/donate', { settings });
});

app.get('/about', (req, res) => {
  const settings = readData('settings.json');
  const animals = readData('animals.json');
  res.render('public/about', { settings, animals });
});

// Admin routes
app.get('/admin', (req, res) => {
  const animals = readData('animals.json');
  const settings = readData('settings.json');
  const bookings = readData('bookings.json');
  res.render('admin/dashboard', { animals, settings, bookings });
});

app.get('/admin/animals', (req, res) => {
  const animals = readData('animals.json');
  res.render('admin/animals', { animals, calcAge });
});

app.get('/admin/animals/new', (req, res) => res.render('admin/animal-form', { animal: null, calcAge }));

app.get('/admin/animals/:id/edit', (req, res) => {
  const animals = readData('animals.json');
  const animal = animals.find(a => a.id === req.params.id);
  if (!animal) return res.status(404).send('Not found');
  res.render('admin/animal-form', { animal, calcAge });
});

app.post('/admin/animals', upload.array('photos', 10), (req, res) => {
  const animals = readData('animals.json');
  animals.push({
    id: uuidv4(),
    name: req.body.name,
    nickname: req.body.nickname,
    species: req.body.species,
    breed: req.body.breed,
    birthday: req.body.birthday,
    personality: req.body.personality,
    description: req.body.description,
    chatPersonality: req.body.chatPersonality,
    photos: req.files ? req.files.map(f => f.path) : [],
    featured: req.body.featured === 'on'
  });
  writeData('animals.json', animals);
  res.redirect('/admin/animals');
});

app.post('/admin/animals/:id', upload.array('photos', 10), (req, res) => {
  const animals = readData('animals.json');
  const idx = animals.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).send('Not found');
  const newPhotos = req.files ? req.files.map(f => f.path) : [];
  const existingPhotos = req.body.existingPhotos ? (Array.isArray(req.body.existingPhotos) ? req.body.existingPhotos : [req.body.existingPhotos]) : [];
  animals[idx] = { ...animals[idx], name: req.body.name, nickname: req.body.nickname, species: req.body.species, breed: req.body.breed, birthday: req.body.birthday, personality: req.body.personality, description: req.body.description, chatPersonality: req.body.chatPersonality, photos: [...existingPhotos, ...newPhotos], featured: req.body.featured === 'on' };
  writeData('animals.json', animals);
  res.redirect('/admin/animals');
});

app.post('/admin/animals/:id/delete', (req, res) => {
  let animals = readData('animals.json');
  animals = animals.filter(a => a.id !== req.params.id);
  writeData('animals.json', animals);
  res.redirect('/admin/animals');
});

app.get('/admin/bookings', (req, res) => {
  const bookings = readData('bookings.json');
  res.render('admin/bookings', { bookings });
});

app.post('/admin/bookings/:id/status', (req, res) => {
  const bookings = readData('bookings.json');
  const idx = bookings.findIndex(b => b.id === req.params.id);
  if (idx !== -1) { bookings[idx].status = req.body.status; writeData('bookings.json', bookings); }
  res.redirect('/admin/bookings');
});

app.get('/admin/settings', (req, res) => {
  const settings = readData('settings.json');
  res.render('admin/settings', { settings });
});

app.post('/admin/settings', (req, res) => {
  writeData('settings.json', { siteName: req.body.siteName, tagline: req.body.tagline, location: req.body.location, about: req.body.about, donateUrl: req.body.donateUrl, email: req.body.email, phone: req.body.phone });
  res.redirect('/admin/settings');
});

app.listen(PORT, () => console.log(`Sanctuary running on port ${PORT}`));
