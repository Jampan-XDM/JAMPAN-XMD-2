const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    Browsers, 
    delay, 
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require('fs');
const path = require('path');

async function startPairing(phoneNumber) {
    // --- STEP 1: CLEANING SESSION ---
    const sessionPath = path.join(__dirname, 'session');
    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: Browsers.ubuntu("Chrome"),
        syncFullHistory: false,
        markOnlineOnConnect: true,
    });

    sock.ev.on('creds.update', saveCreds);

    return new Promise(async (resolve, reject) => {
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                console.log('✅ JAMPAN XMD Connected!');
                
                // --- STEP 2: SEND WELCOME MESSAGE (MESSAGE YOURSELF) ---
                const myNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                const welcomeMsg = `*JAMPAN XMD CONNECTED SUCCESSFULLY!* ✅\n\n` +
                                 `> *Status:* Active\n` +
                                 `> *Owner:* Kelvin Jampan\n` +
                                 `> *Bot Name:* DRAXEN-Ai\n\n` +
                                 `Sasa unaweza kutumia bot yako kwa amani. 🔥`;
                
                await sock.sendMessage(myNumber, { text: welcomeMsg });
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason !== DisconnectReason.loggedOut) {
                    console.log("Connection closed, trying to fix...");
                }
            }
        });

        // --- STEP 3: REQUEST PAIRING CODE ---
        try {
            await delay(3000); // Muda wa socket kutulia
            let cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
            if (!sock.authState.creds.registered) {
                const code = await sock.requestPairingCode(cleanedNumber);
                resolve(code);
            }
        } catch (error) {
            console.error("Pairing Error:", error);
            reject(error);
        }
    });
}

module.exports = { startPairing };
