const express = require('express');
const path = require('path');
const cors = require('cors');

// --- 1. EMERGENCY CRASH HANDLERS (MUST BE FIRST) ---
process.on("uncaughtException", (err) => {
    console.error("❌ BOOT CRASH:", err.message);
});
process.on("unhandledRejection", (reason) => {
    console.error("❌ PROMISE CRASH:", reason);
});

console.log("🚀 STEP 1: Starting Express Server...");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '')));

// --- 2. REGISTER ROUTES IMMEDIATELY ---
app.get('/', (req, res) => {
    res.send("🚀 JAMPAN XMD BOT IS STABLE & ONLINE");
});

app.get('/pair', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.status(400).json({ error: "Namba inahitajika!" });
    
    try {
        const { startPairing } = require('./pair'); // Load pair module only when needed
        const code = await startPairing(number.replace(/[^0-9]/g, ''));
        res.json({ code });
    } catch (err) {
        res.status(500).json({ error: "Pairing module error: " + err.message });
    }
});

// --- 3. BIND PORT TO HEROKU (DO THIS BEFORE BOT LOGIC) ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ STEP 2: Server bound to Port ${PORT}`);
    console.log(`✅ STEP 3: JAMPAN-XMD is ready for pairing!`);
});

// --- 4. OPTIONAL: INITIALIZE BOT LOGIC HERE IF NEEDED ---
// (Hapa ndipo unaweza kuweka startBot() kama unataka iwake yenyewe)
