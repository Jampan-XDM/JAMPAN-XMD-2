const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const { startPairing } = require('./pair');

const PORT = process.env.PORT || 7860;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/code', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.status(400).json({ error: "Weka namba ya simu!" });

    try {
        const pairingCode = await startPairing(number);
        res.json({ code: pairingCode });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server imeshindwa kutoa kodi. Subiri dakika 15 uone kama utakuwa umekatwa block na WhatsApp." });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ JAMPAN XMD Is Running on Port ${PORT}`);
});
app.get('/code', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.status(400).json({ error: "Weka namba!" });

    try {
        const pairingCode = await startPairing(number);
        res.json({ code: pairingCode });
    } catch (err) {
        console.error("ROUTE ERROR:", err.message);
        // Badala ya kudondoka, rudi na ujumbe wa kueleweka
        res.status(500).json({ error: "Majaribio yamezidi. Subiri kidogo kisha jaribu tena." });
    }
});
