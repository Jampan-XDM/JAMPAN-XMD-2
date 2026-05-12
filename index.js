const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    jidNormalizedUser 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs-extra");
const express = require("express");
const path = require("path");

// --- 1. SETTINGS & OWNER CONFIG ---
let settings = {
    autoStatusView: true,
    autoTyping: true,
    mode: 'public', // 'public' au 'private'
    ownerNumber: '255674229015' // Namba yako Kelvin
};

// --- 2. EXPRESS SERVER (Kuzuia Heroku Crash) ---
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => { res.send("🚀 JAMPAN-XMD IS ONLINE & STABLE"); });
app.listen(PORT, () => { console.log(`📡 Server bound to port ${PORT}`); });

// --- 3. EMERGENCY CRASH HANDLERS ---
process.on("uncaughtException", (err) => console.error("❌ Critical Error:", err.message));
process.on("unhandledRejection", (reason) => console.error("❌ Promise Rejected:", reason));

async function startJampanBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./sessions/main_session');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "fatal" }),
        browser: ["JAMPAN-XMD", "Safari", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    // --- CONNECTION UPDATE ---
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log("✅ JAMPAN-XMD CONNECTED SUCCESSFULLY!");
            
            const myJid = jidNormalizedUser(sock.user.id);
            const welcomeMsg = `🚀 *JAMPAN-XMD CONNECTED!*\n\n` +
                               `👤 *Owner:* Kelvin Jampan\n` +
                               `🛠️ *Mode:* ${settings.mode.toUpperCase()}\n` +
                               `👁️ *Auto Status:* ${settings.autoStatusView ? 'ON' : 'OFF'}\n` +
                               `⌨️ *Auto Typing:* ${settings.autoTyping ? 'ON' : 'OFF'}\n\n` +
                               `_Powered by JAMPAN-Ai_`;

            await sock.sendMessage(myJid, { text: welcomeMsg });

            // Auto Join Group (Optional)
            try {
                await sock.groupAcceptInvite("KJH675jhgH76ghj"); 
            } catch (e) { /* console.log("Group link error"); */ }
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startJampanBot();
        }
    });

    // --- MESSAGE UPSERT (The Core) ---
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message) return;
            const from = m.key.remoteJid;
            const pushName = m.pushName || "User";

            // --- A. AUTO FEATURES ---
            // 1. Auto Status View
            if (from === 'status@broadcast' && settings.autoStatusView) {
                await sock.readMessages([m.key]);
            }

            // 2. Auto Typing
            if (settings.autoTyping && !m.key.fromMe) {
                await sock.sendPresenceUpdate('composing', from);
            }

            // --- B. EXTERNAL COMMAND HANDLER (Unganisha na command.js) ---
            const { handleCommands } = require('./commands'); 
            await handleCommands(sock, m, settings);

        } catch (err) {
            console.error("❌ Error in index processing:", err);
        }
    });
}

startJampanBot();
