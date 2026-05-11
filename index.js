const express = require('express');
const cors = require('cors');
const { getPairCode } = require('./pair');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Hii ndio itazuia Application Error
app.get('/', (req, res) => {
    res.send('⚡ JAMPAN-XMD IS READY FOR PAIR');
});

// API ya Pairing
app.get('/pair', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).json({ error: "Weka namba!" });
    try {
        await getPairCode(num, res);
    } catch (err) {
        if (!res.headersSent) res.status(500).json({ error: "Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
