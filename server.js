users.push({
  id: "test-user-1",
  email: "test@test.com",
  passwordHash: await bcrypt.hash("123456", 10),
  bonus: 0
});

// ------------------ IMPORTS ------------------ //
const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ------------------ CORS AYARI ------------------ //
const allowedOrigins = [
  'https://bilet-app-frontend-1.onrender.com',
  'https://bilet-app-frontend-5.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.includes(origin)) {
      return callback(new Error('CORS error'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// ------------------ BODY PARSER ------------------ //
app.use(express.json());

// ------------------ SEAT DATA ------------------ //
let soldSeats = [];
let lockedSeats = {};

// ------------------ USER DATA ------------------ //
let users = [];

// ------------------ REGISTER ------------------ //
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email ve şifre zorunlu" });

  if (users.find(u => u.email === email))
    return res.status(400).json({ message: "Bu email zaten kayıtlı" });

  const passwordHash = await bcrypt.hash(password, 10);

  users.push({
    id: Date.now().toString(),
    email,
    passwordHash,
    bonus: 0
  });

  res.json({ message: "Kayıt başarılı" });
});

// ------------------ LOGIN ------------------ //
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user)
    return res.status(400).json({ message: "Kullanıcı bulunamadı" });

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch)
    return res.status(400).json({ message: "Şifre hatalı" });

  const token = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({
    token,
    userId: user.id,
    bonus: user.bonus
  });
});

// ------------------ LOCK CONFIG ------------------ //
const LOCK_TIMEOUT = 5 * 60 * 1000;

// ------------------ CLEAR LOCKS ------------------ //
function clearExpiredLocks() {
  const now = Date.now();
  for (const [seatId, info] of Object.entries(lockedSeats)) {
    if (now - info.timestamp > LOCK_TIMEOUT) {
      delete lockedSeats[seatId];
    }
  }
}

// ------------------ ROUTES ------------------ //
app.get('/', (req, res) => {
  res.send('Bilet App Backend çalışıyor!');
});

app.get('/seats-status', (req, res) => {
  clearExpiredLocks();
  const publicLockedSeats = {};
  for (const [seatId, info] of Object.entries(lockedSeats)) {
    publicLockedSeats[seatId] = { userId: info.userId };
  }
  res.json({ soldSeats, lockedSeats: publicLockedSeats });
});

app.post('/lock-seats', (req, res) => {
  const { selectedSeats, userId } = req.body;
  const now = Date.now();
  const locked = [];

  selectedSeats.forEach(seatId => {
    if (soldSeats.includes(seatId)) return;
    if (!lockedSeats[seatId] || lockedSeats[seatId].userId === userId) {
      lockedSeats[seatId] = { userId, timestamp: now };
      locked.push(seatId);
    }
  });

  res.json({ lockedSeats: locked });
});

app.post('/unlock-seats', (req, res) => {
  const { selectedSeats, userId } = req.body;
  selectedSeats.forEach(seatId => {
    if (lockedSeats[seatId]?.userId === userId) {
      delete lockedSeats[seatId];
    }
  });
  res.json({ success: true });
});

app.post('/checkout', (req, res) => {
  const { cart, userId } = req.body;
  const purchased = [];

  cart.forEach(seatId => {
    if (lockedSeats[seatId]?.userId === userId) {
      soldSeats.push(seatId);
      purchased.push(seatId);
      delete lockedSeats[seatId];
    }
  });

  res.json({ purchased });
});

// ------------------ SERVER ------------------ //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT} portunda çalışıyor`));

setInterval(clearExpiredLocks, 60 * 1000);
