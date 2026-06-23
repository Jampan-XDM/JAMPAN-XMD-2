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

// GLOBAL SESSIONS MEMORY
const activeSessions = {}; // Inashikilia soketi za bots zote zinazorun ({ 'main_session': sock, '25567...': sock })
let activeUsers = new Set(); 
const MAX_USERS = 100; 

let settings = {
    autoStatusView: true,
    autoTyping: true,
    mode: 'public',
    ownerNumber: '255674229015'
};

// Hakikisha folda kuu la sessions lipo
fs.ensureDirSync('./sessions');

app.use(express.static(path.join(__dirname, '.')));

// Zuia kero ya Favicon 404 isijaze logi za server au kuchelewesha ufanisi
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API ya Pairing (Sasa hivi haifuti Bot Kuu!)
app.get('/pair', async (req, res) => {
    let number = req.query.number;
    if (!number) return res.status(400).send({ error: "Namba inahitajika!" });
    number = number.replace(/[^0-9]/g, '');

    console.log(`📲 Inatengeneza kodi ya kifaa kipya kwa namba: ${number}`);

    // FIXED: Kufunga session ya zamani kwa kutumia ws.close() badala ya .end() ambayo haipo
    if (activeSessions[number]) {
        try { 
            activeSessions[number].ws.close(); 
        } catch (e) {
            console.log("Error kufunga soketi ya zamani:", e.message);
        }
        delete activeSessions[number];
    }

    try {
        // Tunatengeneza session folder maalum kwa ajili ya namba hii pekee
        const sessionFolder = `./sessions/${number}`;

        // Kama alikuwa amewahi kujaribu lakini hakumaliza, futa folda lake la zamani aanze upya
        if (fs.existsSync(sessionFolder) && !fs.existsSync(`${sessionFolder}/creds.json`)) {
            await fs.remove(sessionFolder);
        }

        // Washa bot kwa ajili ya namba hii na subiri kupokea pairing code
        const code = await startJampanBot(sessionFolder, number);
        res.status(200).send({ code: code });
    } catch (err) {
        console.log("Pairing Error kwa namba " + number + ":", err);
        res.status(500).send({ error: "Server Busy au Error imetokea. Jaribu tena." });
    }
});

// Msikilizaji wa Port na Kufufua Bots zilizopo
app.listen(PORT, async () => {
    console.log(`📡 JAMPAN-XMD Engine Live on Port ${PORT}`);

    // 1. Washa Bot Kuu kiotomatiki kama ipo
    if (fs.existsSync('./sessions/main_session/creds.json')) {
        console.log("♻️ Inawasha Bot Kuu (Main Session)...");
        startJampanBot('./sessions/main_session').catch(err => console.log("Main Bot Error:", err));
    } else {
        console.log("⚠️ Main Session haijapatikana bado. Subiri iunganishwe.");
    }

    // 2. Fufua Bots zote za wateja zilizopo kwenye folda la sessions (Auto-Resurrect)
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

/**
 * CORE ENGINE YA MBELENI (Inakubali Folda Tofauti na Namba)
 */
async function startJampanBot(sessionPath, pairNumber = null) {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const sessionKey = path.basename(sessionPath); // Itakuwa 'main_session' au namba ya simu '255...'

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

    // Hifadhi hii socket kwenye global dictionary yetu ili tuweze kuitofautisha
    activeSessions[sessionKey] = sock;

    sock.ev.on('creds.update', saveCreds);

    return new Promise(async (resolve, reject) => {
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            // ==========================================================
            // NEW ANONYMOUS CONNECTION OPEN LOGIC
            // ==========================================================
            if (connection === 'open') {
                console.log(`\n╭━━━━━━━━━━━━━━━━━━━━⬣\n┃ ⚡ JAMPAN-XMD ONLINE\n┃ ☠️ Anonymous Session Active\n┃ 🚀 Node : ${sessionKey}\n╰━━━━━━━━━━━━━━━━━━━━⬣\n`);

                try {
                    const myJid = jidNormalizedUser(sock.user.id);

                    // ⚡ ANONYMOUS CONNECT MESSAGE
                    await sock.sendMessage(myJid, {
                        text: `\n╭━━〔 ⚡ SYSTEM ONLINE 〕━━⬣\n┃\n┃ ☠️ Anonymous connection established\n┃ 🚀 Multi-device node connected\n┃ 📡 Secure signal detected\n┃\n┃ > Session : ${sessionKey}\n┃ > Status : ACTIVE\n┃\n┃ 🔰 Type .menu to continue\n┃\n╰━━━━━━━━━━━━━━━━━━⬣\n`,
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterName: 'JAMPAN-XMD SYSTEM',
                                newsletterJid: '120363409292513352@newsletter',
                                serverMessageId: 144
                            },
                            externalAdReply: {
                                title: '⚡ JAMPAN-XMD ACTIVE',
                                body: 'Anonymous Multi Device',
                                thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                                sourceUrl: 'https://jampanbot.vercel.app',
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    });

                    await delay(2000);

                    // ⚡ AUTO FOLLOW CHANNEL
                    try {
                        await sock.newsletterFollow('120363409292513352@newsletter');
                        console.log(`\n╭━━━━━━━━━━━━━━━━━━━━⬣\n┃ 📢 CHANNEL CONNECTED\n┃ ⚡ Updates enabled\n╰━━━━━━━━━━━━━━━━━━━━⬣\n`);
                    } catch (channelErr) {
                        console.log(`\n╭━━━━━━━━━━━━━━━━━━━━⬣\n┃ ⚠️ CHANNEL BYPASSED\n┃ ${channelErr.message}\n╰━━━━━━━━━━━━━━━━━━━━⬣\n`);
                    }

                    await delay(2000);

                    // ⚡ YOUTUBE PROMOTION
                    await sock.sendMessage(myJid, {
                        image: { url: 'https://files.catbox.moe/fzjhed.png' },
                        caption: `\n╭━━〔 🎬 JAMPAN-XMD NODE 〕━━⬣\n┃\n┃ 🚀 Welcome to anonymous system\n┃\n┃ ☠️ Learn:\n┃ • WhatsApp Bots\n┃ • Pair Code Systems\n┃ • Baileys MD\n┃ • Web Development\n┃ • Termux Tricks\n┃\n┃ 📡 Tap below to access\n┃ official YouTube channel\n┃\n╰━━━━━━━━━━━━━━━━━━⬣\n`,
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            externalAdReply: {
                                title: '🎥 JAMPAN XMD OFFICIAL',
                                body: 'Bots • Coding • Tutorials',
                                thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                                sourceUrl: 'https://youtube.com/@jampani-xmd?si=oLPtRqYf1h1ygSzt',
                                mediaType: 1,
                                renderLargerThumbnail: true,
                                showAdAttribution: true
                            }
                        }
                    });

                    // ⚡ AUTO GROUP JOIN
                    try {
                        await sock.groupAcceptInvite("KJH675jhgH76ghj");
                        console.log(`\n╭━━━━━━━━━━━━━━━━━━━━⬣\n┃ 👥 GROUP CONNECTED\n┃ ⚡ Secure join success\n╰━━━━━━━━━━━━━━━━━━━━⬣\n`);
                    } catch (e) {
                        console.log(`\n╭━━━━━━━━━━━━━━━━━━━━⬣\n┃ ⚠️ GROUP JOIN FAILED\n┃ Link expired or invalid\n╰━━━━━━━━━━━━━━━━━━━━⬣\n`);
                    }

                } catch (err) {
                    console.log(`\n╭━━━━━━━━━━━━━━━━━━━━⬣\n┃ ❌ SYSTEM MESSAGE FAILED\n┃ ${err.message}\n╰━━━━━━━━━━━━━━━━━━━━⬣\n`);
                }
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;

                // FIXED: Ulinzi madhubuti kwa ajili ya Heroku network fluctuations
                if (reason !== DisconnectReason.loggedOut) {
                    console.log(`♻️ [${sessionKey}] Imekata, Inajaribu kureconnect... Reason code: ${reason}`);
                    setTimeout(() => startJampanBot(sessionPath), 5000);
                } else {
                    console.log(`❌ [${sessionKey}] Imefukuzwa kabisa (Logged Out). Tunafuta folda la session.`);
                    try {
                        await fs.remove(sessionPath);
                        delete activeSessions[sessionKey];
                    } catch (e) { 
                        console.log("Error kufuta folda:", e.message); 
                    }
                }
            }
        });

        sock.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const m = chatUpdate.messages[0];
                if (!m || !m.message) return;
                const from = m.key.remoteJid;

                const isGroup = from.endsWith('@g.us');
                const isStatus = from === 'status@broadcast';

                if (!isGroup && !isStatus && !m.key.fromMe) {
                    if (!activeUsers.has(from)) {
                        if (activeUsers.size >= MAX_USERS) return;
                        activeUsers.add(from);
                        console.log(`👥 New User on [${sessionKey}]: ${from}. Total: ${activeUsers.size}/${MAX_USERS}`);
                    }
                }

                // Auto View Status
                if (isStatus && settings.autoStatusView) {
                    await sock.readMessages([m.key]);
                }

                // FIXED AUTO TYPING
                if (settings.autoTyping && !m.key.fromMe && !isStatus) {
                    await sock.sendPresenceUpdate('composing', from);
                    setTimeout(async () => {
                        try {
                            await sock.sendPresenceUpdate('paused', from);
                        } catch (e) {}
                    }, 4000);
                }

                // PASSING BOTH SOCK AND SETTINGS TO COMMANDS
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

        // Pairing Code Generation bila Blockage
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
