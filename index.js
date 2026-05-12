const { default: makeWASocket, useMultiFileAuthState, jidNormalizedUser, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const path = require("path");
const fs = require("fs-extra");

const app = express();
const PORT = process.env.PORT || 3000;

// --- DEFAULT SETTINGS (Kelvin's Config) ---
let settings = {
    autoStatusView: true,
    autoTyping: true,
    mode: 'public',
    ownerNumber: '255674229015'
};

// --- EXPRESS SETUP ---
app.use(express.static(path.join(__dirname, '.')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/pair', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.status(400).send({ error: "Namba inahitajika!" });
    try {
        const { startPairing } = require('./pair'); 
        const code = await startPairing(number);
        res.status(200).send({ code: code });
    } catch (err) {
        res.status(500).send({ error: "Jaribu tena baada ya sekunde 30." });
    }
});

app.listen(PORT, () => console.log(`📡 JAMPAN-XMD Engine Live on Port ${PORT}`));

// --- BOT ENGINE ---
async function startJampanBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./sessions/main_session');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "fatal" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'open') {
            console.log("✅ BOT IPO ONLINE!");
            const myJid = jidNormalizedUser(sock.user.id);

            // 1. WELCOME MESSAGE (English/Swahili Mix)
            const welcomeMsg = `🚀 *JAMPAN-XMD CONNECTED SUCCESSFULLY*\n\n` +
                               `👤 *Owner:* Kelvin Jampan\n` +
                               `🛠️ *Mode:* ${settings.mode.toUpperCase()}\n` +
                               `👁️ *Auto Status:* ${settings.autoStatusView ? 'ON' : 'OFF'}\n` +
                               `⌨️ *Auto Typing:* ${settings.autoTyping ? 'ON' : 'OFF'}\n\n` +
                               `_Enjoy using Jampan Bot system!_`;
            
            await sock.sendMessage(myJid, { text: welcomeMsg });

            // 2. AUTO JOIN GROUP
            try {
                await sock.groupAcceptInvite("KJH675jhgH76ghj"); 
            } catch (e) { console.log("Auto join failed"); }
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log("♻️ Reconnecting JAMPAN-XMD...");
                startJampanBot();
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message) return;
            const from = m.key.remoteJid;
            const isOwner = from.includes(settings.ownerNumber) || m.key.fromMe;

            // --- DEFAULTS LOGIC ---
            if (from === 'status@broadcast' && settings.autoStatusView) {
                await sock.readMessages([m.key]);
            }
            if (settings.autoTyping && !m.key.fromMe) {
                await sock.sendPresenceUpdate('composing', from);
            }
            if (settings.mode === 'private' && !isOwner) return;

            // --- COMMAND HANDLER ---
            const { handleCommands } = require('./commands');
            await handleCommands(sock, m, settings);

        } catch (err) {
            console.error(err);
        }
    });
}

// Jaribu kuwasha bot kama kuna session
if (fs.existsSync('./sessions/main_session/creds.json')) {
    startJampanBot();
}
