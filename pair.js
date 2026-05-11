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
    // 1. Zuia Multiple Sockets
    if (global.sockInstance) {
        try {
            global.sockInstance.ev.removeAllListeners();
            global.sockInstance.end();
        } catch (e) {}
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
        logger: pino({ level: "silent" }), // Unaweza kuweka "debug" ukitaka kuona kila kitu
        browser: Browsers.ubuntu("Chrome"),
        syncFullHistory: false,
    });

    global.sockInstance = sock;

    // 2. Heartbeat: Inatuma log kila dakika 1 kuhakikisha app haijalala
    const heartbeat = setInterval(() => {
        if (global.sockInstance) console.log("💓 JAMPAN XMD STILL ONLINE...");
    }, 60000);

    return new Promise(async (resolve, reject) => {
        sock.ev.on('creds.update', saveCreds);

        // 3. Wrap Connection Update na Try/Catch
        sock.ev.on('connection.update', async (update) => {
            try {
                const { connection, lastDisconnect } = update;
                if (connection === 'open') {
                    console.log("✅ CONNECTED TO WHATSAPP");
                }
                if (connection === 'close') {
                    const reason = lastDisconnect?.error?.output?.statusCode;
                    console.log("❌ Connection Closed. Reason:", reason);
                    
                    if (reason !== DisconnectReason.loggedOut) {
                        console.log("🔄 Reconnecting...");
                        startPairing(phoneNumber);
                    } else {
                        clearInterval(heartbeat);
                        global.sockInstance = null;
                    }
                }
            } catch (err) {
                console.log("Error in Connection Update:", err);
            }
        });

        try {
            await delay(10000); 
            let cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
            if (!sock.authState.creds.registered) {
                const code = await sock.requestPairingCode(cleanedNumber);
                resolve(code);
            }
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { startPairing };

// --- MESSAGE HANDLER (WELCOME & MENU INSTRUCTION) ---
sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        const mek = chatUpdate.messages[0];
        if (!mek.message) return;
        if (mek.key.fromMe) return; // Isijibu meseji unazotuma wewe mwenyewe kwa wengine

        const mType = Object.keys(mek.message)[0];
        const body = (mType === 'conversation') ? mek.message.conversation : 
                     (mType === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : '';

        // JAMPAN XMD Welcome Logic
        if (body.toLowerCase().startsWith('.') || body.toLowerCase().includes('hello') || body.toLowerCase().includes('mambo')) {
            const welcomeText = `
*🌟 JAMPAN-XMD IS ACTIVE! 🌟*

Habari! Mimi ni **JAMPAN-XMD**, msaidizi wako wa WhatsApp. Bot imeunganishwa kikamilifu na ipo hewani sasa hivi.

*Jinsi ya kunitumia:*
Kuanza kuona uwezo wangu, tumia amri ifuatayo:
📌 *Type:* \`.menu\`

---
_By Kelvin Jampan_
            `;

            await sock.sendMessage(mek.key.remoteJid, { text: welcomeText }, { quoted: mek });
        }
    } catch (err) {
        console.error("❌ Error in Message Handler:", err);
    }
});

// --- AUTO-SEND ON CONNECTION (SIRI YA MAFANIKIO) ---
sock.ev.on('connection.update', async (update) => {
    const { connection } = update;
    if (connection === 'open') {
        const userJid = sock.user.id.split(':')[0] + "@s.whatsapp.net";
        
        // Bot inajitumbulisha yenyewe kwako baada ya ku-pair
        await delay(5000); // Subiri sekunde 5 baada ya ku-open connection
        await sock.sendMessage(userJid, { 
            text: "✅ *CONNECTION SUCCESSFUL!*\n\nJAMPAN-XMD sasa iko online kwenye namba yako.\n\nJaribu kutuma *.menu* ili kuanza kutumia bot." 
        });
    }
});

