const express = require("express");
const cors = require("cors");
const fs = require("fs");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// JSON dosyası: koltuk ve kullanıcı verilerini tutacak
const DATA_FILE = "data.json";

// Başlangıç verilerini yükle veya oluştur
let data;
if (fs.existsSync(DATA_FILE)) {
    data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
} else {
    const rows = [];
    for (let i = 0; i < 30; i++) {
        if (i < 26) rows.push(String.fromCharCode(65 + i));
        else rows.push("A" + String.fromCharCode(i - 26 + 65));
    }
    const seatsPerRow = 30;
    const allSeats = {};
    rows.forEach(r => {
        for (let i = 1; i <= seatsPerRow; i++) {
            allSeats[`${r}${i}`] = "free";
        }
    });
    const users = {};
    data = { allSeats, users };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Veriyi kaydet
function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Koltuk kilitleme
app.post("/lock-seats", (req, res) => {
    const { selectedSeats, userId, isBonus } = req.body;
    if (!data.users[userId]) data.users[userId] = { cart: [], bonusRemaining: 0 };

    const lockedSeats = [];
    selectedSeats.forEach(seatId => {
        if (data.allSeats[seatId] === "free") {
            data.allSeats[seatId] = "locked";
            data.users[userId].cart.push(seatId);
            lockedSeats.push(seatId);
        }
    });

    saveData(); // Değişiklikleri kaydet

    res.json({ lockedSeats, cart: data.users[userId] });
});

// Ödeme
app.post("/checkout", (req, res) => {
    const { userId } = req.body;
    if (!data.users[userId]) return res.json({ purchased: [], bonusRemaining: 0 });

    const purchasedSeats = [];
    data.users[userId].cart.forEach(seatId => {
        data.allSeats[seatId] = "sold";
        purchasedSeats.push(seatId);
    });

    // Bonus her satın alma için 1
    data.users[userId].bonusRemaining += purchasedSeats.length;
    data.users[userId].cart = [];

    saveData(); // Değişiklikleri kaydet

    res.json({ purchased: purchasedSeats, bonusRemaining: data.users[userId].bonusRemaining });
});

// Opsiyonel: tüm koltuk durumunu görmek
app.get("/seats", (req, res) => {
    res.json(data.allSeats);
});

app.listen(PORT, () => console.log(`Server çalışıyor → http://localhost:${PORT}`));
