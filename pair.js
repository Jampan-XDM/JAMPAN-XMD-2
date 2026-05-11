const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    fetchLatestBaileysVersion,
    Browsers,
    makeCacheableSignalKeyStore,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require('fs');

// Global socket instance ili kuzuia socket nyingi kusearch pairing kwa wakati mmoja
global.sockInstance = global.sockInstance || null;

async function startPairing(phoneNumber) {
    // 1. Kama kuna socket ya zamani, iue kabisa kuzuia mgongano
    if (global.sockInstance) {
        try {
            global.sockInstance.ev.removeAllListeners('connection.update');
            global.sockInstance.logout();
            global.sockInstance.end();
        } catch (e) {}
        global.sockInstance = null;
    }

    // 2. Safisha folder la session kila mara kuzuia session corrupted
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
        browser: Browsers.ubuntu("Chrome"), // Msishitue WhatsApp
        syncFullHistory: false,
        shouldSyncHistoryMessage: () => false,
    });

    global.sockInstance = sock;

    // 3. Save creds papo hapo - Hiki ndicho kilikuwa kinakosekana
    sock.ev.on('creds.update', async () => {
        await saveCreds();
    });

    return new Promise(async (resolve, reject) => {
        const timeout = setTimeout(() => {
            if (sock) sock.end();
            reject(new Error("Request Timeout"));
        }, 30000);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'open') {
                console.log("✅ Connected Successfully!");
                clearTimeout(timeout);
            }
            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                console.log("❌ Connection Closed. Reason:", reason);
                // Ukiona 401 au 428 hapa ujue namba imepata ban ya muda au session imeharibika
            }
        });

        try {
            await delay(5000); // Ipe socket muda wa kusetup handshake
            let cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
            
            if (!sock.authState.creds.registered) {
                // Omba kodi mara moja tu!
                const code = await sock.requestPairingCode(cleanedNumber);
                clearTimeout(timeout);
                resolve(code);
            } else {
                clearTimeout(timeout);
                reject(new Error("Namba imesajiliwa tayari!"));
            }
        } catch (error) {
            clearTimeout(timeout);
            reject(error);
        }
    });
}

module.exports = { startPairing };
