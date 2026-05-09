const express = require('express');
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
