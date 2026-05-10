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
app.get("/", async (req, res) => {

    res.send("✅ JAMPAN XMD BOT ACTIVE")

})

// PAIR
app.get("/pair", async (req, res) => {

    const number = req.query.number

    if (!number) {

        return res.send(
            "❌ Example:\n/pair?number=255674229015"
        )

    }

    try {

        const sessionId = number

        const sessionPath =
            path.join(config.SESSION_PATH, sessionId)

        ensureSession(sessionPath)

        const { state, saveCreds } =
            await useMultiFileAuthState(sessionPath)

        const { version } =
            await fetchLatestBaileysVersion()

        const sock = makeWASocket({

            version,

            logger: P({
                level: "silent"
            }),

            printQRInTerminal: false,

            browser: ["Chrome (Linux)", "Chrome", "120.0.0.0"],

            auth: state

        })

        sock.ev.on("creds.update", saveCreds)

        if (!sock.authState.creds.registered) {

            const code =
                await sock.requestPairingCode(number)

            res.send(`
<h2>✅ JAMPAN XMD PAIR CODE</h2>
<h1>${code}</h1>
<p>Enter this code on WhatsApp Linked Devices</p>
`)

            setTimeout(() => {
                startBot(sessionId)
            }, 10000)

        } else {

            startBot(sessionId)

            res.send("✅ DEVICE ALREADY CONNECTED")

        }

    } catch (e) {

        console.log("PAIR ERROR:", e)

        res.send("❌ FAILED TO GENERATE PAIR CODE")

    }

})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {

    console.log(`✅ SERVER RUNNING ON PORT ${PORT}`)

})