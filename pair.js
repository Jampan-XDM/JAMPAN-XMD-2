const { default: makeWASocket, useMultiFileAuthState, Browsers, delay, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startPairing(phoneNumber) {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Chrome"),
        syncFullHistory: false
    });

    await delay(3000); // Subiri socket itulie

    if (!sock.authState.creds.registered) {
        try {
            let code = await sock.requestPairingCode(phoneNumber);
            return code;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = { startPairing };
