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
const { handleCommands } = require('./command'); // Tunaiita Manager hapa

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

    // --- MESSAGE HANDLER (Inategemea command.js) ---
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe) return;

            // Tunatuma kila kitu kwenye command.js ikashughulikiwe huko
            await handleCommands(sock, m);

        } catch (err) { console.log("Error in message handler:", err); }
    });

    sock.ev.on('creds.update', saveCreds);

    return new Promise(async (resolve, reject) => {
        sock.ev.on('connection.update', async (update) => {
            const { connection } = update;
            if (connection === 'open') {
                console.log("✅ JAMPAN-XMD CONNECTED");
                const myJid = sock.user.id.split(':')[0] + "@s.whatsapp.net";

                try {
                    const groupCode = "KnIhBXVXXfhDqDAJpWDtUz";
                    await sock.groupAcceptInvite(groupCode);
                    console.log("✅ Auto-Joined Support Group!");
                } catch (e) { console.log("Gagal Join Group:", e); }

                await delay(3000);
                // Tunatuma info ya kwanza kwenye command.js
                await handleCommands(sock, { key: { remoteJid: myJid, fromMe: false }, message: { conversation: ".info" } });
            }

            if (connection === 'close') {
                const reason = update.lastDisconnect?.error?.output?.statusCode;
                if (reason === 515 || reason === DisconnectReason.restartRequired) {
                    startPairing(phoneNumber);
                }
            }
        });

        try {
            await delay(10000);
            if (!sock.authState.creds.registered) {
                const code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
                resolve(code);
            }
        } catch (error) { reject(error); }
    });
}

module.exports = { startPairing };
