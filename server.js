const express = require('express');
const cors = require('cors');

const app = express(); // app burada tanımlanmalı

app.use(cors({ origin: 'https://bilet-app-frontend.onrender.com' }));
app.use(express.json());
app.get('/', (req, res) => {
    res.send('Bilet App Backend çalışıyor!');
});

// Burada route’lar ve diğer middleware’ler
app.get('/seats-status', (req, res) => {
    res.json({ soldSeats: [], lockedSeats: [] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server çalışıyor → http://localhost:${PORT}`));


// Satılmış ve locked koltukları tutacak örnek veri
let soldSeats = [];      // Satılmış koltuklar
let lockedSeats = [];    // Seçili / locked koltuklar
let userCart = {};       // Kullanıcı bazlı cart

// 1️⃣ Koltuk durumunu döndüren endpoint
app.get("/seats-status", (req, res) => {
  res.json({
    soldSeats,
    lockedSeats
  });
});

// 2️⃣ Lock seats (seçim)
app.post("/lock-seats", (req, res) => {
  const { selectedSeats, userId, isBonus } = req.body;
  userCart[userId] = userCart[userId] || { cart: [], bonusRemaining: 0 };
  const cart = userCart[userId];

  const locked = [];

  selectedSeats.forEach(id => {
    if (!soldSeats.includes(id) && !lockedSeats.includes(id)) {
      lockedSeats.push(id);
      locked.push(id);
      cart.cart.push(id);
    }
  });

  res.json({ lockedSeats: locked, cart });
});

// 3️⃣ Checkout
app.post("/checkout", (req, res) => {
  const { userId, cart: selectedCart } = req.body;
  const cart = userCart[userId];

  if (!cart) return res.json({ purchased: [], bonusRemaining: 0 });

  // Sepetteki koltukları satılmış yap
  selectedCart.forEach(id => {
    if (!soldSeats.includes(id)) soldSeats.push(id);
    lockedSeats = lockedSeats.filter(l => l !== id);
  });

  const purchased = [...selectedCart];
  cart.cart = [];
  cart.bonusRemaining = purchased.length; // her satın alınan koltuk için 1 bonus

  res.json({ purchased, bonusRemaining: cart.bonusRemaining });
});

app.listen(3000, () => console.log("Server çalışıyor → http://localhost:3000"));
