const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore, 
    DisconnectReason 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs-extra");

async function startPairing(number) {
    const cleanedNumber = number.replace(/[^0-9]/g, '');
    // Muhimu: Tunatumia folder lile lile la main_session ili bot iwake hapo hapo
    const sessionPath = `./sessions/main_session`;

    if (fs.existsSync(sessionPath)) {
        await fs.remove(sessionPath);
    }
    await fs.ensureDir(sessionPath);

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        // Heartbeat kuzuia socket kufa Heroku
        keepAliveIntervalMs: 30000 
    });

    return new Promise(async (resolve, reject) => {
        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'open') {
                console.log(`✅ JAMPAN-XMD IMESHAUNGANISHWA KIKAMILIFU!`);
                // Hapa session imeshakamilika
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason !== DisconnectReason.loggedOut) {
                    console.log("♻️ Connection lost during pairing, keeping socket alive...");
                }
            }
        });

        // Subiri sekunde 10 socket iwe imara
        await delay(10000); 

        try {
            if (!sock.authState.creds.registered) {
                const code = await sock.requestPairingCode(cleanedNumber);
                console.log(`🔑 KODI YAKO: ${code}`);
                resolve(code);
            }
        } catch (err) {
            console.error("❌ Pairing Error:", err);
            reject(err);
        }
    });
}

module.exports = { startPairing };
