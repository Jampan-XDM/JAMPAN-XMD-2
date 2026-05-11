// command.js - Ubongo wa JAMPAN-XMD
// Created by Kelvin Jampan

// --- GLOBAL VARIABLES (Hizi zisifutwe) ---
let currentPrefix = "."; 
let uniqueUsers = new Set(); 

const replyWithStyle = async (sock, jid, text, quoted) => {
    // 1. Tuma Meseji ya Text yenye Forwarded Look
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
                body: "Kelvin Jampan",
                thumbnailUrl: "https://files.catbox.moe/fzjhed.png", 
                sourceUrl: "https://whatsapp.com/channel/120363409292513352",
                renderLargerThumbnail: false,
                mediaType: 1
            }
        }
    }, { quoted: quoted });

    // 2. Tuma Audio Automatic (Theme Song)
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
        
        // Prefix sasa inategemea ulichoset
        const prefix = currentPrefix; 

        // Hesabu watumiaji (Max 100 plan)
        if (!m.key.fromMe) {
            uniqueUsers.add(m.key.remoteJid);
        }

        if (!body.startsWith(prefix)) return;
        
        const command = body.slice(prefix.length).trim().split(' ')[0].toLowerCase();
        
        const react = async (emoji) => {
            await sock.sendMessage(remoteJid, { react: { text: emoji, key: m.key } });
        };

        switch (command) {
            case "menu":
            case "allmenu": {
                await react("📜");
                const allmenuText = `
━━━━━━━━━━━━━━━━━━━━
┃  🤖 *JAMPAN-XMD*  🚀
──────────────────── 

👑 *OWNER COMMANDS:*
━━━━━━━━━━━━━━━━━━━━
> ${prefix}setprefix <alama>
> ${prefix}mode private/public
> ${prefix}owner 
────────────────────

*🌐 GENERAL:*
────────────────────
> ${prefix}ping
> ${prefix}info
> ${prefix}status
> ${prefix}repo
────────────────────

*🎵 MEDIA & TOOLS:*
────────────────────
> ${prefix}song
> ${prefix}video
> ${prefix}tiktok
> ${prefix}apk
> ${prefix}sticker
> ${prefix}ai
────────────────────

*🫂 GROUP:*
────────────────────
> ${prefix}kick
> ${prefix}add
> ${prefix}tagall
> ${prefix}hidetag
────────────────────

👥 *Users:* ${uniqueUsers.size}/100
🚀 *Server:* Heroku Team (Live)
👑 *By Kelvin Jampan*

> Alama ya sasa ni: *${prefix}*
`;
                await replyWithStyle(sock, remoteJid, allmenuText, m);
                break;
            }

            case "setprefix": {
                await react("⚙️");
                const newPrefix = body.slice(command.length + prefix.length).trim();
                if (!newPrefix) return await replyWithStyle(sock, remoteJid, `❌ *Weka alama unayotaka!*\nMfano: ${prefix}setprefix #`, m);
                
                currentPrefix = newPrefix;
                await replyWithStyle(sock, remoteJid, `✅ *PREFIX IMEBADILISHWA!*\n\nAlama mpya: *${currentPrefix}*`, m);
                break;
            }

            case "ping": {
                await react("🚀");
                await replyWithStyle(sock, remoteJid, "🚀 *Pong! JAMPAN-XMD is online and fast.*", m);
                break;
            }

            case "owner": {
                await react("👑");
                await replyWithStyle(sock, remoteJid, `👑 *OWNER INFO*\n\nName: Kelvin Jampan\nWhatsApp: wa.me/255674229015\n\nJAMPAN-XMD Developer.`, m);
                break;
            }

            case "status": {
                await react("📊");
                const statusMsg = `📊 *SERVER STATUS*\n\n👥 Users: ${uniqueUsers.size}/100\n🔋 Mode: Public\n⚡ Speed: Super Fast\n☁️ Host: Heroku Team`;
                await replyWithStyle(sock, remoteJid, statusMsg, m);
                break;
            }

            case "info": {
                await react("🤖");
                const infoMsg = `━━━━━━━━━━━━━━━━━━━━
┃  🤖 *JAMPAN-XMD*  🚀
━━━━━━━━━━━━━━━━━━━━
║👑 ᴄʀᴇᴀᴛᴏʀ: Kelvin Jampan
║🌐 ᴠᴇʀsɪᴏɴ: 1.0.0
║📍 ᴘʀᴇғɪx: ${prefix}
║🤖 Mode: Public
║🔗 Website: https://jampanbot.vercel.app
────────────────────`;
                await replyWithStyle(sock, remoteJid, infoMsg, m);
                break;
            }

            default:
                break;
        }
    } catch (err) {
        console.error("❌ Error in command.js:", err);
    }
};

module.exports = { handleCommands };
