const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const { startPairing } = require('./pair');

const PORT = process.env.PORT || 7860;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '')));

// Route ya UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint ya kutoa kodi
app.get('/code', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.status(400).json({ error: "Ingiza namba ya simu!" });

    try {
        const pairingCode = await startPairing(number);
        res.json({ code: pairingCode });
    } catch (err) {
        console.error("SERVER ERROR:", err.message);
        res.status(500).json({ error: "WhatsApp Timeout! Subiri kidogo kisha jaribu tena." });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ JAMPAN XMD ONLINE ON PORT ${PORT}`);
});
