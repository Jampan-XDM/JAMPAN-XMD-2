const express = require('express');
const cors = require('cors');
const { getPairCode } = require('./pair');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// DASHBOARD ROUTE (Ili link ionekane Online)
app.get('/', (req, res) => {
    res.send(`
        <body style="background:#0f172a; color:#38bdf8; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh;">
            <div style="text-align:center; border:2px solid #38bdf8; padding:30px; border-radius:20px; box-shadow: 0 0 20px #38bdf866;">
                <h1 style="margin:0;">⚡ JAMPAN-XMD IS ONLINE</h1>
                <p style="color:white; opacity:0.8;">Backend System is Active & Ready for Pairing</p>
                <p style="font-size:12px;">Powered by Kelvin Jampan</p>
            </div>
        </body>
    `);
});

// API ROUTE YA /PAIR (Inaitwa na Frontend yako)
app.get('/pair', async (req, res) => {
    const num = req.query.number;
    if (!num) return res.status(400).json({ error: "Weka namba ya simu!" });

    console.log(`📡 Request received for: ${num}`);
    
    // Tunaita engine yetu ya pairing hapa
    try {
        await getPairCode(num, res);
    } catch (err) {
        console.error("Critical Backend Error:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
});

app.listen(PORT, () => {
    console.log(`🚀 JAMPAN-XMD Server running on port ${PORT}`);
});
