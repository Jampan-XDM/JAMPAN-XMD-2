const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const { startPairing } = require('./pair');

const PORT = process.env.PORT || 7860;

app.use(cors());
app.use(express.json());

// Inatoa HTML ya pairing moja kwa moja kwenye link kuu
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint ya kuomba code
app.get('/code', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.status(400).json({ error: "No number" });

    try {
        const pairingCode = await startPairing(number);
        res.json({ code: pairingCode });
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ JAMPAN XMD Is Running on Port ${PORT}`);
});
