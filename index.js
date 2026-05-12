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
let activeUsers = new Set(); // Inahifadhi watumiaji wa Inbox
const MAX_USERS = 100; // Kikomo cha watumiaji 100

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

// API ya Pairing inayotumiwa na index.html (IMEFanyiwa Update ya Logout)
app.get('/pair', async (req, res) => {
    let number = req.query.number;
    if (!number) return res.status(400).send({ error: "Namba inahitajika!" });
    number = number.replace(/[^0-9]/g, '');

    // "Ua" muunganisho uliopo kama upo ili kuruhusu namba mpya
    if (sock) {
        try { 
            sock.logout(); 
            sock.end();
        } catch (e) {}
        sock = null;
    }

    console.log(`📲 Inatengeneza kodi kwa: ${number}`);
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
        res.status(500).send({ error: "Server Busy au Error imetokea. Jaribu tena." });
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

                // TRY-CATCH IMEONGEZWA HAPA KUZUIA CONNECTION CRASH
                try {
                    const myJid = jidNormalizedUser(sock.user.id);

                    // --- FEATURE 1: FIRST MESSAGE (BOT CONNECTED) ---
                    await sock.sendMessage(myJid, { text: "✅ *BOT CONNECTED SUCCESSFULLY*\n\nJAMPAN-XMD is online type .menu." });

                    await delay(3000); 

                    // --- FEATURE 2: FORWARDED CHANNEL MESSAGE (YOUTUBE) ---
                    await sock.sendMessage(myJid, {
                        text: "🚀 *HELLO USER, PLEASE SUBSCRIBE*\n\nhi welcome to JAMPAN-XMD please subscribe my youtube:\n\n🔗 https://youtube.com/@jampani-xmd?si=oLPtRqYf1h1ygSzt\n\n*Support JAMPAN-XMD Development!*",
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363409292513352@newsletter',
                                newsletterName: 'JAMPAN-XMD UPDATES',
                                serverMessageId: 143
                            }
                        }
                    }, { quoted: { key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' }, message: { conversation: "JAMPAN-XMD IS ONLINE 🚀" } } });

                    // Auto Join Group (Kama ipo)
                    try { 
                        await sock.groupAcceptInvite("KJH675jhgH76ghj"); 
                    } catch (e) {
                        console.log("Group Join Error: Invite link is expired.");
                    }
                } catch (err) {
                    console.log("⚠️ Ujumbe wa kuanza haukutumwa: Connection bado haijatulia.");
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

                // --- LOGIC YA USER LIMIT (100 USERS) ---
                const isGroup = from.endsWith('@g.us');
                const isStatus = from === 'status@broadcast';

                if (!isGroup && !isStatus && !m.key.fromMe) {
                    if (!activeUsers.has(from)) {
                        if (activeUsers.size >= MAX_USERS) {
                            return; // Stop processing for new users beyond 100
                        }
                        activeUsers.add(from);
                        console.log(`👥 New User: ${from}. Total: ${activeUsers.size}/${MAX_USERS}`);
                    }
                }

                // Features: Auto Status & Typing
                if (isStatus && settings.autoStatusView) await sock.readMessages([m.key]);
                if (settings.autoTyping && !m.key.fromMe) await sock.sendPresenceUpdate('composing', from);

                // --- SULUHISHO LA USALAMA WA COMMANDS ---
                try {
                    const { handleCommands } = require('./commands'); 
                    await handleCommands(sock, m, settings);
                } catch (cmdError) {
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
