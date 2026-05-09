const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore, 
    Browsers 
} = require("@whiskeysockets/baileys");
const pino = require("pino");

async function getPairCode(phoneNumber, res) {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const logger = pino({ level: "fatal" });

    const socket = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        printQRInTerminal: false,
        logger: logger,
        browser: Browsers.macOS("Chrome"), // Muhimu kwa uhakika wa kodi
    });

    if (!socket.authState.creds.registered) {
        // Subiri socket iwe "ready" kidogo
        await delay(2000);
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

        try {
            // Hapa ndipo tunaitisha kodi yenyewe
            const code = await socket.requestPairingCode(cleanNumber);
            
            // HAKIKI: Hakikisha tunarudisha JSON response kwa Express
            if (!res.headersSent) {
                return res.json({ code: code });
            }
        } catch (error) {
            console.error("❌ Error generating pair code:", error);
            if (!res.headersSent) {
                return res.status(500).json({ error: "WhatsApp imekataa request. Jaribu baada ya dakika 5." });
            }
        }
    } else {
        if (!res.headersSent) {
            return res.json({ error: "Namba hii tayari imeshaunganishwa!" });
        }
    }

    socket.ev.on('creds.update', saveCreds);
    
    // Usalama: Isikilize connection ikifanikiwa
    socket.ev.on('connection.update', async (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log("✅ JAMPAN-XMD: Imeunganishwa kikamilifu!");
        }
    });
}

module.exports = { getPairCode };
