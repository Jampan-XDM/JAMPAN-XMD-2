constructionconst express = require('express');
const cors = require('cors');
const { getPairCode } = require('./pair');
const config = require('./config');

const app = express();

// Muhimu: Inaruhusu Frontend (website yako) kuwasiliana na Heroku
app.use(cors());
app.use(express.json());

// Port ya Heroku inasomwa hapa
const PORT = process.env.PORT || 3000;

// API ya kupata Pair Code
app.get('/pair', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).send({ error: "Namba inahitajika!" });

    try {
        console.log(`⚡ JAMPAN-XMD: Generating code for ${num}`);
        await getPairCode(num, res);
    } catch (err) {
        console.error("Error in /pair route:", err);
        if (!res.headersSent) {
            res.status(500).send({ error: "Server Error" });
        }
    }
});

// Health check kuona kama bot ipo live
app.get('/', (req, res) => {
    res.send("⚡ JAMPAN-XMD Backend is Running on Heroku!");
});

app.listen(PORT, () => {
    console.log(`
⚡ JAMPAN-XMD SERVER STARTED
🚀 Port: ${PORT}
👑 Owner: Kelvin Jampan
📢 Channel: ${config.channelLink}
    `);
});
 express = require('express');
const path = require('path');
const { getPairCode } = require('./pair');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/pair', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).send({ error: "Number required" });
    await getPairCode(num, res);
});

app.listen(PORT, () => {
    console.log(`⚡ JAMPAN-XMD SERVER RUNNING ON PORT ${PORT}`);
});
