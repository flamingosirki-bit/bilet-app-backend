const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 900 koltuk
const rows = [];
for (let i = 0; i < 30; i++) {
  if (i < 26) rows.push(String.fromCharCode(65 + i));
  else rows.push("A" + String.fromCharCode(65 + i - 26));
}
const seatsPerRow = 30;

// Koltuk durumu
const allSeats = {};
rows.forEach(r => {
  for (let i = 1; i <= seatsPerRow; i++) {
    allSeats[`${r}${i}`] = "free";
  }
});

// Kullanıcı sepeti ve bonus
const users = {};

// Ana sayfa
app.get("/", (req, res) => {
  res.send("Bilet App Backend çalışıyor ✅");
});

// Koltuk kilitleme
app.post("/lock-seats", (req, res) => {
  const { selectedSeats, userId, isBonus } = req.body;
  if (!users[userId]) users[userId] = { cart: [], bonusRemaining: 0 };

  const lockedSeats = [];
  selectedSeats.forEach(seatId => {
    if (allSeats[seatId] === "free") {
      allSeats[seatId] = "locked";
      users[userId].cart.push(seatId);
      lockedSeats.push(seatId);
    }
  });

  res.json({ lockedSeats, cart: users[userId] });
});

// Ödeme
app.post("/checkout", (req, res) => {
  const { userId } = req.body;
  if (!users[userId]) return res.json({ purchased: [], bonusRemaining: 0 });

  const purchasedSeats = [];
  users[userId].cart.forEach(seatId => {
    allSeats[seatId] = "sold";
    purchasedSeats.push(seatId);
  });

  // Her satın alınan koltuk için bonus
  users[userId].bonusRemaining += purchasedSeats.length;
  users[userId].cart = [];

  res.json({ purchased: purchasedSeats, bonusRemaining: users[userId].bonusRemaining });
});

app.listen(PORT, () => console.log(`Server çalışıyor → http://localhost:${PORT}`));
