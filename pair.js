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
    // Tumia folder la session kuhifadhi data
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const socket = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        version,
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        // KUTUMIA CHROME LINUX KAMA ULIVYOELEKEZA
        browser: Browsers.ubuntu("Chrome"), 
        
        // --- MBINU ZA KUZUIA LOADING SANA (SPEED FIX) ---
        syncFullHistory: false,            // Zima kupokea meseji za zamani
        shouldSyncHistoryMessage: () => false, // Zuia kabisa sync ya historia
        markOnlineOnConnect: true,         // Onekana uko online mara tu unapounganisha
        connectTimeoutMs: 60000,           // Ongeza muda wa kusubiri network
        defaultQueryTimeoutMs: 0,
    });

    // 1. Logic ya kutoa Pairing Code kwa uhakika
    if (!socket.authState.creds.registered) {
        await delay(2000); 
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

        try {
            console.log(`📡 JAMPAN-XMD: Generating code for ${cleanNumber}...`);
            const code = await socket.requestPairingCode(cleanNumber);
            
            if (!res.headersSent) {
                return res.json({ code: code });
            }
        } catch (error) {
            console.error("❌ Pairing Error:", error);
            if (!res.headersSent) {
                return res.status(500).json({ error: "WhatsApp Server is busy. Try again later." });
            }
        }
    }

    // 2. Hifadhi Credentials
    socket.ev.on('creds.update', saveCreds);

    // 3. MONITOR CONNECTION NA COMMANDS (Prefix: .)
    socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log("✅ JAMPAN-XMD: SUCCESS! Linked successfully.");
            await socket.sendMessage(socket.user.id, { 
                text: "⚡ *JAMPAN-XMD CONNECTED*\n\nMuunganisho umefanikiwa! Bot sasa inatumia *Chrome Linux* na ni wepesi zaidi.\n\n*Prefix:* [ . ]\n*Owner:* Kelvin Jampan" 
            });
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log("🔄 Reconnecting JAMPAN-XMD...");
                // Hapa unaweza kuitisha function tena ikihitajika
            }
        }
    });

    // 4. LOGIC YA COMMANDS (PING)
    socket.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const mText = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
            const from = msg.key.remoteJid;

            // Prefix Check (.)
            const prefix = ".";
            if (mText.startsWith(prefix)) {
                const command = mText.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();

                if (command === "ping") {
                    const start = Date.now();
                    await socket.sendMessage(from, { text: "🚀 *JAMPAN-XMD PINGING...*" });
                    const end = Date.now();
                    await socket.sendMessage(from, { 
                        text: `⚡ *Pong!*\nSpeed: *${end - start}ms*\nSystem: *Stable*` 
                    });
                }
            }
        } catch (e) {
            console.log("Error in messaging:", e);
        }
    });
}

module.exports = { getPairCode };
