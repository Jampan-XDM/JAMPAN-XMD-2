const express = require('express');
const cors = require('cors'); // Hakikisha umei-install (npm install cors)
const { startPairing } = require('./pair');

const app = express();

// LAZIMA HII IWEPO ILI FRONTEND IPATE DATA
app.use(cors()); 

app.get('/pair', async (req, res) => {
    let phone = req.query.number;
    if (!phone) return res.status(400).json({ error: "No number" });

    try {
        const code = await startPairing(phone);
        // Hapa tunatuma code kurudi kwenye Frontend
        res.status(200).json({ code: code }); 
    } catch (err) {
        res.status(500).json({ error: "Failed" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0');
