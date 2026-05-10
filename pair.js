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
    // FUTA SESSION KWA USALAMA (Try-Catch kuzuia crash)
    const sessionPath = path.join(__dirname, 'session');
    try {
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
        }
    } catch (e) {
        console.log("Session clear error (ignored):", e.message);
    }

    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Safari"), // Safari inakubali haraka
        syncFullHistory: false,
    });

    sock.ev.on('creds.update', saveCreds);

    return new Promise(async (resolve, reject) => {
        // 1. Weka Timeout ya sekunde 20
        const timeout = setTimeout(() => {
            sock.end();
            reject(new Error("WhatsApp Server Timeout"));
        }, 20000);

        sock.ev.on('connection.update', async (update) => {
            const { connection } = update;
            if (connection === 'open') {
                console.log('✅ Connected!');
                const myNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                await sock.sendMessage(myNumber, { text: `*JAMPAN XMD* Connected! ✅` });
            }
        });

        try {
            // 2. Muda wa socket kujiandaa
            await delay(3000); 
            
            let cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
            console.log("Requesting code for:", cleanedNumber);

            if (!sock.authState.creds.registered) {
                // 3. Omba kodi
                const code = await sock.requestPairingCode(cleanedNumber);
                clearTimeout(timeout);
                resolve(code);
            } else {
                clearTimeout(timeout);
                reject(new Error("Namba tayari imeshaunganishwa!"));
            }
        } catch (error) {
            clearTimeout(timeout);
            console.error("Pairing Error Detail:", error);
            sock.end();
            reject(error);
        }
    });
}

module.exports = { startPairing };
