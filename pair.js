const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore, 
    Browsers,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require("pino");

async function getPairCode(phoneNumber, res) {
    // Tunahifadhi session kwenye folder la 'session'
    const { state, saveCreds } = await useMultiFileAuthState('./session');

    const socket = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        // HII NDIO CHROME LINUX (UBUNTU) - Inakubalika haraka na WhatsApp
        browser: Browsers.ubuntu("Chrome"), 
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        syncFullHistory: false,
        shouldSyncHistoryMessage: () => false,
    });

    // Omba kodi ikiwa haujajisajili
    if (!socket.authState.creds.registered) {
        await delay(3000); // Subiri socket ijiandae
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

        try {
            console.log(`📡 JAMPAN-XMD: Requesting Code for ${cleanNumber} via Chrome Linux...`);
            const code = await socket.requestPairingCode(cleanNumber);
            
            if (!res.headersSent) {
                return res.json({ code: code });
            }
        } catch (error) {
            console.error("Pairing Error:", error);
            if (!res.headersSent) {
                return res.status(500).json({ error: "WhatsApp Server is busy. Try again." });
            }
        }
    }

    // Hifadhi mabadiliko ya session
    socket.ev.on('creds.update', saveCreds);

    // LOGIC YA PING (.)
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
                    await socket.sendMessage(from, { text: "🚀 *JAMPAN-XMD SPEED TEST...*" });
                    const end = Date.now();
                    await socket.sendMessage(from, { 
                        text: `⚡ *Pong!*\nSpeed: *${end - start}ms*\nBrowser: *Chrome Linux*` 
                    });
                }
            }
        } catch (err) { console.log(err); }
    });

    // Connection Update
    socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log("✅ JAMPAN-XMD IS CONNECTED!");
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) getPairCode(phoneNumber, res);
        }
    });
}

module.exports = { getPairCode };
