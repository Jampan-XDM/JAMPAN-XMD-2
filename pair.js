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

    // --- WELCOME MESSAGE & COMMAND HANDLER ---
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message || mek.key.fromMe) return;

            const mType = Object.keys(mek.message)[0];
            const body = (mType === 'conversation') ? mek.message.conversation : 
                         (mType === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : '';

            if (body.toLowerCase().startsWith('.') || body.toLowerCase().includes('hello')) {
                const welcomeText = `*🌟 JAMPAN-XMD IS ACTIVE! 🌟*\n\nHabari! Mimi ni *JAMPAN-XMD*, msaidizi wako. Bot imeunganishwa kikamilifu.\n\n*Matumizi:*\nTumia amri hii kuona huduma zangu:\n📌 Type: *.menu*\n\n_By Kelvin Jampan_`;
                await sock.sendMessage(mek.key.remoteJid, { text: welcomeText }, { quoted: mek });
            }
        } catch (err) { console.error("Error in Msg Handler:", err); }
    });

    sock.ev.on('creds.update', saveCreds);

    return new Promise(async (resolve, reject) => {
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'open') {
                console.log("✅ CONNECTED!");
                const myJid = sock.user.id.split(':')[0] + "@s.whatsapp.net";
                await delay(3000);
                await sock.sendMessage(myJid, { text: "✅ *CONNECTION SUCCESSFUL!*\n\nJAMPAN-XMD sasa iko online.\n\nJaribu kutuma *.menu* kuanza." });
            }
            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === 515 || reason === DisconnectReason.restartRequired) {
                    startPairing(phoneNumber);
                } else { global.sockInstance = null; }
            }
        });

        try {
            await delay(10000); 
            let cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
            if (!sock.authState.creds.registered) {
                const code = await sock.requestPairingCode(cleanedNumber);
                resolve(code);
            }
        } catch (error) { reject(error); }
    });
}

module.exports = { startPairing };
