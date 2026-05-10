const express = require("express")
const startBot = require("./index")

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    Browsers
} = require("@whiskeysockets/baileys")

const P = require("pino")
const path = require("path")
const fs = require("fs")

const config = require("./config")
const { ensureSessionFolder } = require("./auth")

const app = express()

app.get("/", (req, res) => {
    res.send("✅ JAMPAN XMD BOT ACTIVE")
})

app.get("/pair", async (req, res) => {

    const number = req.query.number

    if (!number) {
        return res.send("❌ Enter number\nExample: /pair?number=255xxxxxxxxx")
    }

    try {

        const sessionId = number
        const sessionPath = path.join(config.SESSION_PATH, sessionId)

        ensureSessionFolder(sessionPath)

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

        const { version } = await fetchLatestBaileysVersion()

        const sock = makeWASocket({
            version,
            logger: P({ level: "silent" }),
            printQRInTerminal: false,
            browser: Browsers.macOS("Safari"),
            auth: state
        })

        sock.ev.on("creds.update", saveCreds)

        if (!sock.authState.creds.registered) {

            const code = await sock.requestPairingCode(number)

            res.send(`
<h2>✅ JAMPAN XMD PAIR CODE</h2>
<h1>${code}</h1>
`)

            setTimeout(() => {
                startBot(sessionId)
            }, 10000)

        } else {

            startBot(sessionId)

            res.send("✅ SESSION ALREADY CONNECTED")
        }

    } catch (e) {

        console.log(e)

        res.send("❌ ERROR GENERATING PAIR CODE")

    }

})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`✅ SERVER RUNNING ON PORT ${PORT}`)
})