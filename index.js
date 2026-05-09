const express = require('express');
const cors = require('cors');
const { getPairCode } = require('./pair');

const app = express();

// Ruhusu mawasiliano ya nje
app.use(cors());
app.use(express.json());

// PORT MUHIMU: Heroku lazima itumie process.env.PORT
const PORT = process.env.PORT || 3000;

// HII NDIYO ITAONDOA APPLICATION ERROR
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>JAMPAN-XMD PAIRING</title>
        <style>
            body { 
                background: #0f172a; color: white; font-family: sans-serif; 
                display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;
            }
            .card { 
                text-align: center; padding: 40px; border-radius: 20px; 
                background: rgba(255,255,255,0.05); border: 2px solid #38bdf8;
                box-shadow: 0 0 20px rgba(56, 189, 248, 0.4);
            }
            .status { color: #22c55e; font-weight: bold; animation: pulse 2s infinite; }
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
            h1 { color: #38bdf8; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="status">● JAMPAN-XMD IS ACTIVE</div>
            <h1>⚡ JAMPAN-XMD</h1>
            <p>Ready for Pairing... System Online</p>
            <hr style="border: 0.5px solid #38bdf833; margin: 20px 0;">
            <p style="font-size: 12px; opacity: 0.6;">👑 Powered by Kelvin Jampan</p>
        </div>
    </body>
    </html>
    `);
});

// API ya Pairing
app.get('/pair', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).json({ error: "Weka namba ya simu!" });

    try {
        console.log(`📡 Requesting code for: ${num}`);
        await getPairCode(num, res);
    } catch (err) {
        console.error(err);
        if (!res.headersSent) res.status(500).json({ error: "Internal Error" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 JAMPAN-XMD Server running on port ${PORT}`);
});
