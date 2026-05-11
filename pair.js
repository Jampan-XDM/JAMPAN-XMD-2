const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    fetchLatestBaileysVersion,
    Browsers,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require('fs');

// HII NDIO DAWA: Global Variable kuzuia socket nyingi
global.sock = global.sock || null;

async function startPairing(phoneNumber) {
    // 1. CLEANUP: Kama kuna socket inapumua, iue kwanza
    if (global.sock) {
        try {
            global.sock.logout();
            global.sock.end();
        } catch (e) {}
        global.sock = null;
    }

    // Safisha session ya zamani inayoweza kuleta migongano
    if (fs.existsSync('./session')) {
        try { fs.rmSync('./session', { recursive: true, force: true }); } catch (e) {}
    }

    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: Browsers.ubuntu("Chrome"),
        syncFullHistory: false, // MUHIMU: Inazuia RAM kujaa
        shouldSyncHistoryMessage: () => false,
    });

    global.sock = sock; // Iwekee alama kama ndio socket pekee ya kutumia

    sock.ev.on('creds.update', saveCreds);

    // Kuzuia Reconnect Loops
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            console.log("⚠️ Connection closed. Tuachane nayo mpaka request mpya.");
            global.sock = null; 
        }
    });

    return new Promise(async (resolve, reject) => {
        try {
            // Subiri kidogo socket itulie (Stable State)
            await delay(5000); 
            
            let cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
            
            if (!sock.authState.creds.registered) {
                // Omba kodi mara moja tu
                const code = await sock.requestPairingCode(cleanedNumber);
                resolve(code);
            }
        } catch (error) {
            console.error("❌ Pairing Error:", error);
            reject(error);
        }
    });
}

module.exports = { startPairing };
