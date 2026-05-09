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
    const { version } = await fetchLatestBaileysVersion(); // Inapata version mpya ya WA

    const socket = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        version,
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        // Hapa tunatumia Chrome Linux (Ubuntu) kama ulivyoelekeza
        browser: Browsers.ubuntu("Chrome"), 
        markOnlineOnConnect: false,
    });

    // 1. Logic ya kuomba Pairing Code
    if (!socket.authState.creds.registered) {
        await delay(3000); 
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

        try {
            console.log(`📡 JAMPAN-XMD: Requesting code for ${cleanNumber} using Chrome Linux...`);
            const code = await socket.requestPairingCode(cleanNumber);
            
            if (!res.headersSent) {
                return res.json({ code: code });
            }
        } catch (error) {
            console.error("❌ Pairing Failed:", error);
            if (!res.headersSent) {
                return res.status(500).json({ error: "WhatsApp Blocked Request. Try after 5 mins." });
            }
        }
    }

    // 2. Hakikisha Creds zinasave-wa kila sekunde
    socket.ev.on('creds.update', saveCreds);

    // 3. Monitor muunganisho
    socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log("✅ JAMPAN-XMD: SUCCESS! Linked on Chrome Linux.");
            
            // Tuma ujumbe wa uthibitisho kwenye namba yako
            await socket.sendMessage(socket.user.id, { 
                text: "⚡ *JAMPAN-XMD CONNECTED*\n\nMuunganisho umefanikiwa kupitia *Chrome Linux*. Bot sasa iko tayari kazi!\n\n👑 *Owner:* Kelvin Jampan\n📢 *Channel:* https://whatsapp.com/channel/0029Vb7fTNf3QxS8A6rbBB3S" 
            });
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                // Inajaribu kurudi hewani kama sio logout ya makusudi
            }
        }
    });
}

module.exports = { getPairCode };
