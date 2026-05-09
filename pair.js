const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore, 
    Browsers,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const pino = require("pino");

async function getPairCode(phoneNumber, res) {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const socket = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        version,
        browser: Browsers.ubuntu("Chrome"),
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        // Hizi line zinazuia "Server Down" na kuifanya bot iwe fasta
        syncFullHistory: false,
        shouldSyncHistoryMessage: () => false,
    });

    if (!socket.authState.creds.registered) {
        await delay(3000);
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
        try {
            const code = await socket.requestPairingCode(cleanNumber);
            if (!res.headersSent) res.json({ code: code });
        } catch (error) {
            if (!res.headersSent) res.status(500).json({ error: "WhatsApp Busy" });
        }
    }

    socket.ev.on('creds.update', saveCreds);

    // --- COMMAND YA PING NA CONNECTION LOGIC ---
    socket.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const mText = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
            const from = msg.key.remoteJid;

            // Command: .ping au !ping
            if (mText.toLowerCase() === '.ping' || mText.toLowerCase() === '!ping') {
                const start = Date.now();
                await socket.sendMessage(from, { text: '⚡ *JAMPAN-XMD:* Pinging...' });
                const end = Date.now();
                await socket.sendMessage(from, { 
                    text: `🚀 *Pong!* \nSpeed: *${end - start}ms*` 
                });
            }
        } catch (err) {
            console.log(err);
        }
    });

    socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log("✅ JAMPAN-XMD ACTIVE");
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) getPairCode(phoneNumber, res);
        }
    });
}

module.exports = { getPairCode };
