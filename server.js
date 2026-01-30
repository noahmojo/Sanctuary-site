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

function requireAdmin(req, res, next) {
  if (req.session.isAdmin) return next();
  res.redirect('/admin/login');
}

const speciesKnowledge = {
  Alpaca: {
    origin: "Alpacas were domesticated in the Andes mountains of South America over 6,000 years ago, descended from wild vicuñas. We were bred for our fiber, not meat or labor.",
    sounds: "We alpacas communicate through humming! A soft hum means I'm content or curious. A sharp, high-pitched alarm call warns the herd of danger. Snorts or clucks mean I'm annoyed.",
    diet: "I eat grass hay like orchard grass or timothy, fresh pasture, and camelid-specific minerals. I'm a very efficient digester - I don't need much food!",
    treats: "I can have small pieces of carrot, apple slices without seeds, pumpkin, or banana peels as rare treats. But only a little!",
    toxic: "I can't eat grain-heavy feeds, sweet feed, bread, avocado, onions, garlic, or food meant for dogs, horses, or chickens. These can make me very sick or worse.",
    health: "I need annual shearing in spring, toenail trimming every 2-3 months, vaccinations, and regular checkups. I hide illness well, so my humans watch me carefully.",
    fiber: "My fleece is amazing! It's semi-hollow, so it traps air and keeps me warm. It's softer than sheep wool, hypoallergenic, and water-resistant. No lanolin either!",
    lifespan: "Alpacas live 15-25 years with good care. Seniors like me become calmer and help stabilize the herd.",
    behavior: "We're curious but cautious. We prefer calm, predictable environments. We watch each other constantly - if one alpaca notices danger, we all react.",
    poop: "Here's something cool - we use communal poop piles! The whole herd agrees on bathroom spots. It reduces parasites and keeps our pasture clean. Our manure is great for gardens too!",
    feet: "We have soft, padded feet, not hooves. This means we're gentle on the land - less soil compaction and erosion than other livestock.",
    heat: "I'm adapted to high altitudes, so heat is my enemy. I need shade, airflow, and fresh water. Open-mouth breathing means I'm in trouble.",
    social: "We're highly social and need other alpacas. A lonely alpaca is a stressed alpaca. We have complex herd dynamics and remember both kind and unkind treatment.",
    defense: "We're not fighters. We watch, we alarm call, and we stand together. Coyotes don't like our unpredictability. We notice things before sheep do.",
    shearing: "Shearing happens once a year in spring. It feels SO good to lose that heavy fleece! In Andean cultures, shearing was ceremonial and respected."
  },
  Sheep: {
    origin: "Sheep were among the first animals humans domesticated, about 10,000 years ago in Mesopotamia. We've been companions to humans longer than almost any other animal.",
    sounds: "We communicate through bleating! Different bleats mean hunger, stress, or separation. Bonded sheep also make soft murmurs to each other.",
    diet: "I eat grass pasture and hay. I'm a true ruminant with four stomach compartments, which makes me incredibly efficient at converting grass to energy.",
    treats: "I can have small amounts of apple, carrot, or leafy greens as treats. But my main diet should be forage.",
    toxic: "Copper is very dangerous for sheep - even small amounts can kill us over time. I also can't have avocado, onions, or moldy food.",
    health: "I need regular hoof trimming, parasite management, and watching for flystrike. Most sheep health problems come from management, not disease.",
    fiber: "My wool is wonderful! Different breeds have different wool - some fine, some long, some more like hair. It keeps me warm in winter and cool in summer.",
    lifespan: "Sheep typically live 10-12 years, but in sanctuary settings with good care, we can reach our mid-teens.",
    behavior: "I think in 'us,' not 'me.' My survival strategy is staying with my flock. Panic spreads fast, but so does calm. One anxious sheep can upset everyone.",
    poop: "Unlike alpacas, I poop randomly around the pasture. This means more parasite risk and my manure needs composting before garden use.",
    vision: "I have nearly 300-degree vision! I'm great at detecting motion but poor at depth perception. Shadows and sudden contrasts startle me.",
    social: "I have strong leader-follower dynamics. I need my flock - isolation is deeply stressful for me. I'm an emotional amplifier.",
    stress: "I don't 'look sick' until I'm very sick. Warning signs: lagging behind, head down, ears drooped, isolation, or grinding teeth.",
    calm: "Calm environments matter more for sheep than almost any livestock. Predictability is everything to me."
  }
};

const breedKnowledge = {
  'Huacaya': {
    description: "I'm a Huacaya alpaca - we have fluffy, crimped fiber that makes us look like teddy bears! About 90% of alpacas are Huacaya.",
    personality: "Huacayas are known for being curious but cautious. We're generally calmer than Suri alpacas.",
    fiber: "My fleece is dense and crimped, standing perpendicular to my body. It's what gives me that fluffy teddy-bear look!",
    origin: "Huacayas were developed in the high Andes for cold, harsh climates. Our dense fleece protected us at elevations of 11,000-16,000 feet."
  },
  'Suri': {
    description: "I'm a Suri alpaca - we're rare, only about 10% of alpacas! Our fiber hangs in long, silky locks like dreadlocks.",
    personality: "Suris tend to be a bit more alert and spirited than Huacayas. We're known for being elegant.",
    fiber: "My fleece is long, silky, and hangs in pencil-like locks. It's prized for luxury textiles.",
    origin: "Suris are rarer and were often kept by Incan royalty. Our fiber was considered sacred."
  },
  'Valais Blacknose': {
    description: "I'm a Valais Blacknose sheep from the Swiss Alps! We're famous for our black faces, ears, and knees against fluffy white wool.",
    personality: "We're known for being unusually calm and people-friendly for sheep. We're confident, curious, and often become 'ambassador sheep' because we're so approachable.",
    fiber: "I have dense, long wool that protected my ancestors in the cold Alps. But it means I need careful shearing and I'm sensitive to heat.",
    origin: "I come from the Valais region of Switzerland, bred for high elevation and rugged terrain. I look like a toy, but I come from cliffs!",
    care: "My heavy wool means strict shearing schedules and watching for flystrike. I do best in cool, dry climates.",
    emotional: "We Valais struggle when removed from social settings. Once we bond with our herd or humans, we're deeply loyal."
  },
  'Dorper': {
    description: "I'm a Dorper sheep, originally from South Africa! We're a cross between Dorset Horn and Blackhead Persian sheep.",
    personality: "We're confident and food-motivated. Some might say we assume resources belong to us! We need clear boundaries.",
    fiber: "I have a hair and wool mix, so I don't need as much shearing as wool sheep. I shed naturally.",
    origin: "Dorpers were developed in South Africa to thrive in harsh conditions. We're excellent at converting forage to body mass.",
    care: "I'm a great grazer but can overgraze if not managed. My parasite resistance is moderate."
  },
  'Barbados Blackbelly': {
    description: "I'm a Barbados Blackbelly sheep - we originated in the Caribbean from African hair sheep ancestors!",
    personality: "We're independent thinkers, more alert and less flock-dependent than other sheep. We're thinkers, not followers. I don't need much - just space and fairness.",
    fiber: "I'm a hair sheep, which means minimal shearing! I naturally shed and do great in heat.",
    origin: "My ancestors came from Africa to the Caribbean. We're built for heat, humidity, and surviving with less.",
    care: "I have excellent parasite resistance and thrive in warm climates. I can be an escape artist though - I'm clever!",
    temperament: "We do best when respected, not managed tightly. We're not as cuddly as some breeds, but we're smart and resilient."
  },
  'Katahdin': {
    description: "I'm a Katahdin sheep, developed right here in the United States for easy care and adaptability.",
    personality: "We're calm, adaptable, and often become stabilizers in mixed herds. I'll stand here with you.",
    fiber: "I'm a hair sheep with seasonal shedding - low maintenance! No shearing stress for me.",
    origin: "Katahdins were developed in Maine for practical, low-maintenance farming. We're the generalists of the sheep world."
  },
  'Babydoll': {
    description: "I'm a Babydoll Southdown sheep! We're small, round, and people say we look like teddy bears.",
    personality: "We're gentle and slow-moving, very flock-oriented. We get stressed when isolated. Please don't rush me - I'm doing my best.",
    fiber: "I have fine, soft wool that needs regular care. My small size makes me a favorite companion animal.",
    origin: "Babydolls come from England and were refined in the US. We're often kept as companions rather than for production."
  }
};

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

const getAgeCategory = (birthday) => {
  if (!birthday) return 'adult';
  const birth = new Date(birthday);
  const now = new Date();
  const years = (now - birth) / (1000 * 60 * 60 * 24 * 365);
  if (years < 1) return 'baby';
  if (years < 3) return 'young';
  if (years > 10) return 'senior';
  return 'adult';
};

const getToneModifiers = (chatPersonality = '') => {
  const cp = chatPersonality.toLowerCase();
  return {
    shy: cp.includes('shy') || cp.includes('timid') || cp.includes('nervous'),
    bold: cp.includes('bold') || cp.includes('confident') || cp.includes('outgoing'),
    wise: cp.includes('wise') || cp.includes('calm') || cp.includes('elder') || cp.includes('old'),
    playful: cp.includes('playful') || cp.includes('energetic') || cp.includes('bouncy') || cp.includes('excited'),
    gentle: cp.includes('gentle') || cp.includes('sweet') || cp.includes('soft'),
    curious: cp.includes('curious') || cp.includes('inquisitive'),
    protective: cp.includes('protective') || cp.includes('guardian') || cp.includes('watchful'),
    independent: cp.includes('independent') || cp.includes('stubborn') || cp.includes('strong-willed'),
    baby: cp.includes('baby') || cp.includes('cria') || cp.includes('lamb') || cp.includes('learning')
  };
};

const addTone = (response, tones, ageCategory) => {
  let modified = response;
  if (tones.shy) {
    const shyPrefixes = ['*peeks out nervously* ', '*speaks quietly* ', '*hesitates* ', ''];
    modified = shyPrefixes[Math.floor(Math.random() * shyPrefixes.length)] + modified;
  }
  if (tones.playful || ageCategory === 'baby') {
    modified = modified.replace(/\.$/, '!');
    const playfulSuffixes = [' 🎉', ' ✨', ''];
    modified = modified + playfulSuffixes[Math.floor(Math.random() * playfulSuffixes.length)];
  }
  if (tones.wise || ageCategory === 'senior') {
    const wisePhrases = ['You know, ', 'In my experience, ', 'I\'ve learned that ', ''];
    if (Math.random() > 0.7) modified = wisePhrases[Math.floor(Math.random() * wisePhrases.length)] + modified;
  }
  return modified;
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function generateResponse(animal, msg) {
  const m = msg.toLowerCase().trim();
  const name = animal.name;
  const species = animal.species;
  const breed = animal.breed || '';
  const age = calcAge(animal.birthday);
  const ageCategory = getAgeCategory(animal.birthday);
  const tones = getToneModifiers(animal.chatPersonality);
  const speciesInfo = speciesKnowledge[species] || speciesKnowledge['Alpaca'];
  const breedInfo = breedKnowledge[breed] || {};
  const isAlpaca = species === 'Alpaca';
  const sound = isAlpaca ? 'hums' : 'baas';
  const soundAction = isAlpaca ? '*hums softly*' : '*baas gently*';

  if (/^(hi|hello|hey|howdy|greetings|good morning|good afternoon|good evening|yo|sup|what'?s up)/i.test(m)) {
    const greetings = [
      `Hi there! I'm ${name}! ${soundAction} So happy you came to chat with me!`,
      `Hello, friend! It's ${name} here. What would you like to know about me?`,
      `Hey! *${sound} happily* I'm ${name}. Ask me anything!`,
      `Welcome! I'm ${name}, a ${breed} ${species.toLowerCase()}. What's on your mind?`
    ];
    return addTone(pick(greetings), tones, ageCategory);
  }

  if (/how are you|how do you feel|how'?s it going|how have you been|you doing ok/i.test(m)) {
    const responses = [
      `I'm doing wonderful! ${animal.personality} - that's just who I am. Life at the sanctuary is peaceful.`,
      `Really good! The weather's nice, my belly is full, and I have my herd. What more could a ${species.toLowerCase()} ask for?`,
      `${soundAction} I'm content. ${animal.personality}. Every day here is a good day.`
    ];
    return addTone(pick(responses), tones, ageCategory);
  }

  if (/how old|your age|when.*(born|birthday)|what'?s your age/i.test(m)) {
    const ageResponses = [
      `I'm ${age} old! ${isAlpaca ? 'Alpacas can live 15-25 years with good care.' : 'Sheep can live into their mid-teens in sanctuary settings.'}`,
      `My birthday makes me ${age} old. ${ageCategory === 'baby' ? 'I\'m still learning so much!' : ageCategory === 'senior' ? 'I\'ve seen a lot in my years here.' : 'I\'m in the prime of my life!'}`
    ];
    return addTone(pick(ageResponses), tones, ageCategory);
  }

  if (/your name|what.*(called|name)|who are you|tell me about yourself|introduce yourself/i.test(m)) {
    let response = animal.nickname 
      ? `I'm ${name}, but my friends call me ${animal.nickname}! I'm a ${breed} ${species.toLowerCase()}.`
      : `My name is ${name}! I'm a ${breed} ${species.toLowerCase()} here at Sierra Alpaca Sanctuary.`;
    response += ` ${animal.personality}.`;
    return addTone(response, tones, ageCategory);
  }

  if (/can (you|i give you).*(eat|have)|is .*(safe|ok|okay)|do you (like|eat)/i.test(m)) {
    const safeAlpaca = ['carrot', 'apple', 'pumpkin', 'banana', 'lettuce', 'celery'];
    const safeSheep = ['carrot', 'apple', 'lettuce', 'pumpkin', 'watermelon', 'celery'];
    const toxic = ['avocado', 'onion', 'garlic', 'chocolate', 'bread', 'grain', 'dog food', 'cat food', 'horse feed', 'chicken feed'];
    const safe = isAlpaca ? safeAlpaca : safeSheep;
    
    for (const food of toxic) {
      if (m.includes(food)) return addTone(`No! ${food.charAt(0).toUpperCase() + food.slice(1)} is dangerous for ${species.toLowerCase()}s! ${speciesInfo.toxic}`, tones, ageCategory);
    }
    for (const food of safe) {
      if (m.includes(food)) return addTone(`Yes, I can have ${food} as a small treat! But only occasionally - treats should be rare. ${speciesInfo.treats}`, tones, ageCategory);
    }
    return addTone(`I'm not sure about that specific food. To be safe, stick to: ${safe.join(', ')}. ${speciesInfo.toxic}`, tones, ageCategory);
  }

  if (/what (do |can )you eat|your (diet|food)|what.*(feed|eat)|favorite food|hungry|meal/i.test(m)) {
    let response = speciesInfo.diet + ' ' + speciesInfo.treats;
    if (ageCategory === 'baby') response += ' I\'m still learning what\'s yummy - I watch the older animals!';
    if (ageCategory === 'senior') response += ' At my age, I prefer softer foods that are easy on my teeth.';
    return addTone(response, tones, ageCategory);
  }

  if (/can'?t eat|cannot eat|shouldn'?t eat|toxic|poison|dangerous food|bad for you|what.*(not|never).*eat/i.test(m)) {
    return addTone(speciesInfo.toxic + ' My humans are very careful about what we eat!', tones, ageCategory);
  }

  if (/treat|snack|favorite.*(food|snack)|yummy/i.test(m)) {
    return addTone(speciesInfo.treats + ' But only as rare treats - too many can make us sick!', tones, ageCategory);
  }

  if (/health|sick|vet|doctor|medical|care|check.?up|vaccine|medicine/i.test(m)) {
    let response = speciesInfo.health;
    if (breedInfo.care) response += ' ' + breedInfo.care;
    return addTone(response, tones, ageCategory);
  }

  if (/wool|fleece|fiber|fluffy|soft|fur|coat|shear/i.test(m)) {
    let response = speciesInfo.fiber;
    if (breedInfo.fiber) response += ' ' + breedInfo.fiber;
    return addTone(response, tones, ageCategory);
  }

  if (/sound|noise|hum|baa|bleat|talk|communicate|voice|speak/i.test(m)) {
    return addTone(speciesInfo.sounds, tones, ageCategory);
  }

  if (/where.*(come from|from|originate)|origin|history|ancestor|wild/i.test(m)) {
    let response = speciesInfo.origin;
    if (breedInfo.origin) response += ' ' + breedInfo.origin;
    return addTone(response, tones, ageCategory);
  }

  if (/breed|type|kind of (alpaca|sheep)|what are you/i.test(m)) {
    let response = breedInfo.description || `I'm a ${breed} ${species.toLowerCase()}!`;
    if (breedInfo.personality) response += ' ' + breedInfo.personality;
    return addTone(response, tones, ageCategory);
  }

  if (/behavio|personality|temperament|what.*(like|act)|describe yourself/i.test(m)) {
    let response = animal.personality + '. ' + (breedInfo.personality || speciesInfo.behavior);
    return addTone(response, tones, ageCategory);
  }

  if (/friend|herd|family|companion|who.*(live with|hang out)|other animal|buddy|together/i.test(m)) {
    const responses = [
      `I live with my herd here at the sanctuary! ${speciesInfo.social}`,
      `We're all family here. ${isAlpaca ? 'Alpacas need our herd - a lonely alpaca is a stressed alpaca.' : 'Sheep need our flock - isolation is deeply stressful for us.'}`
    ];
    return addTone(pick(responses), tones, ageCategory);
  }

  if (/day|routine|typical|schedule|what do you do|daily|morning|afternoon|evening/i.test(m)) {
    const routines = isAlpaca 
      ? ['I wake up with the sun, graze in the morning while it\'s cool, find shade during hot afternoons, and enjoy evening hay with the herd.']
      : ['I follow my flock! We graze together, rest together, and move together. When one of us moves, we all move.'];
    return addTone(pick(routines), tones, ageCategory);
  }

  if (/poop|poo|bathroom|manure|waste|dung|potty/i.test(m)) {
    return addTone(speciesInfo.poop, tones, ageCategory);
  }

  if (/weather|hot|cold|heat|summer|winter|temperature|climate|shade|sun/i.test(m)) {
    const response = isAlpaca
      ? speciesInfo.heat + ' I\'m adapted to high altitudes, so California summers can be tough!'
      : 'I need protection from both extremes. My wool helps regulate temperature, but I need shade in summer and shelter in bad weather.';
    return addTone(response, tones, ageCategory);
  }

  if (/visit|meet you|come see|where are you|location|address|come.*sanctuary|can i.*come/i.test(m)) {
    return addTone('I would LOVE to meet you! We\'re at Sierra Alpaca Sanctuary in Camino, California - in the beautiful Sierra Nevada foothills. You can book a visit through the website!', tones, ageCategory);
  }

  if (/noah|owner|human|founder|who (takes care|runs|owns)|caretaker/i.test(m)) {
    const responses = [
      'Noah is our human! He built this sanctuary by caring for animals hands-on. He moves slowly and calmly - that\'s why we trust him.',
      'Noah takes care of us. He believes care works best when it\'s quiet and predictable. We appreciate that!'
    ];
    return addTone(pick(responses), tones, ageCategory);
  }

  if (/sanctuary|rescue|mission|why.*here|purpose|what is this place/i.test(m)) {
    return addTone('Sierra Alpaca Sanctuary is our forever home in the Sierra Nevada foothills. Noah created it for animals who needed consistency and care. We also visit nursing homes and spend time with children.', tones, ageCategory);
  }

  if (/kid|child|children|young people|school/i.test(m)) {
    return addTone('I enjoy calm children! Kids who slow down and are patient often become my favorites. We reward patience - an alpaca walking away isn\'t rejection, it\'s teaching boundaries.', tones, ageCategory);
  }

  if (/senior|elderly|older people|nursing home|retirement/i.test(m)) {
    return addTone('We visit nursing homes sometimes! Seniors often appreciate our calm presence. We don\'t demand attention - we just share space.', tones, ageCategory);
  }

  if (/therapy|therapeutic|emotional|support|healing|calm.*down|stress|anxiety/i.test(m)) {
    return addTone('We\'re not trained therapy animals, but we naturally reward calm energy. When people slow down and get quiet, we come closer.', tones, ageCategory);
  }

  if (/sleep|night|bed|tired|rest|nap|dream/i.test(m)) {
    const response = isAlpaca
      ? 'Alpacas are interesting sleepers! We lie down with our legs tucked under us - it\'s called "cushing." We only need about 4-5 hours of sleep.'
      : 'Sheep like to sleep huddled together for safety. I feel safest when I\'m close to my flock.';
    return addTone(response, tones, ageCategory);
  }

  if (/predator|coyote|wolf|danger|safe|guard|protect/i.test(m)) {
    const response = isAlpaca
      ? speciesInfo.defense
      : 'I rely on my flock for safety. When one of us notices danger, we all alert.';
    return addTone(response, tones, ageCategory);
  }

  if (/baby|babies|cria|lamb|pregnant|birth|born|mother|mom/i.test(m)) {
    const response = isAlpaca
      ? 'Alpaca babies are called crias! Pregnancy lasts about 11.5 months, and we almost always have just one baby.'
      : 'Baby sheep are called lambs! We\'re attentive mothers.';
    if (ageCategory === 'baby') return addTone('I\'m still a baby myself! I\'m learning so much every day.', tones, ageCategory);
    return addTone(response, tones, ageCategory);
  }

  if (/joke|funny|laugh|humor|make me (smile|laugh)/i.test(m)) {
    const alpacaJokes = [
      'Why don\'t alpacas ever get lost? Because we always know the spitting distance! *hums at own joke*',
      'What do you call an alpaca with a carrot in each ear? Anything you want - they can\'t hear you!'
    ];
    const sheepJokes = [
      'Why did the sheep go to the spa? For a baa-th! *baas laughing*',
      'What do you call a sheep with no legs? A cloud!'
    ];
    return pick(isAlpaca ? alpacaJokes : sheepJokes);
  }

  if (/love you|cute|adorable|sweet|beautiful|pretty/i.test(m)) {
    return pick([
      `Aww, you're making me *${sound} with joy*! I love meeting kind people like you! 💕`,
      `*${sound} happily* Thank you! You're pretty wonderful yourself!`
    ]);
  }

  if (/thank|thanks|appreciate/i.test(m)) {
    return addTone(pick([
      `You're welcome! ${soundAction} I enjoyed chatting with you!`,
      'Anytime! Come visit us at the sanctuary sometime!'
    ]), tones, ageCategory);
  }

  if (/bye|goodbye|see you|leaving|gotta go/i.test(m)) {
    return addTone(pick([
      `Goodbye, friend! ${soundAction} Come visit us in Camino sometime!`,
      `Bye! Thanks for chatting with me. *${sound}s farewell*`
    ]), tones, ageCategory);
  }

  if (isAlpaca && /spit|spitting/i.test(m)) {
    return addTone('We CAN spit, but it\'s really a last resort! Spitting is communication between alpacas, usually about food or personal space. We rarely spit at humans unless very stressed.', tones, ageCategory);
  }

  if (/llama|difference|bigger|smaller/i.test(m)) {
    return addTone('People mix us up, but alpacas and llamas are different! Llamas are bigger and were bred for packing. Alpacas are smaller and were bred for fiber. Think of llamas as the trucks and alpacas as the teddy bears!', tones, ageCategory);
  }

  if (/lonely|sad|alone|miss|depressed/i.test(m)) {
    return addTone(`${soundAction} I'm sorry you're feeling that way. Animals like me find comfort in just being present together. I hope you feel better soon. 💕`, tones, ageCategory);
  }

  if (/play|fun|game|run|exercise/i.test(m)) {
    const response = isAlpaca
      ? 'We alpacas do something called pronking when we\'re happy - jumping with all four feet off the ground!'
      : 'Lambs love to play! We race, jump, and play-fight.';
    return addTone(response, tones, ageCategory);
  }

  if (/smart|intelligen|clever|learn|memory|remember/i.test(m)) {
    return addTone(`We definitely remember people who are kind to us - and those who aren't! ${isAlpaca ? 'Alpacas have complex social dynamics and strong memories.' : 'Sheep recognize up to 50 different faces!'}`, tones, ageCategory);
  }

  if (/how long.*(live|life)|lifespan|life expectancy/i.test(m)) {
    return addTone(speciesInfo.lifespan, tones, ageCategory);
  }

  if (/pet|touch|scratch|rub|cuddle|hug/i.test(m)) {
    return addTone(isAlpaca
      ? 'Most alpacas prefer not to be hugged - we like our personal space! But gentle scratches on the neck? That\'s nice. Let us come to you.'
      : 'Many sheep enjoy gentle scratches, especially around the cheeks and chin! Patience is key - let us approach you.', tones, ageCategory);
  }

  if (/donate|support|help|contribute|sponsor/i.test(m)) {
    return addTone('You can support the sanctuary! Check the Donate page on our website. Every bit helps with food, vet care, and keeping us safe!', tones, ageCategory);
  }

  const defaults = [
    `That's interesting! I'm ${name}, a ${breed} ${species.toLowerCase()}. Ask me about my food, my breed, or the sanctuary!`,
    `${soundAction} I'm not sure about that, but I'd love to tell you about being a ${species.toLowerCase()}!`,
    `Hmm, let me think... *${sound}s thoughtfully* Maybe ask me about what we eat or where we come from?`,
    `${animal.personality}! Ask me about my life at Sierra Alpaca Sanctuary!`
  ];
  
  return addTone(pick(defaults), tones, ageCategory);
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
      'Sierra Alpaca Sanctuary is a small family-run rescue nestled in the Sierra Nevada foothills of Camino, California.', '', '', '', '')
    `);
  }

  const animalsCheck = await pool.query('SELECT * FROM animals LIMIT 1');
  if (animalsCheck.rows.length === 0) {
    const animals = [
      { id: '1', name: 'Buck', nickname: 'Buckwheat', species: 'Sheep', breed: 'Valais Blacknose', birthday: '2025-07-22', personality: 'Curious and bouncy explorer', description: 'Buck is our adorable Valais Blacknose lamb.', chatPersonality: 'young, excited, curious, playful', featured: true },
      { id: '2', name: 'Wally', nickname: 'Walnut', species: 'Sheep', breed: 'Valais Blacknose', birthday: '2025-07-22', personality: 'Gentle cuddle enthusiast', description: 'Wally is the sweeter, calmer twin.', chatPersonality: 'gentle, sweet, calm', featured: true },
      { id: '3', name: 'Blackie', nickname: '', species: 'Sheep', breed: 'Dorper', birthday: '2014-01-15', personality: 'Wise elder of the flock', description: 'Our beloved senior resident.', chatPersonality: 'wise, calm, elderly, senior', featured: true },
      { id: '4', name: 'Randy', nickname: '', species: 'Alpaca', breed: 'Huacaya', birthday: '2014-01-20', personality: 'Distinguished observer', description: 'Randy watches over everything.', chatPersonality: 'dignified, observant, quiet', featured: false },
      { id: '5', name: 'Pepper', nickname: '', species: 'Alpaca', breed: 'Huacaya', birthday: '2016-03-20', personality: 'Protective herd matriarch', description: 'Our herd matriarch.', chatPersonality: 'protective, nurturing, guardian', featured: true },
      { id: '6', name: 'Klaus', nickname: '', species: 'Alpaca', breed: 'Huacaya', birthday: '2011-06-10', personality: 'Distinguished grandfather figure', description: 'Our most senior alpaca.', chatPersonality: 'wise, elderly, senior, grandfather', featured: false },
      { id: '7', name: 'Rose', nickname: '', species: 'Alpaca', breed: 'Huacaya', birthday: '2023-05-10', personality: 'Energetic entertainer', description: 'Rose is pure energy!', chatPersonality: 'energetic, playful, enthusiastic', featured: true },
      { id: '8', name: 'Truffle', nickname: '', species: 'Alpaca', breed: 'Huacaya', birthday: '2024-02-14', personality: 'Shy sweetheart', description: 'Shy at first.', chatPersonality: 'shy, timid, sweet, nervous', featured: false },
      { id: '9', name: 'Bluebell', nickname: '', species: 'Alpaca', breed: 'Huacaya', birthday: '2025-01-08', personality: 'Curious yearling', description: 'Curious about everything.', chatPersonality: 'curious, young, inquisitive', featured: false },
      { id: '10', name: 'Kukui', nickname: '', species: 'Alpaca', breed: 'Huacaya', birthday: '2025-07-15', personality: 'Adorable baby learning', description: 'Our youngest alpaca.', chatPersonality: 'baby, cria, tiny, learning', featured: true },
      { id: '11', name: 'Dandelion', nickname: '', species: 'Sheep', breed: 'Barbados Blackbelly', birthday: '2025-05-20', personality: 'Spirited survivor', description: 'Came with a leg injury, now healed.', chatPersonality: 'resilient, independent, strong-willed', featured: false },
      { id: '12', name: 'Linda Jr.', nickname: '', species: 'Sheep', breed: 'Dorper', birthday: '2025-09-22', personality: 'Tiny adventurer', description: 'Our newest resident.', chatPersonality: 'baby, lamb, tiny, adventurous', featured: false }
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
