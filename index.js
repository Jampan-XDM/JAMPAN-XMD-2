const express = require('express');
const cors = require('cors');

const {
    startBot
} = require('./pair');

const app = express();

app.use(cors());
app.use(express.json());

const PORT =
    process.env.PORT || 3000;

app.get('/', async (req, res) => {

    res.send(
        '⚡ JAMPAN-XMD SERVER ACTIVE'
    );

});

app.get('/pair', async (req, res) => {

    const number =
        req.query.number;

    if (!number) {

        return res.status(400).json({
            status: false,
            error: 'Number required'
        });

    }

    try {

        await startBot(number, res);

    } catch (err) {

        console.log(err);

        if (!res.headersSent) {

            res.status(500).json({
                status: false,
                error: 'Server busy'
            });

        }
    }
});

app.listen(PORT, () => {

    console.log(
        `🚀 Server running on ${PORT}`
    );

});