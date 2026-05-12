const { default: makeWASocket, useMultiFileAuthState, jidNormalizedUser, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const path = require("path");
const fs = require("fs-extra");

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. SETTINGS ---
let settings = {
    autoStatusView: true,
    autoTyping: true,
    mode: 'public',
    ownerNumber: '255674229015'
};

// --- 2. EXPRESS SERVER & PAIRING ROUTES ---
app.use(express.static(path.join(__dirname, '.')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/pair', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.status(400).send({ error: "Namba inahitajika!" });
    try {
        const { startPairing } = require('./pair'); 
        const code = await startPairing(number);
        res.status(200).send({ code: code });
    } catch (err) {
        res.status(500).send({ error: "Jaribu tena baada ya dakika 1." });
    }
});

app.listen(PORT, () => {
    console.log(`📡 JAMPAN-XMD Engine Live on Port ${PORT}`);
});

// --- 3. BOT ENGINE (MAIN LOGIC) ---
async function startJampanBot() {
    // Tunatumia 'main_session' kwa ajili ya bot yenyewe baada ya ku-link
    const { state, saveCreds } = await useMultiFileAuthState('./sessions/main_session');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // Itatokea pia kwenye logs kama backup
        logger: pino({ level: "fatal" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log("✅ JAMPAN-XMD IS FULLY CONNECTED!");
            const myJid = jidNormalizedUser(sock.user.id);
            await sock.sendMessage(myJid, { text: "🚀 *JAMPAN-XMD IS ONLINE!*\nBot sasa imekamilika na imeunganishwa na command.js" });
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startJampanBot();
        }
    });

    // --- HAPA NDIPO TUNAPOUNGANISHA COMMAND.JS ---
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message) return;
            const from = m.key.remoteJid;

            // Features za haraka (Auto Status & Typing)
            if (from === 'status@broadcast' && settings.autoStatusView) {
                await sock.readMessages([m.key]);
            }
            if (settings.autoTyping && !m.key.fromMe) {
                await sock.sendPresenceUpdate('composing', from);
            }

            // KUITOFAUTISHA COMMAND.JS
            // Hakikisha jina la file ni 'commands.js' na function ni 'handleCommands'
            const { handleCommands } = require('./commands');
            await handleCommands(sock, m, settings);

        } catch (err) {
            console.error("❌ Error in Messages Logic:", err);
        }
    });
}

// Washa bot
startJampanBot();
