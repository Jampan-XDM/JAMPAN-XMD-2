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

// PAIR ROUTE
app.get("/pair", async (req, res) => {

    const number = req.query.number

    if (!number) {
        return res.send("❌ Example: /pair?number=255674229015")
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

        // ALREADY CONNECTED
        if (sock.authState.creds.registered) {

            await startBot(sessionId)

            return res.send("✅ DEVICE ALREADY CONNECTED")

        }

        // WAIT CONNECTION OPEN
        sock.ev.on("connection.update", async (update) => {

            const { connection } = update

            if (connection === "open") {

                try {

                    const code =
                        await sock.requestPairingCode(number)

                    res.send(`
<h2>✅ JAMPAN XMD PAIR CODE</h2>
<h1>${code}</h1>
<p>Link Device → Enter Code</p>
`)

                    console.log("✅ PAIR CODE:", code)

                    setTimeout(() => {
                        startBot(sessionId)
                    }, 8000)

                } catch (err) {

                    console.log("PAIR ERROR:", err)

                    if (!res.headersSent) {
                        res.send("❌ FAILED TO GET PAIR CODE")
                    }

                }

            }

        })

    } catch (e) {

        console.log("MAIN ERROR:", e)

        if (!res.headersSent) {
            res.send("❌ SERVER ERROR")
        }

    }

})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {

    console.log(`✅ SERVER RUNNING ON PORT ${PORT}`)

})