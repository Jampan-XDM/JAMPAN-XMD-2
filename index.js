const express = require('express');
const cors = require('cors');
const path = require('path');
const { startPairing } = require('./pair');

const app = express();

// 1. Ruhusu kutoa data nje (CORS)
app.use(cors());
app.use(express.json());

// 2. Serve Frontend: Weka index.html yako ndani ya folder la 'public'
app.use(express.static(path.join(__dirname, 'public')));

// 3. API Endpoint ya kupata Pairing Code
app.get('/pair', async (req, res) => {
    let phone = req.query.number;
    
    if (!phone) {
        return res.status(400).json({ error: "Tafadhali weka namba ya simu!" });
    }

    try {
        // Tunaita logic kutoka pair.js
        const code = await startPairing(phone);
        res.json({ code: code });
    } catch (err) {
        console.error("Pairing Error:", err);
        res.status(500).json({ error: "Baileys imeshindwa kutengeneza code." });
    }
});

// 4. FIX: Heroku Port Binding
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Jampani Bot inarun kwenye Port: ${PORT}`);
});
