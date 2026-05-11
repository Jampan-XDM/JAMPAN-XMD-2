// command.js - Muhifadhi wa amri zote za JAMPAN-XMD

const replyWithStyle = async (sock, jid, text, quoted) => {
    // 1. Tuma Meseji ya Text kwanza
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
                body: "kelvin",
                thumbnailUrl: "https://files.catbox.moe/fzjhed.png", 
                sourceUrl: "https://whatsapp.com/channel/120363409292513352",
                renderLargerThumbnail: false,
                mediaType: 1
            }
        }
    }, { quoted: quoted });

    // 2. Tuma Audio Automatic kwa kila command
    await sock.sendMessage(jid, {
        audio: { url: "https://files.catbox.moe/vmc7k3.mp3" },
        mimetype: 'audio/mpeg',
        ptt: false,
        contextInfo: {
            forwardingScore: 5,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterName: "kelvin - jampan-Ai",
                newsletterJid: "120363409292513352@newsletter",
            }
        }
    }, { quoted: quoted });
};

const handleCommands = async (sock, m) => {
    try {
        const remoteJid = m.key.remoteJid;
        const body = (Object.keys(m.message)[0] === 'conversation') ? m.message.conversation : 
                     (Object.keys(m.message)[0] === 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                     (Object.keys(m.message)[0] === 'imageMessage') ? m.message.imageMessage.caption : '';
        
        const prefix = ".";
        if (!body.startsWith(prefix)) return;
        
        const command = body.slice(prefix.length).trim().split(' ')[0].toLowerCase();

        switch (command) {
            case "menu":
                const menuMsg = `╔═══〔 JAMPAN XMD 〕═══╗\n\n👑 Owner: Kelvin Jampan\n🤖 Mode: Public\n⚡ Status: Online\n📢 Official WhatsApp Bot\n\n╚════════════════════╝\n\n╭───〔 MAIN COMMANDS 〕───╮\n\n📌 .owner\n📌 .channel\n📌 .ping\n📌 .info\n📌 .sticker\n📌 .play\n\n╰────────────────────╯`;
                await replyWithStyle(sock, remoteJid, menuMsg, m);
                break;

            case "owner":
            case "creator":
                const ownerMsg = `╔═══〔 JAMPAN XMD OWNER 〕═══╗\n\n👑 Name: Kelvin Jampan\n📞 Number: wa.me/255674229015\n\n⚡ Official Owner Of JAMPAN XMD\n\n╚════════════════════╝`;
                await replyWithStyle(sock, remoteJid, ownerMsg, m);
                break;

            case "channel":
                const channelMsg = `📢 OFFICIAL JAMPAN XMD CHANNEL\n\nFollow for updates & announcements:\n\nhttps://whatsapp.com/channel/120363409292513352\n\n🔥 Stay connected with JAMPAN XMD`;
                await replyWithStyle(sock, remoteJid, channelMsg, m);
                break;

            case "ping":
                await replyWithStyle(sock, remoteJid, "🚀 *Pong! JAMPAN-XMD is super fast.*", m);
                break;

            case "info":
                const infoMsg = `
━━━━━━━━━━━━━━━━━━━━
┃  🤖 *JAMPAN-XMD*  🚀
━━━━━━━━━━━━━━━━━━━━
║👑 ᴄʀᴇᴀᴛᴏʀ: Kelvin Jampan
║🌐 ᴠᴇʀsɪᴏɴ: 1.0.0
║📍 ᴘʀᴇғɪx: .
║🤖 Mode: Public
║🔗 Website: https://jampanbot.vercel.app
────────────────────`;
                await replyWithStyle(sock, remoteJid, infoMsg, m);
                break;

            default:
                // Isijibu kitu kama amri haipo
                break;
        }
    } catch (err) {
        console.error("Error in command handler:", err);
    }
};

module.exports = { handleCommands };
