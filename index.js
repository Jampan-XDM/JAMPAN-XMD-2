const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore, 
    DisconnectReason,
    jidNormalizedUser
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const path = require("path");
const fs = require("fs-extra");

const app = express();
const PORT = process.env.PORT || 3000;

// GLOBAL VARIABLES
let sock = null;
let isPairing = false;

let settings = {
    autoStatusView: true,
    autoTyping: true,
    mode: 'public',
    ownerNumber: '255674229015'
};

// --- EXPRESS SERVER SETUP (Zinazuia H10 Error) ---
app.use(express.static(path.join(__dirname, '.')));

// Inasoma index.html yako iliyopo kwenye repo kwa ajili ya pairing UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API ya Pairing inayotumiwa na index.html
app.get('/pair', async (req, res) => {
    let number = req.query.number;
    if (!number) return res.status(400).send({ error: "enter number!" });
    number = number.replace(/[^0-9]/g, '');

    if (isPairing) return res.status(429).send({ error: "wait for pair code..." });

    console.log(`📲 generating code to: ${number}`);
    isPairing = true;

    try {
        // Futa session ya zamani kuanza upya ili kuzuia conflict
        if (fs.existsSync('./sessions/main_session')) {
            await fs.remove('./sessions/main_session');
        }
        const code = await startJampanBot(number);
        res.status(200).send({ code: code });
    } catch (err) {
        isPairing = false;
        console.log("Pairing Error:", err);
        res.status(500).send({ error: "Server Busy Error. try again." });
    }
});

// Msikilizaji wa Port (Lazima uwe nje ili uanze haraka)
app.listen(PORT, () => {
    console.log(`📡 JAMPAN-XMD Engine Live on Port ${PORT}`);
    // Kama session ipo, iwashe bot moja kwa moja
    if (fs.existsSync('./sessions/main_session/creds.json')) {
        startJampanBot();
    }
});

// --- CORE BOT ENGINE ---
async function startJampanBot(pairNumber = null) {
    const { state, saveCreds } = await useMultiFileAuthState('./sessions/main_session');

    sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        keepAliveIntervalMs: 30000,
        defaultQueryTimeoutMs: undefined
    });

    sock.ev.on('creds.update', saveCreds);

    return new Promise(async (resolve, reject) => {
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                isPairing = false;
                console.log("✅ JAMPAN-XMD IS ONLINE!");
                
                const myJid = jidNormalizedUser(sock.user.id);
                const welcomeMsg = "🚀 *JAMPAN-XMD CONNECTED SUCCESS*\n\nJAMPAN-XMD is online! type .menu to continue using bot.\n\n*By:* Kelvin Jampan\n*Website:* jampan47.vercel.app";
                
                await sock.sendMessage(myJid, { text: welcomeMsg });

                // Auto Join Group (Kama ipo)
                try { 
                    await sock.groupAcceptInvite("KJH675jhgH76ghj"); 
                } catch (e) {
                    console.log("Group Join Error: Invite link expired.");
                }
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                isPairing = false;

                if (reason !== DisconnectReason.loggedOut) {
                    console.log("♻️ Reconnecting...");
                    setTimeout(() => startJampanBot(), 5000);
                } else {
                    console.log("❌ Connection Logged Out. Futa session uanze upya.");
                    await fs.remove('./sessions/main_session');
                }
            }
        });

        sock.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const m = chatUpdate.messages[0];
                if (!m || !m.message) return;
                const from = m.key.remoteJid;

                // Features: Auto Status & Typing
                if (from === 'status@broadcast' && settings.autoStatusView) await sock.readMessages([m.key]);
                if (settings.autoTyping && !m.key.fromMe) await sock.sendPresenceUpdate('composing', from);

                // --- SULUHISHO LA USALAMA WA COMMANDS ---
                try {
                    const { handleCommands } = require('./commands'); 
                    await handleCommands(sock, m, settings);
                } catch (cmdError) {
                    // Hapa bot haitakufa hata kama commands.js ina error
                    console.log("❌ Error kwenye commands.js:", cmdError.message);
                }

            } catch (e) { 
                console.log("Error ya jumla kwenye Upsert:", e); 
            }
        });

        // Pairing Code Logic
        if (pairNumber && !sock.authState.creds.registered) {
            await delay(8000); 
            try {
                const code = await sock.requestPairingCode(pairNumber);
                resolve(code);
            } catch (err) {
                isPairing = false;
                reject(err);
            }
        }
    });
}
