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
const upload = multer({ storage }
