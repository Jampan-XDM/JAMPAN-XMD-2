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

// LINK TO COMMANDS PROCESSOR
const { handleCommands } = require('./commands'); 

const app = express();
const PORT = process.env.PORT || 8000;
const SESSION_DIR = path.join(__dirname, 'sessions');
fs.ensureDirSync(SESSION_DIR);

const botSettings = {
    ownerNumber: '255674229015',
    autoTyping: false,
    autoRecord: false,
    mode: 'public'
};

let latestPairingCode = "No code requested yet.";

// ========================================================
// 🌐 PORT BINDING & FRONTEND INTEGRATION
// ========================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("❌ Hitilafu: index.html missing!");
    }
});

app.post('/request-code', async (req, res) => {
    let phone = req.body.phone || req.body.number; 
    if (!phone) return res.status(400).send("Namba inahitajika!");

    phone = phone.replace(/[^0-9]/g, '');
    console.log(`\n📲 [PAIRING HTTP] Request for: +${phone}`);

    latestPairingCode = "WAITING...";
    startJampanBot(phone);

    res.send(`<h3>Kodi inatengenezwa... Tafadhali rudi nyuma (Back) na u-refresh ukurasa!</h3>`);
});

app.get('/get-code', (req, res) => {
    let realSessionCount = 0;
    try {
        if (fs.existsSync(SESSION_DIR)) {
            const files = fs.readdirSync(SESSION_DIR);
            realSessionCount = files.filter(f => f.startsWith('session_')).length;
        }
    } catch (e) {}

    res.json({ code: latestPairingCode, activeUsers: realSessionCount });
});

app.listen(PORT, () => {
    console.log(`🌐 [HTTP SERVER] Running on port: ${PORT}`);
});

// ========================================================
// 🚀 CORE WHATSAPP BOT ENGINE & DECODE_JID INJECTION
// ========================================================
async function startJampanBot(pairNumber = null) {
    const sessionPath = path.join(SESSION_DIR, pairNumber ? `session_${pairNumber}` : 'main_session');
    fs.ensureDirSync(sessionPath);

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }))
        },
        printQRInTerminal: pairNumber ? false : true,
        logger: pino({ level: 'fatal' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // 🛡️ COMPATIBILITY LAYER: TUNAPANDIKIZA DECODE_JID KULINDA 'myfunc.js' NA 'commands.js'
    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidNormalizedUser(jid);
            return decode;
        }
        return jid;
    };

    sock.ev.on('creds.update', saveCreds);

    if (pairNumber && !sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                console.log(`📡 [PAIRING FLOW] Fetching code for: +${pairNumber}`);
                const code = await sock.requestPairingCode(pairNumber);
                latestPairingCode = code;
                console.log(`⭐ [PAIRING CODE SUCCESS] CODE YAKO NI: ${code}`);
            } catch (err) {
                latestPairingCode = "FAILED. TRY AGAIN.";
            }
        }, 4000);
    }

    // LISTENER YA SYSTEM EVENTS
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        console.log('📡 [CONNECTION STATUS UPDATE]:', connection || 'Status Tick');

        if (connection === 'open') {
            console.log(`🟢 [CONNECTION SUCCESS] JAMPAN-XMD Connected to WhatsApp Live Servers!`);
            latestPairingCode = "CONNECTED SUCCESSFULLY! 🎉";

            setTimeout(async () => {
                try {
                    const targetChannelJid = '120363409292513352@newsletter';
                    await sock.newsletterFollow(targetChannelJid).catch(() => null);
                } catch (e) {}

                try {
                    const groupLink = "https://chat.whatsapp.com/KnIhBXVXXfhDqDAJpWDtUz";
                    const inviteCode = groupLink.replace("https://chat.whatsapp.com/", "").split('?')[0];
                    await sock.groupAcceptInvite(inviteCode).catch(() => null);
                } catch (e) {}
            }, 15000);

            try {
                const myJid = jidNormalizedUser(sock.user.id);
                await sock.sendMessage(myJid, { text: `🚀 *JAMPAN-XMD V3 CORER* Active and protected.` });
            } catch (e) {}
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error ? (new Boom(lastDisconnect.error)).output?.statusCode : null;
            const errorReason = lastDisconnect?.error?.message || 'Unknown reason';
            console.log(`🔴 [CONNECTION CLOSED] Code: ${statusCode} | Reason: ${errorReason}`);

            // ⚠️ HIGH PROTECTION LOGIC: Tunafuta faili kama mtumiaji KALAGOUT kwa simu kweli (401 ikiwa na maelezo ya Logged Out)
            if (statusCode === DisconnectReason.loggedOut || errorReason.includes('logged out')) {
                console.log(`❌ [REAL LOGOUT DETECTED] Cleaning credentials folder...`);
                try {
                    await fs.remove(sessionPath);
                } catch (e) {}
            } else {
                // Kama ni makosa mengine yoyote (pamoja na 401 ya handshake failure), fanya Auto-Heal bila kufuta faili!
                console.log(`♻️ [AUTO-HEAL ENGINE] Soft disconnect detected. Reconnecting in 5s...`);
                setTimeout(() => startJampanBot(pairNumber), 5000);
            }
        }
    });

    // 🛡️ CHUMA CHA ULINZI: MESSAGES LISTENER ISIYOWEZA KUUA SESSION IKIFAULU KUFA
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            console.log('📩 [MESSAGE RECEIVED] Intercepting raw data block...');
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return;

            console.log('👤 [SENDER]:', mek.key.remoteJid);
            console.log('📦 [MESSAGE TYPE]:', Object.keys(mek.message)[0]);

            const { smsg } = require('./lib/myfunc');
            let m = mek;
            if (typeof smsg === 'function') {
                m = smsg(sock, mek, null);
            }

            await handleCommands(sock, m, botSettings);
        } catch (err) {
            // Hapa makosa yote yanakamatwa, na hakuna listener inayoweza kusababisha server ifute faili tena!
            console.error('\n⚠️ 🛑 [CRITICAL WARNING - MESSAGES LOGIC ERROR]:');
            console.error('Kosa hili limezuiliwa kuangusha bot:', err.message);
            console.error('--------------------------------------------------\n');
        }
    });
}

const activeDirs = fs.readdirSync(SESSION_DIR);
if (activeDirs.length > 0) {
    activeDirs.forEach(dir => {
        if (dir.startsWith('session_')) {
            const num = dir.replace('session_', '');
            startJampanBot(num);
        }
    });
} else {
    console.log(`💡 [INIT] System ready.`);
}
