const express = require('express');
const cors = require('cors');

const {
    connectBot,
    getPair
} = require('./pair');

const app = express();

app.use(cors());

const PORT =
    process.env.PORT || 3000;

// START BOT ON SERVER START
connectBot();

app.get('/', (req, res) => {

    res.send(
        '⚡ JAMPAN-XMD ACTIVE'
    );

});

app.get('/pair', async (req, res) => {

    try {

        const number =
            req.query.number;

        if (!number) {

            return res.json({
                status: false,
                error: 'Number missing'
            });

        }

        const code =
            await getPair(number);

        return res.json({

            status: true,

            code: code
                .match(/.{1,4}/g)
                .join('-')

        });

    } catch (err) {

        console.log(err);

        return res.json({

            status: false,
            error: String(err)

        });

    }
});

app.listen(PORT, () => {

    console.log(
        `🚀 Running ${PORT}`
    );

});