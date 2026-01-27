const express = require('express');
const cors = require('cors');

const app = express();

// ✅ CORS ayarı: birden fazla frontend için izin
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

app.use(express.json());

// ✅ Backend veri
let soldSeats = [];     // Satılmış koltuklar
let lockedSeats = [];   // Geçici olarak seçilen koltuklar (sepette)

const rows = [];
for (let i = 0; i < 30; i++) {
  rows.push(i < 26 ? String.fromCharCode(65 + i) : "A" + String.fromCharCode(65 + i - 26));
}
const seatsPerRow = 30;

// ------------------ ROUTES ------------------ //

// Test endpoint
app.get('/', (req, res) => {
    res.send('Bilet App Backend çalışıyor!');
});

// 1️⃣ Koltuk durumunu döndür
app.get('/seats-status', (req, res) => {
  res.json({
    soldSeats,
    lockedSeats
  });
});

// 2️⃣ Koltuk kilitleme
app.post('/lock-seats', (req, res) => {
  const { selectedSeats, userId, isBonus } = req.body;

  const lockedThisRequest = [];

  selectedSeats.forEach(seatId => {
    if (!soldSeats.includes(seatId) && !lockedSeats.includes(seatId)) {
      lockedSeats.push(seatId);
      lockedThisRequest.push(seatId);
    }
  });

  res.json({ lockedSeats: lockedThisRequest });
});

// 3️⃣ Satın alma
app.post('/checkout', (req, res) => {
  const { cart } = req.body;

  const purchased = [];

  cart.forEach(seatId => {
    if (!soldSeats.includes(seatId)) {
      soldSeats.push(seatId);
      purchased.push(seatId);
    }
    // Satın alındıktan sonra lockedSeats’ten çıkar
    lockedSeats = lockedSeats.filter(id => id !== seatId);
  });

  res.json({ purchased });
});

// ------------------ SERVER ------------------ //

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT} portunda çalışıyor`));
