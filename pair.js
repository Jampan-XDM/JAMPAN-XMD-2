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
    const sessionPath = path.join(__dirname, 'session');
    
    // Safisha session kila unapoanza pairing mpya
    try {
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
        }
    } catch (e) { console.log("Cleaning session..."); }

    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Safari"), // Safari ni imara zaidi kwa pairing
        // --- HIZI SETTINGS ZINAUA ENDLESS LOGIN ---
        syncFullHistory: false, 
        shouldSyncHistoryMessage: () => false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        maxMsgRetryCount: 1,
        getMessage: async () => ({ conversation: 'JAMPAN XMD IS READY' })
    });

    sock.ev.on('creds.update', saveCreds);

    return new Promise(async (resolve, reject) => {
        const timeout = setTimeout(() => {
            sock.end();
            reject(new Error("Timeout reached"));
        }, 40000);

        sock.ev.on('connection.update', async (update) => {
            const { connection } = update;
            if (connection === 'open') {
                const myNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                await delay(2000);
                await sock.sendMessage(myNumber, { 
                    text: `*JAMPAN XMD CONNECTED!* ✅\n\n> *Owner:* Kelvin Jampan\n> *Status:* Active` 
                });
                console.log("✅ Successfully connected to", myNumber);
            }
        });

        try {
            await delay(5000); // Ipe muda socket kuanza vizuri
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
