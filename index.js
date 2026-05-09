const express = require('express');
const cors = require('cors');
const { getPairCode } = require('./pair');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Hii ndio itafungua Dashboard na kuondoa "Error" kwenye Heroku link
app.get('/', (req, res) => {
    res.send(`
        <body style="background:#0f172a; color:white; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
            <div style="text-align:center; border:2px solid #22c55e; padding:40px; border-radius:30px; box-shadow: 0 0 20px #22c55e44;">
                <h1 style="color:#22c55e; margin:0;">⚡ JAMPAN-XMD ONLINE</h1>
                <p>System is Active | Prefix: (.) </p>
                <p style="font-size:12px; opacity:0.6;">👑 Powered by Kelvin Jampan</p>
            </div>
        </body>
    `);
});

app.get('/pair', async (req, res) => {
    const num = req.query.number;
    if (!num) return res.status(400).json({ error: "Namba inahitajika" });
    try {
        await getPairCode(num, res);
    } catch (err) {
        if (!res.headersSent) res.status(500).json({ error: "Server Error" });
    }
});

app.listen(PORT, () => console.log(`🚀 JAMPAN-XMD Server Live on Port ${PORT}`));
