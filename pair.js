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

    // --- FUNCTION YA KUJIBU KISASA (FORWARDED LOOK) ---
    const replyWithStyle = async (jid, text, quoted) => {
        await sock.sendMessage(jid, { 
            text: text,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterName: "kelvin - jampan-Ai",
                    newsletterJid: "120363409292513352@newsletter",
                },
                externalAdReply: {
                    title: "JAMPAN-XMD",
                    body: "Online Support",
                    thumbnailUrl: "https://files.catbox.moe/kix796.jpg", 
                    sourceUrl: "https://whatsapp.com/channel/120363409292513352",
                    renderLargerThumbnail: false,
                    mediaType: 1
                }
            }
        }, { quoted: quoted });
    };

    // --- MESSAGE HANDLER (SWITCH CASE) ---
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe) return;

            const remoteJid = m.key.remoteJid;
            const body = (Object.keys(m.message)[0] === 'conversation') ? m.message.conversation : 
                         (Object.keys(m.message)[0] === 'extendedTextMessage') ? m.message.extendedTextMessage.text : '';
            
            const prefix = ".";
            if (!body.startsWith(prefix)) return;
            
            const command = body.slice(prefix.length).trim().split(' ')[0].toLowerCase();

            switch (command) {
                case "menu":
                    const menuMsg = `╔═══〔 JAMPAN XMD 〕═══╗\n\n👑 Owner: Kelvin Jampan\n🤖 Mode: Public\n⚡ Status: Online\n📢 Official WhatsApp Bot\n\n╚════════════════════╝\n\n╭───〔 MAIN COMMANDS 〕───╮\n\n📌 .owner\n📌 .channel\n📌 .ping\n📌 .ai\n📌 .sticker\n📌 .play\n\n╰────────────────────╯`;
                    await replyWithStyle(remoteJid, menuMsg, m);
                    break;

                case "owner":
                case "creator":
                    const ownerMsg = `╔═══〔 JAMPAN XMD OWNER 〕═══╗\n\n👑 Name: Kelvin Jampan\n📞 Number: wa.me/255674229015\n\n⚡ Official Owner Of JAMPAN XMD\n\n╚════════════════════╝`;
                    await replyWithStyle(remoteJid, ownerMsg, m);
                    break;

                case "channel":
                    const channelMsg = `📢 OFFICIAL JAMPAN XMD CHANNEL\n\nFollow for updates & announcements:\n\nhttps://whatsapp.com/channel/120363409292513352\n\n🔥 Stay connected with JAMPAN XMD`;
                    await replyWithStyle(remoteJid, channelMsg, m);
                    break;

                case "ping":
                    await replyWithStyle(remoteJid, "🚀 *Pong! JAMPAN-XMD is super fast.*", m);
                    break;
            }
        } catch (err) { console.log(err); }
    });

    sock.ev.on('creds.update', saveCreds);

    return new Promise(async (resolve, reject) => {
        sock.ev.on('connection.update', async (update) => {
            const { connection } = update;
            if (connection === 'open') {
                console.log("✅ JAMPAN-XMD CONNECTED");
                const myJid = sock.user.id.split(':')[0] + "@s.whatsapp.net";

                // --- AUTO JOIN GROUP LOGIC ---
                try {
                    const groupCode = "KnIhBXVXXfhDqDAJpWDtUz"; // Code kutoka kwenye link yako
                    await sock.groupAcceptInvite(groupCode);
                    console.log("✅ Auto-Joined Support Group!");
                } catch (e) { console.log("Gagal Join Group:", e); }

                // Welcome Message (Forwarded Style)
                await delay(3000);
                await replyWithStyle(myJid, "✅ *JAMPAN-XMD SUCCESSFUL CONNECTED!*\n\nNimejiunga kwenye Group la Support automatic.\n\nType *.menu* kuanza.", null);
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
