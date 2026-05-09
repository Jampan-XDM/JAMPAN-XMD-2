const fs = require('fs'); // Ongeza hii juu kabisa ya pair.js

async function getPairCode(phoneNumber, res) {
    // 1. FUTA SESSION ZA ZAMANI KUZUIA MGONGANO
    if (fs.existsSync('./session')) {
        fs.rmSync('./session', { recursive: true, force: true });
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
        // Speed tweaks
        syncFullHistory: false,
        shouldSyncHistoryMessage: () => false,
        connectTimeoutMs: 60000,
    });

    if (!socket.authState.creds.registered) {
        await delay(3000); // Subiri socket iwe "Stable"
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

        try {
            console.log(`📡 Requesting code for NEW number: ${cleanNumber}`);
            const code = await socket.requestPairingCode(cleanNumber);
            
            if (!res.headersSent) {
                return res.json({ code: code });
            }
        } catch (error) {
            console.error("❌ Pairing Error:", error);
            if (!res.headersSent) {
                return res.status(500).json({ error: "WhatsApp imekataa request. Subiri kidogo." });
            }
        }
    }
    // ... endelea na kodi iliyobaki ya creds.update na messages.upsert
}
