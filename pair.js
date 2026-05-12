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
    // 1. Kusafisha namba
    const cleanedNumber = number.replace(/[^0-9]/g, '');
    const sessionPath = `./sessions/${cleanedNumber}`;

    // Futa session ya zamani kuzuia conflict
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
        // Identity thabiti ya Ubuntu Chrome kuzuia "Invalid Code"
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    return new Promise(async (resolve, reject) => {
        // Hifadhi creds kila zinapobadilika
        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'open') {
                console.log(`✅ JAMPAN-XMD Linked to ${cleanedNumber}`);
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason !== DisconnectReason.loggedOut) {
                    // Usijaribu kureconnect hapa wakati wa pairing kuzuia loop
                    console.log("Pairing socket closed.");
                }
            }
        });

        // --- PRODUCTION TIMING LOGIC ---
        // Subiri sekunde 10 ili socket iji-register kikamilifu kwa WhatsApp
        await delay(10000); 

        try {
            if (!sock.authState.creds.registered) {
                const code = await sock.requestPairingCode(cleanedNumber);
                console.log(`🔑 Pairing Code generated: ${code}`);
                resolve(code);
            } else {
                resolve("ALREADY_LOGGED_IN");
            }
        } catch (err) {
            console.error("❌ Pairing Request Failed:", err);
            reject(err);
        }
    });
}

module.exports = { startPairing };
