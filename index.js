const {
    default: makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore
} = require('@whiskeysockets/baileys')

const { getAuthState } = require('./auth')
const P = require('pino')

const store = makeInMemoryStore({ logger: P().child({ level: 'silent' }) })

async function startBot() {

    const { state, saveCreds } = await getAuthState()
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: P({ level: 'silent' }),
        browser: ["JAMPAN XMD", "Chrome", "1.0.0"]
    })

    store.bind(sock.ev)

    // SAVE CREDENTIALS
    sock.ev.on('creds.update', saveCreds)

    // CONNECTION UPDATE (IMPORTANT FIX)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'close') {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

            console.log('❌ Session closed. Reconnecting:', shouldReconnect)

            if (shouldReconnect) {
                startBot()
            } else {
                console.log('❌ Logged out. Delete session folder and re-pair.')
            }
        }

        if (connection === 'open') {
            console.log('✅ Bot connected successfully!')
        }
    })

    // SIMPLE MESSAGE TEST
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message) return

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text

        if (text === 'ping') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'pong ✅ JAMPAN XMD active' })
        }
    })
}

startBot()