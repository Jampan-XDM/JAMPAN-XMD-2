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
    // 1. Tengeneza folder la muda la session ili lisichanganye
    const sessionPath = `./sessions/${number}`;
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirpSync(sessionPath);
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    try {
        const sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }),
            browser: ["JAMPAN-XMD", "Chrome", "1.0.0"]
        });

        // 2. Omba Pairing Code kama haujajisajili
        if (!sock.authState.creds.registered) {
            await delay(2000); // Subiri kidogo socket iwe imara
            const code = await sock.requestPairingCode(number);
            return code; // Hapa ndipo kodi inarudishwa kwenda index.js
        } else {
            return "Already Registered";
        }

    } catch (err) {
        console.error("Error in pairing logic:", err);
        throw new Error("Failed to generate pairing code.");
    }
}

// HII NI MUHIMU SANA: Hakikisha jina ni startPairing
module.exports = { startPairing };
