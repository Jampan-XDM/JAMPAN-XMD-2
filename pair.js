const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore, 
    Browsers,
    fetchLatestBaileysVersion,
    DisconnectReason
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
        browser: Browsers.ubuntu("Chrome"), // CHROME LINUX FIX
        logger: pino({ level: "fatal" }),
        // SPEED OPTIMIZATIONS
        syncFullHistory: false,
        shouldSyncHistoryMessage: () => false,
        maxMsgSyncLimit: 0,
        connectTimeoutMs: 60000,
    });

    if (!socket.authState.creds.registered) {
        await delay(2500); // Muda kidogo wa kuzuia Error 428
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

        try {
            const code = await socket.requestPairingCode(cleanNumber);
            if (!res.headersSent) return res.json({ code: code });
        } catch (error) {
            console.error("Pairing Request Failed:", error);
            if (!res.headersSent) return res.status(500).json({ error: "WhatsApp Busy" });
        }
    }

    socket.ev.on('creds.update', saveCreds);

    // COMMAND LOGIC WITH PREFIX (.)
    socket.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const mText = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
            const from = msg.key.remoteJid;
            const prefix = ".";

            if (mText.startsWith(prefix)) {
                const command = mText.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();

                if (command === "ping") {
                    const start = Date.now();
                    const { key } = await socket.sendMessage(from, { text: "🚀" });
                    const end = Date.now();
                    await socket.sendMessage(from, { 
                        text: `⚡ *JAMPAN-XMD:* Pong!\nSpeed: *${end - start}ms*`,
                        edit: key 
                    });
                }
            }
        } catch (e) { console.log(e); }
    });

    socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log("✅ JAMPAN-XMD: Connected!");
        }
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                // Re-init connection here if needed
            }
        }
    });
}

module.exports = { getPairCode };
