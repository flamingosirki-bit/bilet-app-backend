const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());
app.use(cors());

let users = [];
let soldSeats = [];
let lockedSeats = {};

// TEST USER
(async ()=>{
  users.push({
    id:"1",
    email:"test@test.com",
    passwordHash: await bcrypt.hash("123456",10),
    bonus:0
  });
})();

app.post("/login", async (req,res)=>{
  const {email,password} = req.body;
  const user = users.find(u=>u.email===email);
  if(!user) return res.status(400).json({message:"Kullanıcı yok"});
  if(!await bcrypt.compare(password,user.passwordHash))
    return res.status(400).json({message:"Şifre yanlış"});

  res.json({ userId:user.id, bonus:user.bonus });
});

app.get("/seats-status",(req,res)=>{
  res.json({ soldSeats, lockedSeats });
});

app.post("/lock-seats",(req,res)=>{
  const {selectedSeats,userId} = req.body;
  const locked=[];
  selectedSeats.forEach(id=>{
    if(!soldSeats.includes(id)){
      lockedSeats[id]={userId};
      locked.push(id);
    }
  });
  res.json({lockedSeats:locked});
});

app.post("/unlock-seats",(req,res)=>{
  const {selectedSeats,userId}=req.body;
  selectedSeats.forEach(id=>{
    if(lockedSeats[id]?.userId===userId) delete lockedSeats[id];
  });
  res.json({success:true});
});

app.post("/checkout",(req,res)=>{
  const {cart,userId}=req.body;
  const purchased=[];
  cart.forEach(id=>{
    if(lockedSeats[id]?.userId===userId){
      soldSeats.push(id);
      delete lockedSeats[id];
      purchased.push(id);
    }
  });
  res.json({purchased});
});

app.listen(5000,()=>console.log("Backend çalışıyor"));
app.get("/", (req, res) => {
  res.send("Bilet App Backend çalışıyor 🚀");
});
