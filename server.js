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

app.get('/', (req, res) => {
    res.send('Bilet App Backend çalışıyor!');
});

// Diğer backend route’ları (lock-seats, seats-status, checkout) buraya gelecek

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT} portunda çalışıyor`));
