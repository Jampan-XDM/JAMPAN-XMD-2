const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, // Hii imeshatangazwa hapa, usirudie kuitangaza tena chini
    makeCacheableSignalKeyStore, 
    DisconnectReason,
    jidNormalizedUser
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const path = require("path");
const fs = require("fs-extra");

                // --- SULUHISHO LA LINE 15 ---
                // Badala ya require ya juu, tunaiweka hapa ndani ya 'try-catch'
                try {
                    const { handleCommands } = require('./commands'); 
                    await handleCommands(sock, m, settings);
                } catch (cmdError) {
                    // Kama commands.js ina error, bot haitacrash, itaandika error hapa tu
                    console.log("❌ Shida kwenye commands.js:", cmdError.message);
                }

            } catch (e) { 
                console.log("Error ya jumla:", e); 
            }
        });

const app = express();
const PORT = process.env.PORT || 3000;

let sock = null;
let isPairing = false;

let settings = {
    autoStatusView: true,
    autoTyping: true,
    mode: 'public',
    ownerNumber: '255674229015'
};

app.use(express.static(path.join(__dirname, '.')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/pair', async (req, res) => {
    let number = req.query.number;
    if (!number) return res.status(400).send({ error: "Namba inahitajika!" });
    number = number.replace(/[^0-9]/g, '');

    if (isPairing) return res.status(429).send({ error: "Tayari kuna pairing inaendelea. Subiri..." });

    console.log(`📲 Inatengeneza kodi kwa: ${number}`);
    isPairing = true;

    try {
        await fs.remove('./sessions/main_session');
        const code = await startJampanBot(number);
        res.status(200).send({ code: code });
    } catch (err) {
        isPairing = false;
        res.status(500).send({ error: "Server Busy. Jaribu tena." });
    }
});

app.listen(PORT, () => console.log(`📡 JAMPAN-XMD Engine Live on Port ${PORT}`));

async function startJampanBot(pairNumber = null) {
    const { state, saveCreds } = await useMultiFileAuthState('./sessions/main_session');

    sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        keepAliveIntervalMs: 20000,
        defaultQueryTimeoutMs: undefined
    });

    sock.ev.on('creds.update', saveCreds);

    return new Promise(async (resolve, reject) => {
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                isPairing = false;
                console.log("✅ JAMPAN-XMD IS ONLINE!");
                const myJid = jidNormalizedUser(sock.user.id);
                await sock.sendMessage(myJid, { text: "🚀 *JAMPAN-XMD CONNECTED SUCCESS*\n\nJAMPAN-XMD is online! type .menu to contine using bot.              by kelvin jampan.                             website jampan47.vercel.app" });

                try { await sock.groupAcceptInvite("KJH675jhgH76ghj"); } catch (e) {}
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                isPairing = false;

                if (reason !== DisconnectReason.loggedOut) {
                    console.log("♻️ Reconnecting...");
                    setTimeout(() => startJampanBot(), 5000);
                } else {
                    console.log("❌ Connection Logged Out. Futa session uanze upya.");
                    await fs.remove('./sessions/main_session');
                }
            }
        });

        sock.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const m = chatUpdate.messages[0];
                if (!m.message) return;
                const from = m.key.remoteJid;

                if (from === 'status@broadcast' && settings.autoStatusView) await sock.readMessages([m.key]);
                if (settings.autoTyping && !m.key.fromMe) await sock.sendPresenceUpdate('composing', from);

                // Tumesha-require handleCommands kule juu, sasa tunaiita tu
                await handleCommands(sock, m, settings);
            } catch (e) { 
                console.log("Error kwenye Upsert:", e); 
            }
        });

        if (pairNumber && !sock.authState.creds.registered) {
            // Hapa tunatumia 'delay' ile ya Baileys bila ku-redefine
            await delay(8000); 
            try {
                const code = await sock.requestPairingCode(pairNumber);
                resolve(code);
            } catch (err) {
                isPairing = false;
                reject(err);
            }
        }
    });
}

if (fs.existsSync('./sessions/main_session/creds.json')) {
    startJampanBot();
}
