const { default: makeWASocket, useMultiFileAuthState, jidNormalizedUser } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// SETTINGS
let settings = {
    autoStatusView: true,
    autoTyping: true,
    mode: 'public',
    ownerNumber: '255674229015'
};

// --- 1. SULUHISHO LA FRONTEND (index.html) ---
// Hii itafanya folder lako lote lionekane (HTML, CSS, JS za frontend)
app.use(express.static(path.join(__dirname, '.')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 2. SULUHISHO LA ERROR 404 (/pair) ---
app.get('/pair', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.status(400).json({ error: "Namba inahitajika!" });

    try {
        // Tunaita pair.js hapa hapa
        const { startPairing } = require('./pair'); 
        const code = await startPairing(number.replace(/[^0-9]/g, ''));
        res.send({ code: code }); 
    } catch (err) {
        console.error("Pairing Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`📡 Server bound to port ${PORT}`);
});

// --- 3. BOT ENGINE ---
async function startJampanBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./sessions/main_session');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        browser: ["JAMPAN-XMD", "Safari", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log("✅ JAMPAN-XMD CONNECTED!");
            const myJid = jidNormalizedUser(sock.user.id);
            await sock.sendMessage(myJid, { text: "🚀 *JAMPAN-XMD IS ONLINE!*" });
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message) return;
            const from = m.key.remoteJid;

            if (from === 'status@broadcast' && settings.autoStatusView) {
                await sock.readMessages([m.key]);
            }
            if (settings.autoTyping && !m.key.fromMe) {
                await sock.sendPresenceUpdate('composing', from);
            }

            // HAPA UNGANISHA NA COMMANDS.JS
            const { handleCommands } = require('./commands');
            await handleCommands(sock, m, settings);
        } catch (err) {
            console.error(err);
        }
    });
}

startJampanBot();
