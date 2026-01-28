// ------------------ IMPORTS ------------------ //
const express = require('express');
const cors = require('cors');

const app = express();

// ------------------ CORS AYARI ------------------ //
const allowedOrigins = [
  'https://bilet-app-frontend-1.onrender.com',
  'https://bilet-app-frontend-5.onrender.com'
];

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true); // Postman veya server-side request’ler için
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'CORS policy: Access denied for ' + origin;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// ------------------ BODY PARSER ------------------ //
app.use(express.json());

// ------------------ SEAT DATA ------------------ //
const rows = [];
for (let i = 0; i < 30; i++) {
  rows.push(i < 26 ? String.fromCharCode(65 + i) : "A" + String.fromCharCode(65 + i - 26));
}
const seatsPerRow = 30;

let soldSeats = [];   // Satın alınan koltuklar
let lockedSeats = {
  A1: { userId: "user1", timestamp: 123456 },
  B5: { userId: "user2", timestamp: 123457 }
};


// ------------------ ROUTES ------------------ //
app.get('/', (req, res) => {
    res.send('Bilet App Backend çalışıyor!');
});

// Koltuk durumunu gönder
app.get('/seats-status', (req, res) => {
  res.json({
    soldSeats,
    lockedSeats
  });
});


// Koltuk kilitle
app.post('/lock-seats', (req, res) => {
  const { selectedSeats, userId } = req.body;
  const locked = [];

  selectedSeats.forEach(seatId => {
    if (soldSeats.includes(seatId)) return;
    if (!lockedSeats[seatId]) {
      lockedSeats[seatId] = { userId, time: Date.now() };
      locked.push(seatId);
    }
  });

  res.json({ lockedSeats: locked });
});


// Koltuk unlock (iptal)
app.post('/unlock-seats', (req, res) => {
  const { selectedSeats, userId } = req.body;
  const unlocked = [];

  selectedSeats.forEach(seatId => {
    if (lockedSeats[seatId]?.userId === userId) {
      delete lockedSeats[seatId];
      unlocked.push(seatId);
    }
  });

  res.json({ unlockedSeats: unlocked });
});


// Checkout
app.post('/checkout', (req, res) => {
  const { cart, userId } = req.body;
  const purchased = [];

  cart.forEach(seatId => {
    if (lockedSeats[seatId]?.userId === userId && !soldSeats.includes(seatId)) {
      soldSeats.push(seatId);
      purchased.push(seatId);
      delete lockedSeats[seatId]; // Kilidi kaldır
    }
  });

  res.json({ purchased });
});

// ------------------ SERVER ------------------ //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT} portunda çalışıyor`));
