// ========================================================
// 🛡️ TASK 4 & 5: GLOBAL STARTUP PROTECTION ENGINE
// ========================================================
console.log('📡 [STARTUP] Starting JAMPAN-XMD Application Infrastructure...');

process.on('uncaughtException', (err) => {
    console.error('\n❌ 🔥 [CRITICAL CRASH - UNCAUGHT EXCEPTION]:');
    console.error('File/Stack:', err.stack || err);
    console.error('Message:', err.message);
    console.error('--------------------------------------------------\n');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\n⚠️ 🔥 [CRITICAL CRASH - UNHANDLED REJECTION]:');
    console.error('Promise:', promise);
    console.error('Reason:', reason.stack || reason);
    console.error('--------------------------------------------------\n');
});

console.log('⚙️ [STARTUP] Loading configuration files and dependencies...');

// IMPORTS ZINAZOHITAJIKA ILI KUZUIA CRASH
const { 
    proto, 
    getContentType, 
    makeCacheableSignalKeyStore, 
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom'); // ✅ Tunasakinisha Boom ili kuzuia ReferenceError
const fs = require('fs-extra'); // ✅ Tunatumia fs-extra kuzuia kosa la ensureDirSync
const path = require('path');
const axios = require('axios');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mfano wa Active Sessions (Irekebishe kulingana na muundo wako kama upo tofauti)
if (!global.activeSessions) global.activeSessions = {};

console.log('🚀 [STARTUP] Dependencies loaded successfully. Initializing client layers...');

// ========================================================
// ⚡ CORE PAIRING AND CONNECTION FUNCTION
// ========================================================
function initializeJampanSocket(sock, sessionKey, sessionPath, pairNumber) {
    return new Promise(async (resolve, reject) => {

        let isSocketReadyForPairing = false;

        console.log(`[STARTUP] 🔌 Initializing Listeners for Node: [${sessionKey}]`);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

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
                // ✅ Tumelinda eneo hili kwa kutumia Boom kwa usahihi wa 100%
                const statusCode = lastDisconnect?.error ? (new Boom(lastDisconnect.error)).output?.statusCode : null;

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
                    // Hapa kagua kama jina la function yako ya mwanzo ni startJampanBot au kulingana na kodi yako
                    if (typeof startJampanBot === 'function') {
                        setTimeout(() => startJampanBot(sessionPath), 5000);
                    }
                } else if (statusCode === 401 || statusCode === DisconnectReason.loggedOut) {
                    console.log(`❌ [${sessionKey}] Logged Out (401). Cleaning credential nodes...`);
                    try {
                        const credsPath = path.join(sessionPath, 'creds.json');
                        if (fs.existsSync(credsPath)) {
                            await fs.remove(credsPath);
                        }
                        delete global.activeSessions[sessionKey];
                    } catch (e) {}
                }
            }

            // CRITICAL PRODUCTION FIX: Omba kodi pale TU ambapo kila kitu kiko thabiti
            if ((qr || update.receivedPendingNotifications) && !sock.authState.creds.registered) {
                if (!isSocketReadyForPairing && pairNumber) {
                    isSocketReadyForPairing = true;
                    console.log(`[PAIRING FLOW] ⚡ Socket Engine verified via Handshake. Requesting active code for: ${pairNumber}`);

                    await delay(3500); // Buffer thabiti ya kuruhusu funguo za siri zijipange vizuri (Pre-keys allocation)
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
    });
}
