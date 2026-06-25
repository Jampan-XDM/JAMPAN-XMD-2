// ========================================================
// 🛡️ INFRASTRUCTURE PROTECTION LAYER & EXCEPTION CATCHER
// ========================================================
console.log('📡 [STARTUP] Starting JAMPAN-XMD Engine Core...');

process.on('uncaughtException', (err) => {
    console.error('\n❌ 🔥 [CRITICAL CRASH]:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('\n⚠️ 🔥 [CRITICAL REJECTION]:', reason.message || reason);
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
// 🛡️ GLOBAL TRACKER: Inazuia namba moja kuwashwa mara mbili (No dual instances/conflict)
const activeInstances = new Set();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) res.sendFile(indexPath);
    else res.status(404).send("❌ index.html missing!");
});

app.post('/request-code', async (req, res) => {
    let phone = req.body.phone || req.body.number; 
    if (!phone) return res.status(400).send("Namba inahitajika!");

    phone = phone.replace(/[^0-9]/g, '');
    console.log(`\n📲 [PAIRING HTTP] New Request for: +${phone}`);

    latestPairingCode = "WAITING...";

    // Ikiwa tayari ipo kwenye memory, usiiwashe upya kuondoa conflict
    if (activeInstances.has(phone)) {
        console.log(`⚠️ [PREVENTION] Engine for +${phone} is already initializing. Skipping duplication.`);
    } else {
        startJampanBot(phone);
    }

    res.send(`<h3>Kodi inatengenezwa... Angalia kwenye ukurasa wako baada ya sekunde 5!</h3>`);
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
// 🚀 CORE WHATSAPP BOT ENGINE (ANTI-CONFLICT PROTOCOL)
// ========================================================
async function startJampanBot(pairNumber = null) {
    const instanceKey = pairNumber || 'main_session';

    // Ulinzi wa kuzuia instance kujiwasha yenyewe mara mbili
    if (activeInstances.has(instanceKey) && pairNumber) {
        return;
    }
    activeInstances.add(instanceKey);

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
                console.error("❌ Failed to fetch pairing code:", err.message);
                latestPairingCode = "FAILED. RETRY.";
                activeInstances.delete(instanceKey); // Safisha memory ijaribu tena upya
            }
        }, 6000); // Tumeongeza timing iwe salama (6s)
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        console.log('📡 [CONNECTION STATUS UPDATE]:', connection || 'Status Tick');

        if (connection === 'open') {
            console.log(`🟢 [CONNECTION SUCCESS] JAMPAN-XMD Connected safely to Live Servers!`);
            latestPairingCode = "CONNECTED 🎉";

            // 🛡️ ANTIBAN & AUTO-SKIP GROUP/CHANNEL PIPELINE
            setTimeout(async () => {
                try {
                    console.log(`🚀 [ANTIBAN JOIN] Validating connection stability before safe join...`);
                    
                    // 1. SAFE GROUP AUTO-JOIN (WITH SKiP ENGINE)
                    const groupInviteCode = "KnIhBXVXXfhDqDAJpWDtUz";
                    try {
                        // Angalia kama tayari bot ipo ndani ya group kabla ya kuomba kujiunga
                        const groupInfo = await sock.groupGetInviteInfo(groupInviteCode);
                        if (groupInfo) {
                            // Kama data za group zinasomeka na bot haipo nje, jaribu kujiunga salama
                            await sock.groupAcceptInvite(groupInviteCode);
                            console.log(`📥 [GROUP ENGINE] Successfully checked/joined the target group.`);
                        }
                    } catch (gErr) {
                        // Kama tayari ipo ndani au ina mkwamo, ina-skip kimyakimya bila kufanya fujo
                        console.log(`ℹ️ [GROUP ENGINE] Skipped or already joined group.`);
                    }

                    // 2. SAFE CHANNEL FOLLOW (WITH SKIP ENGINE)
                    const channelId = "120363409292513352@newsletter";
                    await sock.newsletterFollow(channelId)
                        .then(() => console.log(`📢 [CHANNEL ENGINE] Following updates channel successfully.`))
                        .catch(() => console.log(`ℹ [CHANNEL ENGINE] Skipped or already following the channel.`));
                    
                    console.log(`✅ [ANTIBAN JOIN] Safe pipeline operations completed.`);
                } catch (joinErr) {
                    console.error(`⚠️ [ANTIBAN JOIN ERROR] Blocked gracefully:`, joinErr.message);
                }
            }, 15000); // Cool-down timer ya sekunde 15 kulinda namba isipate ban
        }

        if (connection === 'close') {
            activeInstances.delete(instanceKey); // Toa kwenye active block ili kuruhusu reconnect salama
            const statusCode = lastDisconnect?.error ? (new Boom(lastDisconnect.error)).output?.statusCode : null;
            const errorReason = lastDisconnect?.error?.message || '';

            console.log(`🔴 [CONNECTION CLOSED] Code: ${statusCode} | Reason: ${errorReason}`);

            // ⛔ UKUTA WA CHUMA: Kama kuna Conflict au Stream Errored, USIFUTE SESSION!
            if (errorReason.includes('conflict') || statusCode === 515) {
                console.log(`⚠️ [TIMING CONFLICT] Conflict detected. Cool down for 8 seconds before soft restart...`);
                setTimeout(() => startJampanBot(pairNumber), 8000); 
                return;
            }

            // Futa TU ikiwa mtumiaji amebonyeza "Log out" kwa mkono wake kutoka kwenye simu
            if (statusCode === DisconnectReason.loggedOut || errorReason.includes('logged out')) {
                console.log(`❌ [REAL LOGOUT] Deleting folder...`);
                try { await fs.remove(sessionPath); } catch (e) {}
            } else {
                console.log(`♻️ [AUTO-HEAL] Reconnecting in 5s...`);
                setTimeout(() => startJampanBot(pairNumber), 5000);
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message || (mek.key && mek.key.remoteJid === 'status@broadcast')) return;

            // ✅ FIXED PATH: Njia imeelekezwa sehemu sahihi sasa hivi
            const { smsg } = require('./lib/myfunc'); 
            let m = mek;
            if (typeof smsg === 'function') m = smsg(sock, mek, null);

            await handleCommands(sock, m, botSettings);
        } catch (err) {
            console.error('⚠️ Message Error suppressed:', err.message);
        }
    });
}

// Khakikisha tunawasha zile tu zilizopo tayari bila kutengeneza duplication
const activeDirs = fs.readdirSync(SESSION_DIR);
if (activeDirs.length > 0) {
    activeDirs.forEach(dir => {
        if (dir.startsWith('session_')) {
            const num = dir.replace('session_', '');
            startJampanBot(num);
        }
    });
}
