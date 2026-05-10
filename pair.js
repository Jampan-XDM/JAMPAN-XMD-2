const { default: makeWASocket, useMultiFileAuthState, Browsers, delay, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require('fs');

async function startPairing(phoneNumber) {
    // Kila ombi linatengeneza session ya muda (temp) kuzuia migongano
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }), // Muhimu kuzuia RAM overload
        browser: Browsers.macOS("Chrome"), // Inadanganya WA iwe thabiti
        syncFullHistory: false
    });

    // Subiri kidogo socket iwe imetulia
    await delay(3000);

    if (!sock.authState.creds.registered) {
        try {
            // Omba code
            let code = await sock.requestPairingCode(phoneNumber);
            return code;
        } catch (error) {
            console.error("Error requesting code:", error);
            throw error;
        }
    }
}

module.exports = { startPairing };
