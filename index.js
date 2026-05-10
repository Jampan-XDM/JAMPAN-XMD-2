const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers
} = require("@whiskeysockets/baileys")

const P = require("pino")
const fs = require("fs")
const path = require("path")
const { Boom } = require("@hapi/boom")

const config = require("./config")
const commands = require("./command")
const { ensureSessionFolder } = require("./auth")

async function startBot(sessionId) {

    const sessionPath = path.join(config.SESSION_PATH, sessionId)

    ensureSessionFolder(sessionPath)

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: P({ level: "silent" }),
        printQRInTerminal: false,

        browser: Browsers.windows("Chrome"),

        auth: state,

        syncFullHistory: false,
        markOnlineOnConnect: true
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async (update) => {

        const { connection, lastDisconnect } = update

        if (connection === "open") {

            console.log(`✅ CONNECTED : ${sessionId}`)

        }

        if (connection === "close") {

            const reason = new Boom(lastDisconnect?.error)?.output.statusCode

            console.log("❌ CONNECTION CLOSED:", reason)

            if (reason !== DisconnectReason.loggedOut) {
                startBot(sessionId)
            } else {
                console.log("SESSION LOGGED OUT")
            }
        }

    })

    sock.ev.on("messages.upsert", async ({ messages }) => {

        const msg = messages[0]

        if (!msg.message) return
        if (msg.key.fromMe) return

        await commands(sock, msg)

    })

    return sock
}

module.exports = startBot