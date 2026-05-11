const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs-extra');
const { startPairing } = require('./pair');

// --- 1. FULL CRASH PROTECTION (Anti-H10) ---
process.on("uncaughtException", (err) => {
    console.error("🚫 CRITICAL ERROR:", err.message);
});
process.on("unhandledRejection", (reason) => {
    console.error("🚫 UNHANDLED REJECTION:", reason);
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '')));

// --- 2. KEEP-ALIVE ENDPOINT FOR HEROKU ---
app.get('/', (req, res) => {
    res.send("🚀 JAMPAN XMD BOT IS STABLE & ONLINE");
});

app.get('/pair', async (req, res) => {
    let number = req.query.number;
    if (!number) return res.status(400).json({ error: "Weka namba!" });
    
    number = number.replace(/[^0-9]/g, '');
    try {
        console.log(`📡 Requesting code for: ${number}`);
        const pairingCode = await startPairing(number);
        res.json({ code: pairingCode });
    } catch (err) {
        console.error("Pairing Error:", err.message);
        res.status(500).json({ error: "Server Busy. Try again." });
    }
});

// Hii inatosha kabisa, haitachanganya hata ukiweka Procfile ya web na worker
app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
    console.log("JAMPAN-XMD Server Online!");
});
