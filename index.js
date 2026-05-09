const express = require('express');
const cors = require('cors');
const { getPairCode } = require('./pair');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('⚡ JAMPAN-XMD IS READY FOR PAIR');
});

app.get('/pair', async (req, res) => {
    const num = req.query.number;
    if (!num) return res.status(400).json({ error: "No number provided" });
    
    // Muhimu: Tunaruhusu request moja tu kwa wakati mmoja kuzuia crash
    try {
        await getPairCode(num, res);
    } catch (err) {
        console.error("Critical Error:", err);
        if (!res.headersSent) res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server Live on Port ${PORT}`);
});
