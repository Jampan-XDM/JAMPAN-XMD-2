const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore, 
    DisconnectReason,
    Browsers
} = require("@whiskeysockets/baileys");
const pino = require("pino");

async function getPairCode(phoneNumber, res) {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    
    // Setup Logger (Silent kuzuia server crash)
    const logger = pino({ level: "fatal" });

    const socket = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        printQRInTerminal: false,
        logger: logger,
        // USALAMA: Tunajifanya kama Chrome Browser ya kawaida
        browser: Browsers.macOS("Chrome"), 
        syncFullHistory: false, // Inapunguza mzigo wa data
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000
    });

    // Kusikiliza mabadiliko ya Connection
    socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            let reason = lastDisconnect?.error?.output?.statusCode;
            console.log(`⚠️ Connection Closed. Reason: ${reason}`);
            // Kama sio logout, jaribu kuwaka tena kimya kimya
            if (reason !== DisconnectReason.loggedOut) {
                // Hapa server haizimi, inasubiri request nyingine
            }
        }
        
        if (connection === 'open') {
            console.log("✅ JAMPAN-XMD: Connected successfully!");
        }
    });

    // REQUEST PAIRING CODE LOGIC
    if (!socket.authState.creds.registered) {
        await delay(3000); // Subiri sekunde 3 ili socket itulie
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
        
        try {
            console.log(`🔐 Securing connection for: ${cleanNumber}`);
            let code = await socket.requestPairingCode(cleanNumber);
            
            if (!res.headersSent) {
                res.send({ code: code });
            }
        } catch (error) {
            console.error("❌ Pairing Error:", error);
            if (!res.headersSent) {
                res.status(500).json({ error: "WhatsApp Blocked Request. Try later." });
            }
        }
    }

    socket.ev.on('creds.update', saveCreds);
}

module.exports = { getPairCode };
