const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname));

app.get('/', (req, res) => res.render('public/home'));
app.get('/about', (req, res) => res.render('public/about'));
app.get('/animals', (req, res) => res.render('public/animals'));
app.get('/animal/:id', (req, res) => res.render('public/animal'));
app.get('/donate', (req, res) => res.render('public/donate'));
app.get('/book', (req, res) => res.render('public/book'));
app.get('/shop', (req, res) => res.render('public/shop'));
app.get('/cart', (req, res) => res.render('public/cart'));
app.get('/chat', (req, res) => res.render('public/chat'));
app.get('/product/:id', (req, res) => res.render('public/product'));
app.get('/order-success', (req, res) => res.render('public/order-success'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
