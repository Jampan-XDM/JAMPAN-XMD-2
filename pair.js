const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    Browsers, 
    delay, 
    fetchLatestBaileysVersion 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require('fs');

async function startPairing(phoneNumber) {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"], // Imara zaidi
        syncFullHistory: false, // USI-SYNC historia ya zamani
        shouldSyncHistoryMessage: () => false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
    });

    sock.ev.on('creds.update', saveCreds);

    return new Promise(async (resolve, reject) => {
        const timeout = setTimeout(() => {
            sock.end();
            reject(new Error("Timeout"));
        }, 30000);

        try {
            await delay(5000);
            let cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
            
            if (!sock.authState.creds.registered) {
                const code = await sock.requestPairingCode(cleanedNumber);
                clearTimeout(timeout);
                resolve(code);
            }
        } catch (error) {
            clearTimeout(timeout);
            sock.end();
            reject(error);
        }
    });
}

module.exports = { startPairing };
