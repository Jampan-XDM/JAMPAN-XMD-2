const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const { startPairing } = require('./pair');

const PORT = process.env.PORT || 7860;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Route ya kuonyesha Sura ya Bot (Frontend)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. API Endpoint ya kupata Code
app.get('/code', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.status(400).json({ error: "Weka namba ya simu" });

    try {
        const pairingCode = await startPairing(number);
        res.json({ code: pairingCode });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Imeshindwa kupata code" });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 JAMPAN XMD inarun kwenye Port: ${PORT}`);
});
