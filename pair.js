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

global.sock = global.sock || null;

async function startPairing(phoneNumber) {
    // Kill old socket before starting new one
    if (global.sock) {
        try { global.sock.end(); } catch (e) {}
        global.sock = null;
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
        syncFullHistory: false,
        shouldSyncHistoryMessage: () => false,
    });

    global.sock = sock;
    sock.ev.on('creds.update', saveCreds);

    return new Promise(async (resolve, reject) => {
        try {
            await delay(5000); // Wait for socket to stabilize
            let cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
            
            if (!sock.authState.creds.registered) {
                const code = await sock.requestPairingCode(cleanedNumber);
                resolve(code);
            }
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { startPairing };
