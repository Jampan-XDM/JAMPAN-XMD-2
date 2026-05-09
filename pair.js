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
const fs = require('fs');

async function getPairCode(phoneNumber, res) {
    // NJIA SALAMA YA KUSAFISHA SESSION BILA CRASH
    try {
        if (fs.existsSync('./session')) {
            // Badala ya kufuta folder lote, tunasafisha files tu
            const files = fs.readdirSync('./session');
            for (const file of files) {
                fs.unlinkSync(`./session/${file}`);
            }
        }
    } catch (e) {
        console.log("Session clean skipped or not needed");
    }

    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const socket = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        version,
        browser: Browsers.ubuntu("Chrome"),
        logger: pino({ level: "fatal" }),
        syncFullHistory: false,
        shouldSyncHistoryMessage: () => false,
        connectTimeoutMs: 60000,
    });

    if (!socket.authState.creds.registered) {
        await delay(2000); 
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

        try {
            console.log(`📡 Fetching code for: ${cleanNumber}`);
            const code = await socket.requestPairingCode(cleanNumber);
            
            if (!res.headersSent) {
                return res.json({ code: code });
            }
        } catch (error) {
            console.error("❌ Pairing Error:", error);
            if (!res.headersSent) {
                return res.status(500).json({ error: "WhatsApp Busy au Invalid Number" });
            }
        }
    }

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return;
            const mText = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
            const from = msg.key.remoteJid;

            if (mText.startsWith('.')) {
                const command = mText.slice(1).trim().split(/ +/).shift().toLowerCase();
                if (command === 'ping') {
                    const start = Date.now();
                    const { key } = await socket.sendMessage(from, { text: '🚀' });
                    const end = Date.now();
                    await socket.sendMessage(from, { 
                        text: `⚡ *JAMPAN-XMD:* Pong!\nSpeed: *${end - start}ms*`,
                        edit: key 
                    });
                }
            }
        } catch (err) { console.log(err); }
    });

    socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') console.log("✅ JAMPAN-XMD ACTIVE");
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                // Tunatulia kidogo kabla ya kuunganisha tena kuzuia loop
                setTimeout(() => getPairCode(phoneNumber, res), 5000);
            }
        }
    });
}

module.exports = { getPairCode };
