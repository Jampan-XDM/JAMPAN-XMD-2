app.get('/pair', async (req, res) => {

    const number =
        req.query.number;

    if (!number) {

        return res.json({
            status: false,
            error: 'Number missing'
        });

    }

    try {

        const code =
            await startBot(number);

        return res.status(200).json({

            status: true,

            code: code
                .match(/.{1,4}/g)
                .join('-')

        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({

            status: false,
            error: 'Pair failed'

        });

    }
});