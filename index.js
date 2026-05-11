const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs-extra');
const { startPairing } = require('./pair');

// --- ANTI-CRASH SYSTEM ---
process.on('uncaughtException', (err) => {
    console.error('⚠️ CRITICAL ERROR (Uncaught):', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ PROMISE REJECTION:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 3000;

// Database ya namba zilizounganishwa (Auto-Create kama haipo)
const DB_PATH = './database/active_numbers.json';
if (!fs.existsSync('./database')) fs.mkdirSync('./database');
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify([]));

app.use(cors());
app.use(express.json()); // Inaruhusu kusoma JSON data
app.use(express.static(path.join(__dirname, '')));

// --- ROUTES ---

// 1. Home Page (Frontend)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Pair Endpoint (Inajiomba code yenyewe)
app.get('/pair', async (req, res) => {
    let number = req.query.number;
    
    if (!number) {
        return res.status(400).json({ error: "Namba ya simu inahitajika!" });
    }

    // Safisha namba (Ondoa +, nafasi n.k)
    number = number.replace(/[^0-9]/g, '');

    try {
        console.log(`📡 Requesting Pairing Code for: ${number}`);
        const pairingCode = await startPairing(number);
        
        // Ukifanikiwa kupata code, hifadhi namba kwenye database yetu
        saveToDatabase(number);

        res.json({ 
            status: true,
            code: pairingCode,
            dev: "Kelvin Jampan" 
        });

    } catch (err) {
        console.error('Pairing Error:', err.message);
        res.status(500).json({ error: "Imeshindikana kupata kodi. Jaribu tena baadae." });
    }
});

// 3. API ya kuona bot ngapi zipo Online (Ile uliyopenda)
app.get('/active', (req, res) => {
    try {
        const numbers = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        res.json({
            count: numbers.length,
            list: numbers,
            system: "JAMPAN-XMD Cloud"
        });
    } catch (e) {
        res.status(500).json({ error: "Database error" });
    }
});

// --- HELPER FUNCTIONS ---
function saveToDatabase(num) {
    try {
        let numbers = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        if (!numbers.includes(num)) {
            numbers.push(num);
            fs.writeFileSync(DB_PATH, JSON.stringify(numbers, null, 2));
            console.log(`📝 Namba ${num} imehifadhiwa kwenye JAMPAN Database.`);
        }
    } catch (err) {
        console.error("DB Save Error:", err);
    }
}

// --- SERVER START ---
app.listen(PORT, () => {
    console.log(`
=========================================
   🚀 JAMPAN XMD SERVER IS ONLINE
   🌐 Port: ${PORT}
   👤 Dev: Kelvin Jampan
=========================================
    `);
});
