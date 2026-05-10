const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const bodyParser = require("body-parser");
const { startPairing } = require('./pair'); // Hakikisha hapa unaita function ya pairing
const { sms } = require('./msg'); // Ilete msg.js tuliyoitengeneza

// Mazingira ya Heroku
const PORT = process.env.PORT || 7860;

// Kuongeza uwezo wa Event Listeners kuzuia memory leaks
require('events').EventEmitter.defaultMaxListeners = 500;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve mafaili ya HTML kutoka folder la public

// --- ROUTES ZA FRONTEND ---

app.get('/pair', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html')); 
});

// --- API ENDPOINT YA PAIRING ---

app.get('/code', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.status(400).json({ error: "Weka namba ya simu" });

    try {
        const pairingCode = await startPairing(number);
        res.json({ code: pairingCode });
    } catch (err) {
        res.status(500).json({ error: "Server error wakati wa kupata code" });
    }
});

// --- LOGIC YA WHATSAPP BOT (BACKEND) ---
// Hapa ndipo unapoanzisha muunganisho wa Baileys baada ya kupair

const startBot = async () => {
    // Hapa utaweka ile kodi ya makeWASocket uliyokuwa nayo
    // ... (Kumbuka kutumia 'm = sms(sock, msg)' ndani ya messages.upsert)
    console.log("JAMPAN XMD Engine Initialized...");
};

// Washa Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ✅ JAMPAN XMD Backend is Active!
    🌍 Server: http://localhost:${PORT}
    🚀 Port: ${PORT}
    `);
    
    // Anzisha bot (hiari, inategemea kama una session tayari)
    // startBot(); 
});

module.exports = app;
