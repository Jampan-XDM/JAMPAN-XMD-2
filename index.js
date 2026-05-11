const express = require('express');
const path = require('path');
const cors = require('cors');
const { startPairing } = require('./pair');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/pair', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.status(400).json({ error: "Ingiza namba ya simu!" });

    try {
        const pairingCode = await startPairing(number);
        res.json({ code: pairingCode });
    } catch (err) {
        console.error("Pairing Error:", err.message);
        res.status(500).json({ error: err.message || "Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 JAMPAN XMD Online on Port ${PORT}`);
});
