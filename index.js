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
const { Boom } = require("@hapi/boom"); // FIXED: Tumeongeza Boom kwa ajili ya kuparse vizuri ghafla statusCode

const app = express();
const PORT = process.env.PORT || 3000;

// GLOBAL SESSIONS MEMORY
const activeSessions = {}; 
let activeUsers = new Set(); 
const MAX_USERS = 100; 

let settings = {
    autoStatusView: true,
    autoTyping: true,
    mode: 'public',
    ownerNumber: '255674229015'
};

fs.ensureDirSync('./sessions');

app.use(express.static(path.join(__dirname, '.')));
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API ya Pairing
app.get('/pair', async (req, res) => {
    let number = req.query.number;
    if (!number) return res.status(400).send({ error: "Namba inahitajika!" });
    number = number.replace(/[^0-9]/g, '');

    console.log(`📲 Inatengeneza kodi ya kifaa kipya kwa namba: ${number}`);

    if (activeSessions[number]) {
        try { activeSessions[number].ws.close(); } catch (e) {}
        delete activeSessions[number];
    }

    try {
        const sessionFolder = `./sessions/${number}`;

        if (fs.existsSync(sessionFolder) && !fs.existsSync(`${sessionFolder}/creds.json`)) {
            await fs.remove(sessionFolder);
        }

        const code = await startJampanBot(sessionFolder, number);
        res.status(200).send({ code: code });
    } catch (err) {
        console.log("Pairing Error kwa namba " + number + ":", err);
        res.status(500).send({ error: "Server Busy au Error imetokea. Jaribu tena." });
    }
});

app.listen(PORT, async () => {
    console.log(`📡 JAMPAN-XMD Engine Live on Port ${PORT}`);

    if (fs.existsSync('./sessions/main_session/creds.json')) {
        console.log("♻️ Inawasha Bot Kuu (Main Session)...");
        startJampanBot('./sessions/main_session').catch(err => console.log("Main Bot Error:", err));
    } else {
        console.log("⚠️ Main Session haijapatikana bado. Subiri iunganishwe.");
    }

    try {
        const files = await fs.readdir('./sessions');
        for (const file of files) {
            if (file !== 'main_session' && fs.statSync(path.join('./sessions', file)).isDirectory()) {
                if (fs.existsSync(`./sessions/${file}/creds.json`)) {
                    console.log(`♻️ [REBOOT] Inafufua sub-bot ya mtumiaji: ${file}`);
                    startJampanBot(`./sessions/${file}`).catch(e => console.log(`Error kuamsha ${file}:`, e));
                }
            }
        }
    } catch (e) {
        console.log("Error wakati wa kufufua sub-bots:", e);
    }
});

async function startJampanBot(sessionPath, pairNumber = null) {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const sessionKey = path.basename(sessionPath); 

    const sock = makeWASocket({
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

    activeSessions[sessionKey] = sock;

    // Hakikisha creds zinasave kila mara mabadiliko yanapotokea (Requirement 6 & 7)
    sock.ev.on('creds.update', saveCreds);

    return new Promise(async (resolve, reject) => {
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                console.log(`\n╭━━━━━━━━━━━━━━━━━━━━⬣\n┃ ⚡ JAMPAN-XMD ONLINE\n┃ 🚀 Node : ${sessionKey}\n╰━━━━━━━━━━━━━━━━━━━━⬣\n`);
                try {
                    const myJid = jidNormalizedUser(sock.user.id);
                    await sock.sendMessage(myJid, { text: `⚡ JAMPAN-XMD Connected Successfully on session: ${sessionKey}` });
                } catch (err) {
                    console.log(`❌ Error kutuma online message: ${err.message}`);
                }
            }

            if (connection === 'close') {
                // FIXED: Uchambuzi wa kina wa Error Code kwa kutumia Boom (Requirement 4 & 10)
                const statusCode = lastDisconnect?.error ? (new Boom(lastDisconnect.error)).output?.statusCode : null;
                
                console.log(`\n=====================================`);
                console.log(`📡 CONNECTION CLOSED LOG [${sessionKey}]`);
                console.log(`🔹 Status Code: ${statusCode}`);
                console.log(`🔹 Reason/Error: ${lastDisconnect?.error?.message || "Unknown Reason"}`);
                if (lastDisconnect?.error?.stack) console.log(`🔹 Stack Trace: ${lastDisconnect.error.stack}`);
                console.log(`=====================================\n`);

                // FIXED: Orodha ya makosa ya mtandao ambayo yanatakiwa KURECONNECT automatically (Requirement 1, 2, 3 & 5)
                const autoReconnectCodes = [
                    DisconnectReason.connectionClosed, // 428
                    DisconnectReason.connectionLost,   // 408 (Hapa ndipo palipokuwa na shida!)
                    DisconnectReason.timedOut,         // 408
                    DisconnectReason.restartRequired,  // 415
                    DisconnectReason.connectionReplaced, // 440
                    500, 503
                ];

                if (autoReconnectCodes.includes(statusCode) || statusCode !== DisconnectReason.loggedOut) {
                    console.log(`♻️ [${sessionKey}] Kosa la Mtandao (${statusCode}). Inajaribu kureconnect baada ya sekunde 5...`);
                    setTimeout(() => startJampanBot(sessionPath), 5000);
                } else if (statusCode === DisconnectReason.loggedOut) {
                    // Folda linafutwa TU kama WhatsApp imesema mtumiaji amelog out rasmi (Requirement 5)
                    console.log(`❌ [${sessionKey}] Imefukuzwa Rasmi na WhatsApp (Logged Out - 401). Tunafuta session.`);
                    try {
                        await fs.remove(sessionPath);
                        delete activeSessions[sessionKey];
                    } catch (e) { 
                        console.log("Error kufuta folda la session:", e.message); 
                    }
                } else {
                    // Sababu isiyojulikana, reconnect kwa usalama badala ya kufuta
                    console.log(`⚠️ [${sessionKey}] Disconnect isiyojulikana (${statusCode}). Reconnecting...`);
                    setTimeout(() => startJampanBot(sessionPath), 5000);
                }
            }
        });

        sock.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const m = chatUpdate.messages[0];
                if (!m || !m.message) return;
                const from = m.key.remoteJid;
                const isStatus = from === 'status@broadcast';

                if (isStatus && settings.autoStatusView) {
                    await sock.readMessages([m.key]);
                }

                if (settings.autoTyping && !m.key.fromMe && !isStatus) {
                    await sock.sendPresenceUpdate('composing', from);
                    setTimeout(async () => {
                        try { await sock.sendPresenceUpdate('paused', from); } catch (e) {}
                    }, 4000);
                }

                try {
                    const { handleCommands } = require('./commands'); 
                    await handleCommands(sock, m, settings);
                } catch (cmdError) {
                    console.log(`❌ Error kwenye commands.js ([${sessionKey}]):`, cmdError.message);
                }
            } catch (e) { 
                console.log("Error ya jumla kwenye Upsert:", e); 
            }
        });

        if (pairNumber && !sock.authState.creds.registered) {
            await delay(5000); 
            try {
                const code = await sock.requestPairingCode(pairNumber);
                resolve(code);
            } catch (err) {
                reject(err);
            }
        }
    });
}
