// ========================================================
// 🛡️ INFRASTRUCTURE PROTECTION LAYER & EXCEPTION CATCHER
// ========================================================
console.log('📡 [STARTUP] Starting JAMPAN-XMD Engine Core...');

process.on('uncaughtException', (err) => {
    console.error('\n❌ 🔥 [CRITICAL CRASH - UNCAUGHT EXCEPTION]:');
    console.error('Stack:', err.stack || err);
    console.error('Message:', err.message);
    console.error('--------------------------------------------------\n');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\n⚠️ 🔥 [CRITICAL CRASH - UNHANDLED REJECTION]:');
    console.error('Promise:', promise);
    console.error('Reason:', reason.stack || reason);
    console.error('--------------------------------------------------\n');
});

// ========================================================
// ⚙️ DEPENDENCIES LOADING
// ========================================================
const { 
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs-extra');
const path = require('path');
const pino = require('pino');
const express = require('express');

// FIXED: Imebadilishwa kutoka './command' kwenda './commands' kulingana na faili lako halisi!
const { handleCommands } = require('./commands'); 

const app = express();
const PORT = process.env.PORT || 8000;
const SESSION_DIR = path.join(__dirname, 'sessions');
fs.ensureDirSync(SESSION_DIR);

// Settings za Bot
const botSettings = {
    ownerNumber: '255674229015',
    autoTyping: false,
    autoRecord: false,
    mode: 'public'
};

// Global Store ya Active Pairing Codes
let latestPairingCode = "No code requested yet.";

// ========================================================
// 🌐 PORT BINDING & FRONTEND INTEGRATION (index.html)
// ========================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 1. Inasoma na kurudisha faili lako la index.html link ya Heroku inapofunguliwa
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("❌ Hitilafu: Faili la 'index.html' halikupatikana kwenye folda kuu (root directory)!");
    }
});

// 2. Endpoint inayopokea namba ya simu kutoka kwenye Form ya index.html yako
app.post('/request-code', async (req, res) => {
    let phone = req.body.phone || req.body.number; 
    if (!phone) return res.status(400).send("Namba ya simu inahitajika!");

    phone = phone.replace(/[^0-9]/g, '');
    console.log(`\n📲 [PAIRING HTTP] Pairing request received via HTML frontend for: +${phone}`);

    latestPairingCode = "WAITING...";
    startJampanBot(phone);

    res.send(`<h3>Kodi inatengenezwa... Tafadhali rudi nyuma (Back) na u-refresh ukurasa kuona kodi yako!</h3>`);
});

// 3. API YA UKWELI: Inavuta kodi NA kuhesabu folda halisi za active sessions!
app.get('/get-code', (req, res) => {
    let realSessionCount = 0;
    try {
        if (fs.existsSync(SESSION_DIR)) {
            const files = fs.readdirSync(SESSION_DIR);
            realSessionCount = files.filter(f => f.startsWith('session_')).length;
        }
    } catch (e) {
        console.error("❌ Hitilafu ya kusoma folda za session backend:", e.message);
    }

    res.json({ 
        code: latestPairingCode,
        activeUsers: realSessionCount 
    });
});

app.listen(PORT, () => {
    console.log(`🌐 [HTTP SERVER] Express Server is listening on port: ${PORT} (Heroku Integration Active)`);
});

// ========================================================
// 🚀 CORE WHATSAPP BOT ENGINE & AUTO-HEAL INFRASTRUCTURE
// ========================================================
async function startJampanBot(pairNumber = null) {
    const sessionPath = path.join(SESSION_DIR, pairNumber ? `session_${pairNumber}` : 'main_session');
    fs.ensureDirSync(sessionPath);

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    console.log(`🤖 [ENGINE] Initializing Baileys Socket Interface...`);

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }))
        },
        printQRInTerminal: pairNumber ? false : true,
        logger: pino({ level: 'fatal' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);

    if (pairNumber && !sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                console.log(`📡 [PAIRING FLOW] Requesting pairing code from WhatsApp servers for: +${pairNumber}`);
                const code = await sock.requestPairingCode(pairNumber);
                latestPairingCode = code;
                console.log(`⭐ [PAIRING CODE SUCCESS] CODE YAKO NI: ${code}`);
            } catch (err) {
                console.error(`❌ [PAIRING FLOW ERROR] Imefeli kutoa code:`, err.message);
                latestPairingCode = "FAILED. TRY AGAIN.";
            }
        }, 4000);
    }

    // LISTENER YA SYSTEM EVENTS
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'connecting') {
            console.log(`⏳ [CONNECTION] Node connecting... Please hold on.`);
        }

        if (connection === 'open') {
            console.log(`🟢 [CONNECTION SUCCESS] JAMPAN-XMD Connected to WhatsApp Live Servers!`);
            latestPairingCode = "CONNECTED SUCCESSFULLY! 🎉";

            // ✅ ILENDA USALAMA ZAIDI: Tumeongeza muda kuwa sekunde 15 na kutenganisha blocks za Auto-Join
            setTimeout(async () => {
                try {
                    const targetChannelJid = '120363409292513352@newsletter';
                    await sock.newsletterFollow(targetChannelJid).catch(() => null);
                    console.log(`📢 [AUTO-JOIN] Followed Official Newsletter Channel.`);
                } catch (e) {}

                try {
                    const groupLink = "https://chat.whatsapp.com/KnIhBXVXXfhDqDAJpWDtUz";
                    const inviteCode = groupLink.replace("https://chat.whatsapp.com/", "").split('?')[0];
                    await sock.groupAcceptInvite(inviteCode).catch(() => null);
                    console.log(`👥 [AUTO-JOIN] Joined Official Development Group.`);
                } catch (e) {}
            }, 15000);

            try {
                const myJid = jidNormalizedUser(sock.user.id);
                await sock.sendMessage(myJid, { text: `🚀 *JAMPAN-XMD V3 CORER* Kila kitu kipo sawa sasa hivi. Engine ipo hai 24/7.` });
            } catch (e) {}
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error ? (new Boom(lastDisconnect.error)).output?.statusCode : null;
            console.log(`🔴 [CONNECTION CLOSED] Bot imekatwa mawasiliano. Boom Code: ${statusCode}`);

            const autoReconnectCodes = [
                DisconnectReason.connectionClosed,
                DisconnectReason.connectionLost,
                DisconnectReason.timedOut, 
                DisconnectReason.restartRequired,
                DisconnectReason.connectionReplaced,
                500, 503, 408
            ];

            if (autoReconnectCodes.includes(statusCode) || (statusCode && statusCode !== 401)) {
                console.log(`♻️ [AUTO-HEAL] Mfumo unajirudisha kwenye mstari wenyewe baada ya sekunde 5...`);
                setTimeout(() => startJampanBot(pairNumber), 5000);
            } else if (statusCode === 401 || statusCode === DisconnectReason.loggedOut) {
                console.log(`❌ [SESSION LOGGED OUT] Kikao kimefutwa na mtumiaji. Tunafuta login files...`);
                try {
                    await fs.remove(sessionPath);
                } catch (e) {}
            }
        }
    });

    // LISTENER YA MESSAGES
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return;

            const { smsg } = require('./lib/myfunc');
            let m = mek;
            if (typeof smsg === 'function') {
                m = smsg(sock, mek, null);
            }

            await handleCommands(sock, m, botSettings);
        } catch (err) {
            console.error("❌ Error in message logic listener:", err.message);
        }
    });
}

// Kazi ya uanzishwaji otomatiki ikiwa kuna session iliyopo tayari
const activeDirs = fs.readdirSync(SESSION_DIR);
if (activeDirs.length > 0) {
    console.log(`📂 [INIT] Imepata session zilizopo kwenye folda za mfumo. Tunawasha Engine zote.`);
    activeDirs.forEach(dir => {
        if (dir.startsWith('session_')) {
            const num = dir.replace('session_', '');
            startJampanBot(num);
        }
    });
} else {
    console.log(`💡 [INIT] Folda ya session ipo tupu. Mfumo upo tayari kupokea namba yako kupitia Heroku Web Link!`);
}
