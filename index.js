const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    jidNormalizedUser 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs-extra");

// --- SETTINGS DEFAULT ---
let settings = {
    autoStatusView: true,
    autoTyping: true,
    mode: 'public', // 'public' au 'private'
    ownerNumber: '255674229015' // Namba yako Kelvin
};

async function startJampanBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./sessions/main_session');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "fatal" }),
        browser: ["JAMPAN-XMD", "Safari", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log("✅ JAMPAN-XMD CONNECTED!");
            
            const myJid = jidNormalizedUser(sock.user.id);
            const welcomeMsg = `🚀 *JAMPAN-XMD IMEUNGANISHWA!*\n\n` +
                               `👤 *Owner:* Kelvin Jampan\n` +
                               `🛠️ *Mode:* ${settings.mode}\n` +
                               `👁️ *Auto Status:* ${settings.autoStatusView ? 'ON' : 'OFF'}\n` +
                               `⌨️ *Auto Typing:* ${settings.autoTyping ? 'ON' : 'OFF'}\n\n` +
                               `*Bot ipo tayari kutumika!*`;

            await sock.sendMessage(myJid, { text: welcomeMsg });

            // AUTO JOIN GROUP (Ingiza link ya group lako hapa)
            try {
                await sock.groupAcceptInvite("KJH675jhgH76ghj"); // Weka code ya group hapa
            } catch (e) {
                console.log("Auto join failed: Group link invalid or full.");
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message) return;
            const from = m.key.remoteJid;
            const pushName = m.pushName || "Mtumiaji";
            const isOwner = from.includes(settings.ownerNumber) || m.key.fromMe;
            
            const messageType = Object.keys(m.message)[0];
            const body = (messageType === 'conversation') ? m.message.conversation : 
                         (messageType === 'extendedTextMessage') ? m.message.extendedTextMessage.text : '';

            const prefix = '.';
            const isCmd = body.startsWith(prefix);
            const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';

            // --- 1. AUTO STATUS VIEW ---
            if (from === 'status@broadcast' && settings.autoStatusView) {
                await sock.readMessages([m.key]);
                console.log(`👁️ Imeona Status ya: ${pushName}`);
            }

            // --- 2. AUTO TYPING ---
            if (settings.autoTyping && !m.key.fromMe) {
                await sock.sendPresenceUpdate('composing', from);
            }

            // --- 3. PUBLIC/PRIVATE MODE CONTROL ---
            if (settings.mode === 'private' && !isOwner && isCmd) return;

            // --- COMMANDS ---
            switch (command) {
                case 'autostatus':
                    if (!isOwner) return;
                    const statusOpt = body.split(' ')[1];
                    settings.autoStatusView = (statusOpt === 'on');
                    await sock.sendMessage(from, { text: `✅ Auto Status View sasa ipo: ${settings.autoStatusView ? 'ON' : 'OFF'}` });
                    break;

                case 'autotyping':
                    if (!isOwner) return;
                    const typeOpt = body.split(' ')[1];
                    settings.autoTyping = (typeOpt === 'on');
                    await sock.sendMessage(from, { text: `✅ Auto Typing sasa ipo: ${settings.autoTyping ? 'ON' : 'OFF'}` });
                    break;

                case 'mode':
                    if (!isOwner) return;
                    const modeOpt = body.split(' ')[1];
                    if (modeOpt === 'public' || modeOpt === 'private') {
                        settings.mode = modeOpt;
                        await sock.sendMessage(from, { text: `✅ Bot Mode imebadilishwa kuwa: ${settings.mode.toUpperCase()}` });
                    }
                    break;

                case 'hi':
                case 'hello':
                    await sock.sendMessage(from, { text: `Habari *${pushName}*! Mimi ni JAMPAN-XMD, namba yako ni ${from.split('@')[0]}. Owner wangu ni Kelvin Jampan.` });
                    break;
            }

        } catch (err) {
            console.log(err);
        }
    });
}

startJampanBot();
// ... (Kodi zako za juu za connection zibaki vile vile)

sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        const m = chatUpdate.messages[0];
        if (!m.message) return;

        // TUNALIPAKUA FILE LA COMMANDS HAPA
        const plugin = require('./commands'); 
        
        // Tunazituma data zote muhimu kwenda kwenye commands.js
        await plugin.handleCommand(sock, m, settings);

    } catch (err) {
        // Kama kuna error kwenye commands.js, isizime bot nzima
        console.error("Error in commands.js:", err);
    }
});
