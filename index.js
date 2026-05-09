const express = require('express');
const cors = require('cors');

const {
    startBot
} = require('./pair');

const app = express();

app.use(cors());

const PORT =
    process.env.PORT || 3000;

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
            await startBot(number);

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
        `🚀 Server running ${PORT}`
    );

});