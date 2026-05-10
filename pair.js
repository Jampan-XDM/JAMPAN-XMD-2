const express = require("express")
const path = require("path")
const P = require("pino")

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const config = require("./config")
const startBot = require("./index")
const { ensureSession } = require("./auth")

const app = express()

// HOME
app.get("/", (req, res) => {

    res.send("✅ JAMPAN XMD BOT ACTIVE")

})

// PAIR
app.get("/pair", async (req, res) => {

    try {

        const number = req.query.number

        if (!number) {
            return res.send(
                "❌ Example: /pair?number=255674229015"
            )
        }

        const sessionId = number

        const sessionPath =
            path.join(config.SESSION_PATH, sessionId)

        ensureSession(sessionPath)

        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(sessionPath)

        const { version } =
            await fetchLatestBaileysVersion()

        const sock = makeWASocket({

            version,

            logger: P({
                level: "silent"
            }),

            printQRInTerminal: false,

            browser: [
                "Chrome (Linux)",
                "Chrome",
                "120.0.0.0"
            ],

            auth: state

        })

        sock.ev.on(
            "creds.update",
            saveCreds
        )

        // IMPORTANT FIX
        if (state.creds.registered) {

            await startBot(sessionId)

            return res.send(
                "✅ DEVICE ALREADY CONNECTED"
            )

        }

        // WAIT BEFORE REQUEST
        await new Promise(resolve =>
            setTimeout(resolve, 5000)
        )

        const code =
            await sock.requestPairingCode(number)

        console.log("PAIR CODE:", code)

        res.send(`
<!DOCTYPE html>
<html>
<head>
<title>JAMPAN XMD</title>
<style>
body{
background:#0d1117;
color:white;
font-family:sans-serif;
text-align:center;
padding-top:50px;
}
.code{
font-size:40px;
font-weight:bold;
color:#00ff88;
}
</style>
</head>
<body>

<h2>✅ JAMPAN XMD PAIR CODE</h2>

<div class="code">${code}</div>

<p>Open WhatsApp → Linked Devices → Link with phone number</p>

</body>
</html>
`)

        setTimeout(() => {

            startBot(sessionId)

        }, 10000)

    } catch (err) {

        console.log("PAIR ERROR:", err)

        if (!res.headersSent) {

            res.send(`
<h2>❌ SERVER ERROR</h2>
`)

        }

    }

})

const PORT =
    process.env.PORT || 3000

app.listen(PORT, () => {

    console.log(
        `✅ SERVER RUNNING ON PORT ${PORT}`
    )

})