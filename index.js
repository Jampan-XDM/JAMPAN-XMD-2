const express = require('express');
const cors = require('cors');
const path = require('path');
const { getPairCode } = require('./pair');
const config = require('./config');

const app = express();

// 1. Ruhusu mawasiliano kutoka nje (Fixes Server Down error)
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

// 2. Dashboard ya kisasa ukifungua link yako
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>JAMPAN-XMD STATUS</title>
        <style>
            body { 
                background: #0f172a; color: white; font-family: sans-serif; 
                display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;
            }
            .status-card { 
                text-align: center; padding: 40px; border-radius: 20px; 
                background: rgba(255,255,255,0.05); border: 1px solid #38bdf8;
                box-shadow: 0 0 20px #38bdf866;
            }
            .pulse {
                width: 20px; height: 20px; background: #22c55e; border-radius: 50%;
                display: inline-block; margin-right: 10px;
                box-shadow: 0 0 10px #22c55e;
                animation: blink 1.5s infinite;
            }
            @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
            h1 { color: #38bdf8; margin: 10px 0; }
            p { opacity: 0.7; }
        </style>
    </head>
    <body>
        <div class="status-card">
            <div class="pulse"></div>
            <span style="font-weight: bold; color: #22c55e;">BOT IS ACTIVE</span>
            <h1>⚡ JAMPAN-XMD</h1>
            <p>System Version: 3.0.0</p>
            <p>Owner: Kelvin Jampan</p>
            <hr style="border: 0.5px solid #38bdf833; margin: 20px 0;">
            <p style="font-size: 12px;">📢 Updates: 120363409292513352@newsletter</p>
        </div>
    </body>
    </html>
    `);
});

// 3. Njia ya kupata Pair Code
app.get('/pair', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).send({ error: "Namba inahitajika!" });

    try {
        console.log(`⚡ JAMPAN-XMD: Ombi la code kutoka ${num}`);
        await getPairCode(num, res);
    } catch (err) {
        console.error("Pair Error:", err);
        if (!res.headersSent) res.status(500).send({ error: "Server Internal Error" });
    }
});

app.listen(PORT, () => {
    console.log(`⚡ JAMPAN-XMD imewaka kwenye Port ${PORT}`);
});
app.get('/pair', async (req, res) => {
    const number = req.query.number;

    if (!number) {
        return res.json({ success: false, message: "Number required" });
    }

    await getPairCode(number, res);
});
