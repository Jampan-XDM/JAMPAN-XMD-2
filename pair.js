const { default: makeWASocket, Browsers, delay } = require("@whiskeysockets/baileys");
const Pino = require("pino");

async function startPairing(phoneNumber, res) {
    const { state, saveCreds } = await require('./auth').getAuth('session');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: Pino({ level: "silent" }),
        // Hapa ndipo tunadanganya mfumo uonekane kama MacOS/Chrome
        browser: Browsers.macOS("Desktop"), 
        syncFullHistory: false
    });

    if (!sock.authState.creds.registered) {
        // Tunampa muda mfupi wa kujiandaa kabla ya kuomba code
        await delay(2000); 
        let code = await sock.requestPairingCode(phoneNumber);
        return code;
    }
}

module.exports = { startPairing };
