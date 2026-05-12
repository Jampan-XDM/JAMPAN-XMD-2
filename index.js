const express = require("express");
const path = require("path");
const fs = require("fs-extra");
const { startPairing } = require("./pair");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '.')));

// --- STABLE PAIRING ROUTE ---
app.get('/pair', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.status(400).send({ error: "Namba inahitajika!" });

    console.log(`📲 Requesting Pair Code for: ${number}`);
    
    try {
        // Tunampa user muda wa kusubiri (10s) wakati injini inatengeneza kodi
        const code = await startPairing(number);
        res.status(200).send({ code: code });
    } catch (err) {
        res.status(500).send({ error: "WhatsApp Server Busy. Jaribu tena baada ya dakika 1." });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`📡 JAMPAN-XMD Engine Live on Port ${PORT}`);
});
