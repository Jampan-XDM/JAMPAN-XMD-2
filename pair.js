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

global.sockInstance = global.sockInstance || null;

async function startPairing(phoneNumber) {
    // 1. Safisha socket ya zamani
    if (global.sockInstance) {
        try {
            global.sockInstance.ev.removeAllListeners();
            global.sockInstance.end();
        } catch (e) {}
        global.sockInstance = null;
    }

    // 2. Setup auth state
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
    });

    global.sockInstance = sock;

    return new Promise(async (resolve, reject) => {
        // Timeout baada ya sekunde 40 kama mambo yamekwama
        const timeout = setTimeout(() => {
            if (sock) sock.end();
            reject(new Error("Muda umeisha! Jaribu tena."));
        }, 40000);

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                console.log("✅ JAMPAN XMD Connected!");
                clearTimeout(timeout);
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                console.log("❌ Connection Closed. Reason:", reason);

                // DAWA YA 515 NA RESTART REQUIRED
                if (reason === 515 || reason === DisconnectReason.restartRequired) {
                    console.log("🔄 Restarting socket to fix connection...");
                    startPairing(phoneNumber); 
                } else {
                    global.sockInstance = null;
                    clearTimeout(timeout);
                }
            }
        });

        try {
            // Ipe Heroku sekunde 10 ya utulivu
            await delay(10000); 
            let cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
            
            if (!sock.authState.creds.registered) {
                const code = await sock.requestPairingCode(cleanedNumber);
                clearTimeout(timeout);
                resolve(code);
            } else {
                clearTimeout(timeout);
                reject(new Error("Tayari namba hii imeshaunganishwa!"));
            }
        } catch (error) {
            clearTimeout(timeout);
            reject(error);
        }
    });
}

module.exports = { startPairing };
