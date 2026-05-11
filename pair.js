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

global.sockInstance = global.sockInstance || null;

async function startPairing(phoneNumber) {
    // 1. Zuia Multiple Sockets
    if (global.sockInstance) {
        try {
            global.sockInstance.ev.removeAllListeners();
            global.sockInstance.end();
        } catch (e) {}
        global.sockInstance = null;
    }

    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        logger: pino({ level: "silent" }), // Unaweza kuweka "debug" ukitaka kuona kila kitu
        browser: Browsers.ubuntu("Chrome"),
        syncFullHistory: false,
    });

    global.sockInstance = sock;

    // 2. Heartbeat: Inatuma log kila dakika 1 kuhakikisha app haijalala
    const heartbeat = setInterval(() => {
        if (global.sockInstance) console.log("💓 JAMPAN XMD STILL ONLINE...");
    }, 60000);

    return new Promise(async (resolve, reject) => {
        sock.ev.on('creds.update', saveCreds);

        // 3. Wrap Connection Update na Try/Catch
        sock.ev.on('connection.update', async (update) => {
            try {
                const { connection, lastDisconnect } = update;
                if (connection === 'open') {
                    console.log("✅ CONNECTED TO WHATSAPP");
                }
                if (connection === 'close') {
                    const reason = lastDisconnect?.error?.output?.statusCode;
                    console.log("❌ Connection Closed. Reason:", reason);
                    
                    if (reason !== DisconnectReason.loggedOut) {
                        console.log("🔄 Reconnecting...");
                        startPairing(phoneNumber);
                    } else {
                        clearInterval(heartbeat);
                        global.sockInstance = null;
                    }
                }
            } catch (err) {
                console.log("Error in Connection Update:", err);
            }
        });

        try {
            await delay(10000); 
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
