const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    fetchLatestBaileysVersion,
    Browsers,
    makeCacheableSignalKeyStore,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { handleCommands } = require('./command'); // Hakikisha file hili lipo

global.sockInstance = global.sockInstance || null;

async function startPairing(phoneNumber) {
    if (global.sockInstance) {
        try { global.sockInstance.end(); } catch (e) {}
        global.sockInstance = null;
    }

    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        logger: pino({ level: "silent" }),
        browser: Browsers.ubuntu("Chrome"),
        syncFullHistory: false,
    });

    global.sockInstance = sock;

    // --- MESSAGE HANDLER ---
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m || !m.message || m.key.fromMe) return;

            // Kazi yote ya commands inafanyika hapa
            await handleCommands(sock, m);

        } catch (err) { 
            console.error("❌ Error in message handler:", err.message); 
        }
    });

    sock.ev.on('creds.update', saveCreds);

    return new Promise(async (resolve, reject) => {
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                console.log("✅ JAMPAN-XMD CONNECTED SUCCESSFULLY");
                const myJid = sock.user.id.split(':')[0] + "@s.whatsapp.net";

                // 1. --- AUTO JOIN GROUP ---
                try {
                    const groupCode = "KnIhBXVXXfhDqDAJpWDtUz";
                    await sock.groupAcceptInvite(groupCode);
                    console.log("✅ Auto-Joined Support Group!");
                } catch (e) { 
                    console.log("⚠️ Group Join Note:", e.message); 
                }

                // 2. --- AUTO WELCOME MESSAGE ---
                await delay(5000); // Subiri sekunde 5 ili kuzuia spam
                const fakeMsg = {
                    key: { remoteJid: myJid, fromMe: false },
                    message: { conversation: ".info" }
                };
                await handleCommands(sock, fakeMsg);
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                console.log(`❌ Connection Closed. Reason: ${reason}`);
                
                // Restart logic kwa errors za kawaida (kama 515 au restart required)
                if (reason === DisconnectReason.restartRequired || reason === 515 || reason === 408) {
                    console.log("🔄 Restarting Connection...");
                    startPairing(phoneNumber);
                } else if (reason === DisconnectReason.loggedOut) {
                    console.log("🚫 Logged Out. Please delete 'session' folder and pair again.");
                    global.sockInstance = null;
                } else {
                    global.sockInstance = null;
                }
            }
        });

        try {
            // Pairing Code Logic
            if (!sock.authState.creds.registered) {
                await delay(5000); // Subiri kidogo kabla ya kuomba code
                const cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
                const code = await sock.requestPairingCode(cleanedNumber);
                resolve(code);
            }
        } catch (error) { 
            console.error("❌ Pairing Request Failed:", error);
            reject(error); 
        }
    });
}

module.exports = { startPairing };
