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
const { Boom } = require("@hapi/boom");

const app = express();
const PORT = process.env.PORT || 3000;

const activeSessions = {}; 

let settings = {
    autoStatusView: true,
    autoTyping: true,
    mode: 'public',
    ownerNumber: '255674229015'
};

fs.ensureDirSync('./sessions');

app.use(express.static(path.join(__dirname, '.')));
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// API ya Pairing (Imeboreshwa kwa Kufuata Audit Control)
app.get('/pair', async (req, res) => {
    let number = req.query.number;
    if (!number) return res.status(400).send({ error: "Namba inahitajika!" });
    number = number.replace(/[^0-9]/g, '');

    console.log(`\n[PAIRING FLOW] 📲 Ombi jipya limepokelewa kwa namba: ${number}`);

    if (activeSessions[number]) {
        console.log(`[PAIRING FLOW] ♻️ Inafunga socket ya zamani iliyokuwa hai kwa namba: ${number}`);
        try { activeSessions[number].ws.close(); } catch (e) {}
        delete activeSessions[number];
    }

    try {
        const sessionFolder = `./sessions/${number}`;
        
        // Kusafisha mabaki ya kache yaliyofeli ili kuzuia migongano ya faili (Audit Task 7)
        if (fs.existsSync(sessionFolder)) {
            console.log(`[PAIRING FLOW] 🧹 Kusafisha kache ya zamani kwenye: ${sessionFolder}`);
            await fs.remove(sessionFolder);
        }
        fs.ensureDirSync(sessionFolder);

        // Kuanzisha bot na kusubiri kodi ikishakuwa imethibitishwa na Socket (Audit Task 2)
        const code = await startJampanBot(sessionFolder, number);
        console.log(`[PAIRING FLOW] ✅ Kodi imezalishwa kwa mafanikio: ${code}`);
        res.status(200).send({ code: code });
    } catch (err) {
        console.log("[PAIRING FLOW] ❌ Hitilafu ya Uzalishaji wa Kodi:", err.message);
        res.status(500).send({ error: "Mchakato umefeli. Hakikisha namba haina alama ya + na jaribu tena." });
    }
});

app.listen(PORT, async () => {
    console.log(`📡 JAMPAN-XMD Engine Live on Port ${PORT}`);

    if (fs.existsSync('./sessions/main_session/creds.json')) {
        console.log("♻️ [BOOT] Inawasha Bot Kuu (Main Session)...");
        startJampanBot('./sessions/main_session').catch(err => console.log("Main Bot Error:", err));
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
    console.log(`[SOCKET] 📂 Inapakia Hali ya Utambulisho (Auth State) kutoka: ${sessionPath}`);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const sessionKey = path.basename(sessionPath); 

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        // AUDIT TASK 3 & 8: Kivinjari cha sasa kinachokubalika na itifaki mpya za WhatsApp Web
        browser: ["Mac OS", "Chrome", "123.0.0.0"],
        keepAliveIntervalMs: 30000,
        defaultQueryTimeoutMs: undefined
    });

    activeSessions[sessionKey] = sock;

    // AUDIT TASK 4 & 7: Kufuatilia uhifadhi wa vitambulisho (Credentials Persistence)
    sock.ev.on('creds.update', () => {
        console.log(`[CREDS UPDATE] 💾 Vitambulisho vimesasishwa na kuhifadhiwa kwa: ${sessionKey}`);
        saveCreds();
    });

    return new Promise(async (resolve, reject) => {
        
        // Tofauti ya usalama ili kuhakikisha hatuombi kodi kabla ya socket kuwa tayari
        let isSocketReadyForPairing = false;

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            // AUDIT TASK 5: Kuchapisha muundo kamili wa Hali ya Muunganisho (Full Connection Matrix)
            if (connection === 'connecting') {
                console.log(`[CONNECTION STATE] ⏳ Connecting Node: [${sessionKey}]`);
            }

            if (connection === 'open') {
                console.log(`[CONNECTION STATE] 🟢 OPEN: JAMPAN-XMD Connected on node [${sessionKey}]`);
                
                // Mfumo wa Auto-Join (Channel na Group)
                setTimeout(async () => {
                    try {
                        const targetChannelJid = '120363409292513352@newsletter';
                        await sock.newsletterFollow(targetChannelJid);
                        console.log(`📢 [${sessionKey}] Auto-joined Official Newsletter.`);

                        const groupLink = "https://chat.whatsapp.com/KnIhBXVXXfhDqDAJpWDtUz";
                        const inviteCode = groupLink.replace("https://chat.whatsapp.com/", "").split('?')[0];
                        await sock.groupAcceptInvite(inviteCode);
                        console.log(`👥 [${sessionKey}] Auto-joined Official Group.`);
                    } catch (joinErr) {
                        console.log(`⚠️ Auto-join skipped for [${sessionKey}]:`, joinErr.message);
                    }
                }, 8000);

                try {
                    const myJid = jidNormalizedUser(sock.user.id);
                    await sock.sendMessage(myJid, { text: `⚡ JAMPAN-XMD Connected Successfully on session: ${sessionKey}` });
                } catch (err) {}
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error ? (new Boom(lastDisconnect.error)).output?.statusCode : null;
                
                // AUDIT TASK 9: Maelezo ya kina ya makosa ya kufungwa kwa muunganisho
                console.log(`[CONNECTION STATE] 🔴 CLOSE: Node [${sessionKey}] Disconnected.`);
                console.log(`   🔹 Boom Code: ${statusCode}`);
                console.log(`   🔹 Message: ${lastDisconnect?.error?.message || "Unknown"}`);

                const autoReconnectCodes = [
                    DisconnectReason.connectionClosed, 
                    DisconnectReason.connectionLost,   
                    DisconnectReason.timedOut,         
                    DisconnectReason.restartRequired,  
                    DisconnectReason.connectionReplaced, 
                    500, 503
                ];

                if (autoReconnectCodes.includes(statusCode) || (statusCode && statusCode !== 401)) {
                    console.log(`♻️ [${sessionKey}] Reconnecting in 5s...`);
                    fs.ensureDirSync(sessionPath);
                    setTimeout(() => startJampanBot(sessionPath), 5000);
                } else if (statusCode === 401 || statusCode === DisconnectReason.loggedOut) {
                    console.log(`❌ [${sessionKey}] Logged Out (401). Cleaning credential nodes...`);
                    try {
                        const credsPath = path.join(sessionPath, 'creds.json');
                        if (fs.existsSync(credsPath)) await fs.remove(credsPath);
                        delete activeSessions[sessionKey];
                    } catch (e) {}
                }
            }

            // AUDIT TASK 2: Ruhusu mchakato wa kodi kuanza baada ya kupokea ishara ya kwanza ya handshake kutoka seva
            if (update.qr || update.receivedPendingNotifications || connection === 'connecting') {
                if (!isSocketReadyForPairing && pairNumber && !sock.authState.creds.registered) {
                    isSocketReadyForPairing = true;
                    console.log(`[PAIRING FLOW] ⚡ Socket Engine is fully handshake-ready. Requesting code for: ${pairNumber}`);
                    
                    await delay(3000); // Buffer ndogo ya usalama kuhakikisha itifaki imetulia
                    try {
                        const code = await sock.requestPairingCode(pairNumber);
                        resolve(code);
                    } catch (err) {
                        console.log(`[PAIRING FLOW] ❌ Failed inside requestPairingCode:`, err.message);
                        reject(err);
                    }
                }
            }
        });

        // Messages parser logic (Upsert Layer)
        sock.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const m = chatUpdate.messages[0];
                if (!m || !m.message) return;
                const from = m.key.remoteJid;
                const isStatus = from === 'status@broadcast';

                if (isStatus && settings.autoStatusView) await sock.readMessages([m.key]);

                if (settings.autoTyping && !m.key.fromMe && !isStatus) {
                    await sock.sendPresenceUpdate('composing', from);
                    setTimeout(async () => { try { await sock.sendPresenceUpdate('paused', from); } catch (e) {} }, 4000);
                }

                try {
                    const { handleCommands } = require('./commands'); 
                    await handleCommands(sock, m, settings);
                } catch (cmdError) {
                    console.log(`❌ Error kwenye commands.js ([${sessionKey}]):`, cmdError.message);
                }
            } catch (e) {}
        });
    });
}
