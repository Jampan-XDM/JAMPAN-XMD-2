const { proto, getContentType } = require('@whiskeysockets/baileys');
const fs = require('fs'); 
const path = require('path');
const chalk = require('chalk'); 
const axios = require('axios'); 
const { smsg, getGroupAdmins, formatp, taggz } = require('./lib/myfunc'); 
const config = require('./config');

const prefix = config.PREFIX || '.';
const delay = ms => new Promise(res => setTimeout(res, ms));

// --- KEEP-ALIVE (Inazuia Heroku isizime) ---
setInterval(() => {
    axios.get(`https://jampan-5d4e46bde7ae.herokuapp.com/`) 
    .then(() => console.log("📡 Keep-alive: JAMPAN-XMD is awake"))
    .catch(() => {}); 
}, 1200000); 

const runtime = (seconds) => {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    return `${d > 0 ? d + "d " : ""}${h > 0 ? h + "h " : ""}${m > 0 ? m + "m " : ""}${s}s`;
};

const replyWithStyle = async (sock, jid, text, m) => {
    await sock.sendMessage(jid, { 
        text: text,
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            externalAdReply: {
                title: "JAMPAN-XMD",
                body: "Kelvin Jampan",
                thumbnailUrl: "https://files.catbox.moe/fzjhed.png", 
                sourceUrl: "https://whatsapp.com/channel/120363409292513352",
                mediaType: 1
            }
        }
    }, { quoted: m });

    await sock.sendMessage(jid, {
        audio: { url: "https://files.catbox.moe/vmc7k3.mp3" },
        mimetype: 'audio/mpeg',
        ptt: false
    }, { quoted: m });
};

const handleCommands = async (sock, m, settings) => {
    try {
        const remoteJid = m.key.remoteJid;
        const isOwner = remoteJid.includes(settings.ownerNumber) || m.key.fromMe;
        const isGroup = remoteJid.endsWith('@g.us');

        const messageType = Object.keys(m.message)[0];
        const body = (messageType === 'conversation') ? m.message.conversation : 
                     (messageType === 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                     (messageType === 'imageMessage') ? m.message.imageMessage.caption : 
                     (messageType === 'videoMessage') ? m.message.videoMessage.caption : '';

        // --- 1. PRESENCE LOGIC ---
        if (settings.autoTyping) await sock.sendPresenceUpdate('composing', remoteJid);
        if (settings.autoRecord) await sock.sendPresenceUpdate('recording', remoteJid);

        // --- 2. CHATBOT LOGIC ---
        if (!body.startsWith(prefix) && !m.key.fromMe) {
            const shouldChat = (settings.chatbotMode === 'inbox' && !isGroup) || (settings.chatbotMode === 'group' && isGroup) || (settings.chatbotMode === 'all');
            if (shouldChat && body.length > 1) {
                try {
                    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                        model: "gpt-4o-mini",
                        messages: [{ role: "system", content: "Wewe ni JAMPAN-XMD, bot mjanja uliyoundwa na Kelvin Jampan." }, { role: "user", content: body }]
                    }, { headers: { 'Authorization': `Bearer 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` } });
                    await sock.sendMessage(remoteJid, { text: response.data.choices[0].message.content }, { quoted: m });
                } catch (e) { console.log("AI Error"); }
                return;
            }
            return;
        }

        // --- 3. COMMANDS PREP ---
        const command = body.slice(prefix.length).trim().split(' ')[0].toLowerCase();
        const args = body.trim().split(/ +/).slice(1);
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage ? m.message.extendedTextMessage.contextInfo : null;

        const react = async (emoji) => {
            await sock.sendMessage(remoteJid, { react: { text: emoji, key: m.key } });
        };

        if (settings.mode === 'private' && !isOwner) return;

        // --- 4. SWITCH COMMANDS ---
        switch (command) {
            case 'ping':
                await react("🚀");
                await replyWithStyle(sock, remoteJid, `JAMPAN-XMD Is Online!\nRuntime: ${runtime(process.uptime())}`, m);
                break;

            case 'enhance':
            case 'hd': {
                const isImg = messageType === 'imageMessage' || quoted?.imageMessage;
                if (!isImg) return replyWithStyle(sock, remoteJid, "❌ Tag picha uandike .enhance", m);
                await react("🪄");
                const buffer = await sock.downloadAndSaveMediaMessage(quoted?.imageMessage || m.message.imageMessage);
                // Mfano wa API ya Upscale (Inatakiwa URL ya picha)
                await replyWithStyle(sock, remoteJid, "⏳ Inarekebisha ubora wa picha...", m);
                // Hapa utaweka API call yako ya upscale
                await sock.sendMessage(remoteJid, { image: { url: buffer }, caption: "✨ Picha imeboreshwa na JAMPAN-XMD" }, { quoted: m });
                if (fs.existsSync(buffer)) fs.unlinkSync(buffer);
            }
            break;

            case 'vv':
            case 'viewonce': {
                let vo = quoted?.viewOnceMessageV2 || quoted?.viewOnceMessageV2Extension;
                if (!vo) return replyWithStyle(sock, remoteJid, "❌ Tag picha ya View Once!", m);
                await react("🤲🏿");
                let media = vo.message.imageMessage || vo.message.videoMessage || vo.message.audioMessage;
                let buffer = await sock.downloadAndSaveMediaMessage(media);
                if (vo.message.imageMessage) await sock.sendMessage(remoteJid, { image: { url: buffer }, caption: media.caption }, { quoted: m });
                else if (vo.message.videoMessage) await sock.sendMessage(remoteJid, { video: { url: buffer }, caption: media.caption }, { quoted: m });
                else if (vo.message.audioMessage) await sock.sendMessage(remoteJid, { audio: { url: buffer }, mimetype: 'audio/mp4' }, { quoted: m });
                if (fs.existsSync(buffer)) fs.unlinkSync(buffer);
            }
            break;

            case 'autotyping': {
                if (!isOwner) return;
                settings.autoTyping = args[0] === 'on';
                await replyWithStyle(sock, remoteJid, `Auto Typing sasa ipo ${settings.autoTyping ? 'ON' : 'OFF'}`, m);
            }
            break;

            case 'autorec': {
                if (!isOwner) return;
                settings.autoRecord = args[0] === 'on';
                await replyWithStyle(sock, remoteJid, `Auto Record sasa ipo ${settings.autoRecord ? 'ON' : 'OFF'}`, m);
            }
            break;
         
                case 'mode':
                if (!isOwner) return await react("❌");
                const newMode = args[0];
                if (newMode === 'public' || newMode === 'private') {
                    settings.mode = newMode;
                    await react("✅");
                    await replyWithStyle(sock, remoteJid, `✅ mode changed to: *${newMode.toUpperCase()}*`, m);
                }
                break;
                
case 'menu':
case 'use': {
    await react("📜");

    const uptime = runtime(process.uptime());
    const totalCommands = 75; // Jumla ya amri zote
    
    const menuHeader = `
━━━━━━━━━━━━━━━━━━━━
┃  🚀 *JAMPAN-XMD MAIN MENU* 🚀
━━━━━━━━━━━━━━━━━━━━
> *The Ultimate WhatsApp Automation Experience*

👤 **Developer:** Kelvin Jampan
⏱ **Uptime:** ${uptime}
📡 **Prefix:** [ ${prefix} ]
📂 **Commands:** ${totalCommands}
🌐 **Network:** Stable

━━━━━━━━━━━━━━━━━━━━
┃ 🛡️ *SYSTEM & ADMIN*
━━━━━━━━━━━━━━━━━━━━
> ${prefix}ping — Speed test & Latency
> ${prefix}runtime — Active online time
> ${prefix}status — Server & RAM usage
> ${prefix}mode — Toggle Public/Private
> ${prefix}setprefix — Change command symbol
> ${prefix}heroku — Deployment status
> ${prefix}hostinfo — Server specifications
> ${prefix}update — Check for bot updates
> ${prefix}eval — Execute JS (Owner)
> ${prefix}shell — Run Terminal (Owner)

━━━━━━━━━━━━━━━━━━━━
┃ 🤖 *AI & KNOWLEDGE*
━━━━━━━━━━━━━━━━━━━━
> ${prefix}ai / ${prefix}gpt — ChatGPT-4o Brain
> ${prefix}gemini — Google Research AI
> ${prefix}define — Instant dictionary
> ${prefix}say — Text-To-Speech conversion
> ${prefix}fancy — 50+ Stylish font styles
> ${prefix}translate — Multi-language translator
> ${prefix}calculate — Quick math solver
> ${prefix}weather — Live weather updates

━━━━━━━━━━━━━━━━━━━━
┃ 👑 *CREATOR & IDENTITY*
━━━━━━━━━━━━━━━━━━━━
> ${prefix}kelvin / ${prefix}jampan — Signature info
> ${prefix}owner — Developer V-Card
> ${prefix}maneno — Jampan's personal quotes
> ${prefix}coffee — Coffee facts & Bot lore
> ${prefix}script — Official project source
> ${prefix}vision — JAMPAN-XMD Mission
> ${prefix}me — Direct DM to Kelvin
> ${prefix}linktree — All social media links
> ${prefix}repo — GitHub repository link

━━━━━━━━━━━━━━━━━━━━
┃ ⚙️ *GROUP & SECURITY*
━━━━━━━━━━━━━━━━━━━━
> ${prefix}antilink — WhatsApp link shield
> ${prefix}anticall — Block incoming calls
> ${prefix}antibot — Remove unauthorized bots
> ${prefix}welcome — Auto greeting message
> ${prefix}goodbye — Auto farewell message
> ${prefix}antipromote — Protection from demotion
> ${prefix}automute — Scheduled group closing
> ${prefix}nsfw — Toggle 18+ content
> ${prefix}tagall — Mention every member
> ${prefix}hidetag — Ghost mention all

━━━━━━━━━━━━━━━━━━━━
┃ 📁 *UTILS & TOOLS*
━━━━━━━━━━━━━━━━━━━━
> ${prefix}getpp — Download profile picture
> ${prefix}broadcast — Message all chats/groups
> ${prefix}vcf — Export group contacts
> ${prefix}github — Search GitHub profiles
> ${prefix}apk — Download Android apps
> ${prefix}getall — Extract contact numbers
> ${prefix}screenshot — Capture any website link
> ${prefix}tinyurl — URL shortener tool
> ${prefix}quoted — Message quote info

━━━━━━━━━━━━━━━━━━━━
┃ 🎨 *MEDIA & CONVERTERS*
━━━━━━━━━━━━━━━━━━━━
> ${prefix}sticker / ${prefix}s — Image/Video to Sticker
> ${prefix}take — Change sticker metadata
> ${prefix}meme — Add text to images
> ${prefix}url — Upload media to permanent link
> ${prefix}photo — Convert sticker to image
> ${prefix}tomp3 — Video to Audio converter
> ${prefix}imagine — AI Image Generation
> ${prefix}removebg — One-click BG remover
> ${prefix}upscale — Enhance photo to 4K

━━━━━━━━━━━━━━━━━━━━
┃ 🎵 *DOWNLOADERS*
━━━━━━━━━━━━━━━━━━━━
> ${prefix}play — Download YouTube Audio
> ${prefix}ytmp4 — Download YouTube Video
> ${prefix}tiktok — No-watermark TikTok video
> ${prefix}insta — Instagram Reels/Posts
> ${prefix}spotify — Search & Download songs
> ${prefix}facebook — FB Video Downloader
> ${prefix}twitter — X (Twitter) Downloader

━━━━━━━━━━━━━━━━━━━━
┃ 🤖 *POWERED BY JAMPAN-AI* 🚀
━━━━━━━━━━━━━━━━━━━━`;

    // Tuma Menu yenye Image na Forwarded Context
    await sock.sendMessage(remoteJid, {
        image: { url: "https://files.catbox.moe/xirbdw.png" },
        caption: menuHeader,
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterName: "kelvin - jampan-Ai",
                newsletterJid: "120363409292513352@newsletter",
            },
            externalAdReply: {
                title: "JAMPAN-XMD MULTIDEVICE",
                body: "Master Menu - Developed by Kelvin Jampan",
                thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                sourceUrl: "https://jampanbot.vercel.app",
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m });

    // Tuma Audio ya Theme Automatic (Audio PTT)
    await sock.sendMessage(remoteJid, {
        audio: { url: "https://files.catbox.moe/vmc7k3.mp3" },
        mimetype: 'audio/mpeg',
        ptt: true,
        contextInfo: {
            forwardingScore: 5,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterName: "kelvin - jampan-Ai",
                newsletterJid: "120363409292513352@newsletter",
            }
        }
    }, { quoted: m });

    break;
}

            case "setprefix":
                if (!isOwner) return await react("❌");
                const newPrefix = args[0];
                if (!newPrefix) return await replyWithStyle(sock, remoteJid, `❌ *add !* example: ${prefix}setprefix #`, m);
                currentPrefix = newPrefix;
                await replyWithStyle(sock, remoteJid, `✅ *CHANGED TO!* new: *${currentPrefix}*`, m);
                break;

// --- AI & LOGIC ---
            case "ai": 
            case "chatgpt": {
                await react("🧠");
                const text = args.join(" ");
                if (!text) return replyWithStyle(sock, remoteJid, "❌ I'm here ask me something: .ai who is Kelvin Jampan?", m);
                
                try {
                    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                        model: "gpt-4o-mini",
                        messages: [
                            { role: "system", content: "You are JAMPAN-XMD, a smart AI developed by Kelvin Jampan from Tanzania." },
                            { role: "user", content: text }
                        ]
                    }, { headers: { 'Authorization': `Bearer [WEKA_API_KEY_YAKO]`, 'Content-Type': 'application/json' } });
                    
                    await replyWithStyle(sock, remoteJid, response.data.choices[0].message.content, m);
                } catch (e) {
                    await replyWithStyle(sock, remoteJid, "❌ OpenAI API error au salio limeisha.", m);
                }
                break;
            }

            case 'runtime':
                await react("🕒");
                await replyWithStyle(sock, remoteJid, `🚀 *JAMPAN-XMD RUNTIME*\n\n*Uptime:* ${runtime(process.uptime())}`, m);
                break;

            case 'vcf':
                if (!isGroup) return replyWithStyle(sock, remoteJid, "❌ Tumia kwenye group tu!", m);
                await react("📇");
                const groupMetadata = await sock.groupMetadata(remoteJid);
                const participants = groupMetadata.participants;
                let vcfContent = "";
                participants.forEach(p => {
                    const num = p.id.split('@')[0];
                    vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:JMPN | ${num}\nTEL;TYPE=CELL:+${num}\nEND:VCARD\n`;
                });
                await sock.sendMessage(remoteJid, { document: Buffer.from(vcfContent), mimetype: 'text/vcard', fileName: 'JampanContacts.vcf', caption: `✅ Contacts ${participants.length} zimeandaliwa.` }, { quoted: m });
                break;

            case 'owner':
                await react("👑");
                await replyWithStyle(sock, remoteJid, `👑 *CREATOR INFO*\n\nName: Kelvin Jampan\nLocation: Dodoma, TZ\nWhatsApp: wa.me/255674229015`, m);
                break;

            case 'say': {
                await react("🗣️");
                const googleTTS = require('google-tts-api');
                const ttsText = args.join(" ");
                if (!ttsText) return replyWithStyle(sock, remoteJid, "❌ Weka maneno ya kusema.", m);
                const url = googleTTS.getAudioUrl(ttsText, { lang: 'sw', slow: false });
                await sock.sendMessage(remoteJid, { audio: { url: url }, mimetype: 'audio/mpeg', ptt: true }, { quoted: m });
                break;
            }

            // --- PERSONALITY & CREATOR COMMANDS ---
            case "kelvin":
            case "kevin":
            case "jampan":
            case "maneno": {
                const reactions = ["😎", "💎", "🔥", "🚀", "👑", "💻"];
                const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
                const replies = [
                    "Hello there! It's me JAMPAN. How can I help you today? 😊",
                    "Hey! Jampan-Ai here, what's up? 😎",
                    "Yo! Kelvin Jampan in the house! What can I do for you? 👋",
                    "I'm online! You called the Boss? 💎",
                    "JAMPAN-XMD is active! Ready to serve you. 🔥"
                ];
                const randomReply = replies[Math.floor(Math.random() * replies.length)];

                await react(randomReaction);
                await sock.sendMessage(remoteJid, { 
                    text: randomReply,
                    mentions: [m.key.participant || m.key.remoteJid],
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterName: "kelvin - jampan-Ai",
                            newsletterJid: "120363409292513352@newsletter",
                        },
                        externalAdReply: {
                            title: "JAMPAN-XMD PERSONALITY",
                            body: "Kelvin Jampan",
                            thumbnailUrl: "https://files.catbox.moe/fzjhed.png", 
                            sourceUrl: "https://jampanbot.vercel.app",
                            renderLargerThumbnail: false,
                            mediaType: 1
                        }
                    }
                }, { quoted: m });

                await sock.sendMessage(remoteJid, {
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
                }, { quoted: m });
                break;
            }

            // --- ADVANCED AI CHAT ---
            case "ai": 
            case "gpt": 
            case "gemini": 
            case "chatgpt": {
                await react("🧠");
                const text = args.join(" ");
                if (!text) return await replyWithStyle(sock, remoteJid, "❌ Please tell me something!..\n\nExample: .ai who is Kelvin Jampan?", m);
                
                if (!global.userChats) global.userChats = {};
                if (!global.userChats[remoteJid]) global.userChats[remoteJid] = [];
                
                global.userChats[remoteJid].push(`User: ${text}`);
                if (global.userChats[remoteJid].length > 10) global.userChats[remoteJid].shift(); 
                
                let userHistory = global.userChats[remoteJid].join("\n"); 

                const systemPrompt = `You are JAMPAN-XMD, a friendly smart WhatsApp bot. 
                Owner: Kelvin Jampan from Dodoma, Tanzania (wa.me/255674229015).
                Creator details: Kelvin is a gamer, developer, and rich student.
                Website: https://jampanbot.vercel.app
                Rules: 
                - Chat naturally like a human. 
                - If someone asks to play music, reply ONLY with: .play [song name]
                - If someone asks for video, reply ONLY with: .video [name]
                - If a girl likes Kelvin, share his number.
                - Use Kiswahili or English.
                History: ${userHistory}`;

                try {
                    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                        model: "gpt-4o-mini",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: text }
                        ],
                        temperature: 0.7
                    }, {
                        headers: {
                            'Authorization': `Bearer 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`,
                            'Content-Type': 'application/json'
                        }
                    });

                    let botResponse = response.data.choices[0].message.content;
                    global.userChats[remoteJid].push(`Bot: ${botResponse}`);
                    await replyWithStyle(sock, remoteJid, botResponse, m);

                } catch (e) {
                    await replyWithStyle(sock, remoteJid, "❌ OpenAI is busy or balance is low. Try again later!", m);
                }
                break;
            }

            // --- PROFILE & TOOLS ---
            case 'pp':
            case 'profilepic': {
                try {
                    await react("📸");
                    let targetUser = m.key.remoteJid;
                    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                        targetUser = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
                    } else if (quoted) {
                        targetUser = quoted.sender;
                    }
                    
                    const ppUrl = await sock.profilePictureUrl(targetUser, 'image').catch(() => null);
                    if (ppUrl) {
                        await sock.sendMessage(remoteJid, { 
                            image: { url: ppUrl }, 
                            caption: `📸 *Profile picture of @${targetUser.split('@')[0]}*\n\n_Retrieved by JAMPAN-XMD_`,
                            mentions: [targetUser]
                        }, { quoted: m });
                    } else {
                        await replyWithStyle(sock, remoteJid, `❌ @${targetUser.split('@')[0]} has no profile picture or it's hidden.`, m);
                    }
                } catch (error) {
                    await replyWithStyle(sock, remoteJid, "❌ Error fetching profile picture.", m);
                }
                break;
            }


            
            case 'broadcast': {
                if (!isOwner) return await replyWithStyle(sock, remoteJid, "*Who Are You to command me huh??* 🤨", m);
                const bcText = args.join(" ");
                if (!bcText) return await replyWithStyle(sock, remoteJid, `*Which message?*\n\nExample: .broadcast Hello everyone!`, m);
                if (!isGroup) return await replyWithStyle(sock, remoteJid, "❌ Use inside a group to fetch members.", m);

                try {
                    await react("📢");
                    const groupMetadata = await sock.groupMetadata(remoteJid);
                    const members = groupMetadata.participants.map(v => v.id);
                    await replyWithStyle(sock, remoteJid, `🚀 *Broadcasting to ${members.length} members...*`, m);

                    for (let member of members) {
                        await delay(1500); 
                        await sock.sendMessage(member, {
                            text: bcText,
                            contextInfo: {
                                forwardingScore: 999,
                                isForwarded: true,
                                externalAdReply: {
                                    title: "JAMPAN-XMD BROADCAST",
                                    body: "Official Message from Kelvin Jampan",
                                    thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                                    sourceUrl: "https://jampanbot.vercel.app",
                                    mediaType: 1
                                }
                            }
                        }).catch(err => console.log(`Failed for ${member}`));
                    }
                    await replyWithStyle(sock, remoteJid, `✅ *Broadcast Completed!*`, m);
                } catch (error) {
                    await replyWithStyle(sock, remoteJid, "❌ Broadcast failed.", m);
                }
                break;
            }

            // --- SYSTEM INFORMATION & LINKS (ENGLISH) ---
            
            case 'love': {
                await react("📄");
                await replyWithStyle(sock, remoteJid, "*You came as an unexpected person in my life... Now you are the most important person in my life. I love you forever and always.* ❤️❤️💠", m);
                break;
            }

            case 'rtime': {
                await react("😎");
                await replyWithStyle(sock, remoteJid, "HELLO.... I'M HAPPY TO SEE YOU\n\n*JAMPAN-XMD* owner says most updates are around the corner... You will enjoy more commands as he adds them...\n\n....Use me carefully\n\nI LOVE YOU", m);
                break;
            }

            case 'script': {
                await react("🐅");
                const scriptInfo = `
┏━━━━━━━━━━━━━━
┃ JAMPAN-XMD 🎉🎉🎉 
┃ STATUS: ACTIVE ♦
┗━━━━━━━━━━━━━━━
▬▬▬▬▬▬▬▬▬▬▬▬▬▬
❶ || Creator = Kelvin Jampan
▬▬▬▬▬▬▬▬▬▬▬▬▬▬
❷ || WhatsApp Channel = https://whatsapp.com/channel/120363409292513352
▬▬▬▬▬▬▬▬▬▬▬▬▬▬
Please Follow My Support Channel
Wanna talk to me? 👉 wa.me/255674229015 👈
▬▬▬▬▬▬▬▬▬▬▬▬▬▬
© *JAMPAN-XMD*`;
                await replyWithStyle(sock, remoteJid, scriptInfo, m);
                break;
            }

            case 'vision': {
                await react("🔎");
                await replyWithStyle(sock, remoteJid, "*_Our mission is to let you enjoy your WhatsApp experience to the fullest.... ❣️ Feel loved here._*", m);
                break;
            }

            case 'support':
            case 'channel': {
                await react("🍁");
                await replyWithStyle(sock, remoteJid, "Tap here to join our official support channel: https://whatsapp.com/channel/120363409292513352", m);
                break;
            }

            case 'heroku': {
                await react("🤷");
                await replyWithStyle(sock, remoteJid, "*_JAMPAN-XMD is running perfectly on Heroku/Railway. Love it!_*", m);
                break;
            }

            case 'me': {
                await react("🤷");
                await replyWithStyle(sock, remoteJid, "*Check the developer via: https://wa.me/255674229015*", m);
                break;
            }

            // --- SETTINGS COMMANDS ---
            case "setprefix": {
                if (!isOwner) return await react("❌"); // Ni owner tu anaweza kubadili prefix
                await react("⚙️");
                const newPrefix = args[0]; // Inachukua neno la kwanza baada ya command
                
                if (!newPrefix) {
                    return await replyWithStyle(sock, remoteJid, `❌ *Weka alama unayotaka!*\nMfano: ${prefix}setprefix #`, m);
                }
                
                currentPrefix = newPrefix; // Hii inabadilisha prefix inayotumika sasa hivi
                await replyWithStyle(sock, remoteJid, `✅ *PREFIX IMEBADILISHWA!*\n\nAlama mpya: *${currentPrefix}*`, m);
                break;
            }

            // --- SYSTEM PERFORMANCE ---
            case "ping": {
                await react("🚀");
                const startTime = Date.now();

                // 1. Meseji ya mwanzo ya kuanza ku-ping
                let pingMsg = await sock.sendMessage(remoteJid, { text: '*_⚡️ Pinging JAMPAN-XMD..._*' }, { quoted: m });

                // 2. Animate Progress Bar (Kufanya bot ionekane inachakata data)
                const progressSteps = [
                    { bar: '▰▱▱▱▱▱▱▱▱▱', percent: '10%' },
                    { bar: '▰▰▰▰▱▱▱▱▱▱', percent: '40%' },
                    { bar: '▰▰▰▰▰▰▰▰▱▱', percent: '70%' },
                    { bar: '▰▰▰▰▰▰▰▰▰▰', percent: '100%' }
                ];

                for (let step of progressSteps) {
                    await delay(300); // Kutumia Baileys delay utility
                    await sock.sendMessage(remoteJid, { text: `${step.bar} ${step.percent}`, edit: pingMsg.key });
                }

                const latency = Date.now() - startTime;
                let quality = 'ᴇxᴄᴇʟʟᴇɴᴛ', emoji = '🟢';
                if (latency > 100 && latency < 300) { quality = 'ɢᴏᴏᴅ'; emoji = '🟡'; }
                else if (latency >= 300) { quality = 'ғᴀɪʀ'; emoji = '🟠'; }

                // 3. Jibu la Mwisho (Final Fancy Ping)
                const finalText = `
━━━━━━━━━━━━━━━━━━━━
┃  ⚡️ ᴘɪɴɢ ʀᴇsᴜʟᴛ ⚡️
━━━━━━━━━━━━━━━━━━━━

🏓 *Ping Completed!*
⚡ *Speed:* ${latency}ms
${emoji} *Quality:* ${quality}
🕒 *Time:* ${new Date().toLocaleTimeString()}

━━━━━━━━━━━━━━━━━━━━
┃ 🤖 *JAMPAN-XMD* 🚀
━━━━━━━━━━━━━━━━━━━━`;

                // Tuma picha ya mwisho kwa style ya JAMPAN
                await sock.sendMessage(remoteJid, {
                    image: { url: "https://files.catbox.moe/fzjhed.png" },
                    caption: finalText,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterName: "kelvin - jampan-Ai",
                            newsletterJid: "120363409292513352@newsletter",
                        },
                        externalAdReply: {
                            title: "JAMPAN-XMD SPEED",
                            body: "Kelvin Jampan Official Bot",
                            thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                            sourceUrl: "https://jampanbot.vercel.app",
                            renderLargerThumbnail: false,
                            mediaType: 1
                        }
                    }
                }, { quoted: m });

                // 4. Tuma Audio Automatic (Theme Song)
                await sock.sendMessage(remoteJid, {
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
                }, { quoted: m });

                break;
            }

            case 'define': {
                await react("📚");
                const term = args.join(" ");
                if (!term) return await replyWithStyle(sock, remoteJid, `🔤 *Usage:* .define [word]`, m);

                try {
                    let res = await axios.get(`https://api.giftedtech.my.id/api/tools/define?apikey=gifted&term=${encodeURIComponent(term)}`);
                    if (!res.data || res.data.result.length === 0) return await replyWithStyle(sock, remoteJid, `❌ *No definition found for:* _${term}_`, m);

                    let replyText = `───〔 📚 *DEFINITION* 〕───⬣\n\n📌 *Term:* ${term.toUpperCase()}\n\n`;
                    res.data.result.slice(0, 2).forEach((def, i) => {
                        replyText += `🧠 *Meaning ${i + 1}:*\n${def.definition}\n${def.example ? `💡 *Example:* _${def.example}_\n\n` : '\n'}`;
                    });
                    replyText += `──────⬣\n*Generated by JAMPAN-XMD*`;

                    await replyWithStyle(sock, remoteJid, replyText, m);
                } catch (e) {
                    await replyWithStyle(sock, remoteJid, "❌ Failed to fetch definition.", m);
                }
                break;
            }
            
            case 'coffee': {
                await react("☕");
                const JampanFacts = [
                    "JAMPAN-XMD is the most advanced AI bot developed by Kelvin Jampan! 🤖",
                    "Kelvin Jampan built this bot to automate tasks effortlessly. 🚀",
                    "Kelvin Jampan is a multi-talented developer, animator, and music producer. 👑",
                    "JAMPAN-XMD is constantly updated by Kelvin to ensure 99.9% uptime. ⚡"
                ];
                const randomFact = JampanFacts[Math.floor(Math.random() * JampanFacts.length)];
                
                await sock.sendMessage(remoteJid, {
                    image: { url: 'https://coffee.alexflipnote.dev/random' },
                    caption: `☕ *Enjoy your coffee!*\n\n*Did you know?*\n${randomFact}\n\n*Powered by Kelvin Jampan*`,
                    contextInfo: {
                        externalAdReply: {
                            title: "JAMPAN-XMD COFFEE BREAK",
                            body: "Developed by Kelvin Jampan",
                            thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                            sourceUrl: "https://jampanbot.vercel.app",
                            mediaType: 1
                        }
                    }
                }, { quoted: m });
                break;
            }
            
COMMANDS (JAMPAN-XMD STYLE) ---

            case 'sticker':
            case 's': {
                await react("✨");
                const { Sticker, StickerTypes } = require('wa-sticker-formatter');
                const isMedia = (type === 'imageMessage' || type === 'videoMessage');
                const isQuotedMedia = type === 'extendedTextMessage' && (content.includes('imageMessage') || content.includes('videoMessage'));

                if (isMedia || isQuotedMedia) {
                    const buffer = await downloadMedia();
                    const sticker = new Sticker(buffer, {
                        pack: 'JAMPAN-XMD',
                        author: 'Kelvin Jampan',
                        type: args.includes('-c') ? StickerTypes.CROPPED : StickerTypes.FULL,
                        quality: 70
                    });

                    // Tuma Audio & Sticker yenye Forwarded info
                    await playTheme();
                    await sock.sendMessage(remoteJid, { 
                        sticker: await sticker.toBuffer(),
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterName: "kelvin - jampan-Ai",
                                newsletterJid: "120363409292513352@newsletter",
                            }
                        }
                    }, { quoted: m });
                } else {
                    await replyWithStyle(sock, remoteJid, "❌ Please mention or send an image/video to create a sticker!", m);
                }
                break;
            }
                     // --- CONVERSION         case 'take':
            case 'steal': {
                await react("📸");
                if (!quoted || type !== 'extendedTextMessage') return await replyWithStyle(sock, remoteJid, "❌ Reply to a sticker to change its metadata!", m);
                
                const { Sticker, StickerTypes } = require('wa-sticker-formatter');
                const buffer = await downloadMedia();
                const packName = args.join(" ") || "JAMPAN-XMD";
                
                const sticker = new Sticker(buffer, {
                    pack: packName,
                    author: 'Kelvin Jampan',
                    type: StickerTypes.CROPPED,
                    quality: 70
                });

                await playTheme();
                await sock.sendMessage(remoteJid, { sticker: await sticker.toBuffer() }, { quoted: m });
                break;
            }

            case 'write':
            case 'meme': {
                await react("📝");
                const text = args.join(" ");
                if (!text) return await replyWithStyle(sock, remoteJid, "❌ Provide text to write on the image!\nExample: .write Hello World", m);
                if (!quoted || !content.includes('imageMessage')) return await replyWithStyle(sock, remoteJid, "❌ Reply to an image to make a meme!", m);

                try {
                    const { Sticker, StickerTypes } = require('wa-sticker-formatter');
                    const imgUrl = await uploadToImgur(await downloadMedia()); // Unahitaji Imgur function
                    const memeUrl = `https://api.memegen.link/images/custom/-/${text}.png?background=${imgUrl}`;
                    
                    const sticker = new Sticker(memeUrl, {
                        pack: 'JAMPAN MEME',
                        author: 'Kelvin Jampan',
                        type: StickerTypes.FULL,
                        quality: 100
                    });

                    await playTheme();
                    await sock.sendMessage(remoteJid, { sticker: await sticker.toBuffer() }, { quoted: m });
                } catch (e) {
                    await replyWithStyle(sock, remoteJid, "❌ Error creating meme. Ensure the image is valid.", m);
                }
                break;
            }

              case 'url':
            case 'link': {
                await react("🔗");
                if (!quoted) return await replyWithStyle(sock, remoteJid, "❌ Reply to an image or video to get a direct link!", m);
                
                const mediaPath = await downloadAndSaveMedia();
                try {
                    // Kutumia Telegraph upload kama kwenye code uliyotuma
                    const telegraphLink = await uploadToTelegraph(mediaPath);
                    await playTheme();
                    await replyWithStyle(sock, remoteJid, `✅ *Media Uploaded Successfully!*\n\n🔗 *Link:* ${telegraphLink}`, m);
                } catch (e) {
                    await replyWithStyle(sock, remoteJid, "❌ Failed to upload media to Telegraph.", m);
                } finally {
                    if (fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
                }
                break;
            }

            case 'photo': {
                await react("🖼️");
                if (!quoted || !content.includes('stickerMessage')) return await replyWithStyle(sock, remoteJid, "❌ Reply to a non-animated sticker to convert it to a photo!", m);
                
                const stickerPath = await downloadAndSaveMedia();
                const outPath = stickerPath + ".png";
                
                const { exec } = require('child_process');
                exec(`ffmpeg -i ${stickerPath} ${outPath}`, async (err) => {
                    if (err) return await replyWithStyle(sock, remoteJid, "❌ Failed to convert sticker. Make sure it's not animated.", m);
                    
                    await playTheme();
                    await sock.sendMessage(remoteJid, { 
                        image: fs.readFileSync(outPath), 
                        caption: "✅ Converted by JAMPAN-XMD" 
                    }, { quoted: m });
                    
                    fs.unlinkSync(stickerPath);
                    fs.unlinkSync(outPath);
                });
                break;
            }
            
                 // --- GROUP EVENTS COMMANDS (JAMPAN-XMD AUTOMATION) ---

            case 'welcome':
            case 'goodbye':
            case 'antipromote':
            case 'antidemote': {
                // Hii itatumia jina la command yenyewe (mfano: kama mtu kapiga .welcome)
                const eventName = command.toLowerCase();
                
                // 1. Verification: Admin au Owner pekee
                if (!isGroupAdmins && !isCreator) {
                    return await replyWithStyle(sock, remoteJid, "❌ *Access Denied!* Only Admins can manage Group Events.", m);
                }

                // 2. Angalia Argument (on/off)
                if (!args[0]) {
                    return await replyWithStyle(sock, remoteJid, `💡 *Usage:* .${eventName} on / off\n\nExample: .${eventName} on`, m);
                }

                const status = args[0].toLowerCase();
                if (status === 'on' || status === 'off') {
                    
                    // Hapa tunaita database yako (attribuerUnevaleur)
                    const { attribuerUnevaleur } = require('../bdd/welcome');
                    await attribuerUnevaleur(remoteJid, eventName, status);

                    // 3. Muonekano wa Kisasa & Audio vibe
                    await playTheme();
                    await react(status === 'on' ? "✅" : "❌");

                    let description = "";
                    if (eventName === 'welcome') description = "Greeting new members when they join.";
                    if (eventName === 'goodbye') description = "Sending a farewell message to departing members.";
                    if (eventName === 'antipromote') description = "Auto-demoting anyone who promotes members without permission.";
                    if (eventName === 'antidemote') description = "Auto-promoting anyone who is demoted illegally.";

                    const statusMsg = `🚀 *JAMPAN-XMD EVENT UPDATE*\n\n` +
                                     `📢 *Event:* ${eventName.toUpperCase()}\n` +
                                     `⚙️ *Status:* ${status === 'on' ? 'ACTIVATED ✅' : 'DEACTIVATED ❌'}\n` +
                                     `📝 *Info:* ${description}\n\n` +
                                     `*Powered by JAMPAN-XMD v3*`;

                    await sock.sendMessage(remoteJid, { 
                        text: statusMsg,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterName: "kelvin - jampan-Ai",
                                newsletterJid: "120363409292513352@newsletter",
                            }
                        }
                    }, { quoted: m });

                } else {
                    await replyWithStyle(sock, remoteJid, "❌ *Invalid Input!* Use 'on' to enable or 'off' to disable.", m);
                }
                break;
            }

            case 'fancy':
            case 'font':
            case 'style': {
                const fancy = require("./style"); // Hakikisha path ni sahihi
                const styleId = args[0]?.match(/\d+/)?.join('');
                const textToStyle = args.slice(1).join(" ");

                try {
                    // Kama mtumiaji hajaweka ID au Text, onyesha list ya mitindo yote
                    if (!styleId || !textToStyle) {
                        const styleList = fancy.list('JAMPAN-XMD', fancy);
                        const usageMsg = `✨ *JAMPAN-XMD FANCY FONTS* ✨\n\n` +
                                       `💡 *Usage:* ${prefix}fancy [style_number] [your_text]\n` +
                                       `Example: ${prefix}fancy 5 Kelvin Jampan\n\n` +
                                       `*AVAILABLE STYLES:* \n` + 
                                       String.fromCharCode(8206).repeat(4001) + styleList;

                        await playTheme();
                        return await sock.sendMessage(remoteJid, { 
                            text: usageMsg,
                            contextInfo: {
                                forwardingScore: 999,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterName: "kelvin - jampan-Ai",
                                    newsletterJid: "120363409292513352@newsletter",
                                }
                            }
                        }, { quoted: m });
                    }

                    // Kutafuta style iliyochaguliwa
                    const selectedStyle = fancy[parseInt(styleId) - 1];
                    if (selectedStyle) {
                        const styledText = fancy.apply(selectedStyle, textToStyle);
                        await react("✍️");
                        await sock.sendMessage(remoteJid, { text: styledText }, { quoted: m });
                    } else {
                        await replyWithStyle(sock, remoteJid, "❌ *Style not found!* Please check the list and try again.", m);
                    }
                } catch (error) {
                    console.error(error);
                    await replyWithStyle(sock, remoteJid, "❌ *Error:* Failed to apply fancy style.", m);
                }
                break;
            }

            // --- GENERAL & OWNER COMMANDS (JAMPAN-XMD IDENTITY) ---

            case 'owner': {
                await react("🤴");
                const { isSudoTableNotEmpty, getAllSudoNumbers } = require("../bdd/sudo");
                const hasSudo = await isSudoTableNotEmpty();

                if (hasSudo) {
                    let sudos = await getAllSudoNumbers();
                    let ownerNumber = conf.NUMERO_OWNER.replace(/[^0-9]/g, '');
                    let msg = `✨ *JAMPAN-XMD SUPER-USERS* ✨\n\n` +
                              `👑 *Main Owner:* @${ownerNumber}\n\n` +
                              `🛡️ *Other Sudo Users:* \n`;

                    for (const sudo of sudos) {
                        if (sudo) {
                            let sudonumero = sudo.replace(/[^0-9]/g, '');
                            msg += `- 💼 @${sudonumero}\n`;
                        }
                    }

                    const mentionedJid = sudos.map(s => s.replace(/[^0-9]/g, '') + "@s.whatsapp.net");
                    mentionedJid.push(ownerNumber + "@s.whatsapp.net");

                    await playTheme();
                    await sock.sendMessage(remoteJid, {
                        image: { url: mybotpic() },
                        caption: msg,
                        mentions: mentionedJid,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterName: "kelvin - jampan-Ai",
                                newsletterJid: "120363409292513352@newsletter",
                            }
                        }
                    }, { quoted: m });
                } else {
                    // Kama hakuna sudo, tuma V-Card ya Kelvin Jampan
                    const vcard = 'BEGIN:VCARD\n' +
                                'VERSION:3.0\n' +
                                'FN:' + conf.OWNER_NAME + '\n' +
                                'ORG:JAMPAN-XMD Creator;\n' +
                                'TEL;type=CELL;type=VOICE;waid=' + conf.NUMERO_OWNER + ':+' + conf.NUMERO_OWNER + '\n' +
                                'END:VCARD';
                    
                    await playTheme();
                    await sock.sendMessage(remoteJid, {
                        contacts: {
                            displayName: conf.OWNER_NAME,
                            contacts: [{ vcard }],
                        }
                    }, { quoted: m });
                }
                break;
            }

            case 'dev':
            case 'developer': {
                await react("🦁");
                const devMsg = `👋 *Welcome to JAMPAN-XMD v3*\n\n` +
                               `The bot is professionally maintained by:\n\n` +
                               `• *Kelvin Jampan* (Lead Dev)\n` +
                               `• WhatsApp: https://wa.me/${conf.NUMERO_OWNER}\n` +
                               `• GitHub: https://github.com/Jampan-XMD\n\n` +
                               `_Powered by Node.js & Baileys library_`;

                await playTheme();
                await sock.sendMessage(remoteJid, {
                    image: { url: mybotpic() },
                    caption: devMsg,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterName: "kelvin - jampan-Ai",
                            newsletterJid: "120363409292513352@newsletter",
                        }
                    }
                }, { quoted: m });
                break;
            }

            case 'support': {
                await react("📢");
                const supportLink = "https://chat.whatsapp.com/DTnrZzULVtP5r0E9rhoFOj";
                await replyWithStyle(sock, remoteJid, "✅ I have sent the support link to your DM (Private Message), Sir.", m);
                
                await playTheme();
                await sock.sendMessage(m.sender, { 
                    text: `🚀 *JAMPAN-XMD SUPPORT CHANNEL*\n\nJoin for updates and bug reports:\n${supportLink}` 
                }, { quoted: m });
                break;
            }
            // --- GITHUB SEARCH COMMAND (JAMPAN-XMD STYLE) ---

            case 'github':
            case 'gh': {
                const username = args.join(" ");
                if (!username) return await replyWithStyle(sock, remoteJid, "❌ *Please provide a valid GitHub username!*\nExample: .github Jampan-XMD", m);

                await react("📃");
                try {
                    const response = await fetch(`https://api.github.com/users/${username}`);
                    const data = await response.json();

                    if (data.message === 'Not Found') {
                        return await replyWithStyle(sock, remoteJid, "❌ *User not found!* Check the username and try again.", m);
                    }

                    const githubInfo = `
┏━━━━━━━━━━━━━━━
┃  🌐 *GITHUB USER INFO*
┗━━━━━━━━━━━━━━━
👤 *Name:* ${data.name || 'N/A'}
🆔 *Username:* ${data.login}
✨ *Bio:* ${data.bio || 'No bio available'}
🏢 *Company:* ${data.company || 'N/A'}
📍 *Location:* ${data.location || 'N/A'}
📧 *Email:* ${data.email || 'Private'}
📰 *Blog:* ${data.blog || 'N/A'}
📦 *Public Repos:* ${data.public_repos}
🔐 *Public Gists:* ${data.public_gists}
👥 *Followers:* ${data.followers}
🫶 *Following:* ${data.following}
🔗 *Profile:* ${data.html_url}

*Generated by JAMPAN-XMD v3*`;

                    await playTheme();
                    await sock.sendMessage(remoteJid, { 
                        image: { url: data.avatar_url }, 
                        caption: githubInfo,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterName: "kelvin - jampan-Ai",
                                newsletterJid: "120363409292513352@newsletter",
                            }
                        }
                    }, { quoted: m });

                } catch (error) {
                    console.error(error);
                    await replyWithStyle(sock, remoteJid, "❌ *Error:* Failed to fetch GitHub data.", m);
                }
                break;
            }
// ==========================================
// JAMPAN-XMD GROUP & UTILITY COMMANDS
// ==========================================

case 'tagall': {
    if (!isGroup) return await replyWithStyle(sock, remoteJid, "✋🏿 Hii amri ni kwa ajili ya magroup tu!", m);
    await react("📣");
    const groupMetadata = await sock.groupMetadata(remoteJid);
    const participants = groupMetadata.participants;
    let mess = args.join(' ') || 'No Message';
    
    let tag = `╔════════════════════╗\n` +
              `       ✨ *𝐉𝐀𝐌𝐏𝐀𝐍-𝐗𝐌𝐃* ✨\n` +
              `╚════════════════════╝\n\n` +
              `🔹 *Group:* ${groupMetadata.subject}\n` +
              `🔹 *Admin:* ${pushName}\n` +
              `🔹 *Message:* ${mess}\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n`;

    let emojis = ['💠', '🌀', '⚡', '✨', '💎', '📍', '🛰️', '🎐', '🔥', '⚙️'];
    for (let mem of participants) {
        let randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        tag += `${randomEmoji} @${mem.id.split('@')[0]}\n`;
    }
    tag += `\n━━━━━━━━━━━━━━━━━━━━\n   *© 2026 JAMPAN-XMD*`;

    await sock.sendMessage(remoteJid, { text: tag, mentions: participants.map(a => a.id) }, { quoted: m });
}
break;

case 'link': {
    if (!isGroup) return reply("Magroup tu!");
    await react("🔗");
    const code = await sock.groupInviteCode(remoteJid);
    const response = `Hello *${pushName}*, hapa kuna link ya group:\n\n🔗 https://chat.whatsapp.com/${code}\n\n*𝐉𝐀𝐌𝐏𝐀𝐍-𝐗𝐌𝐃*`;
    await replyWithStyle(sock, remoteJid, response, m);
}
break;

case 'promote': {
    if (!isGroup) return reply("Magroup tu!");
    if (!isOwner) return reply("Amri hii ni kwa Kelvin pekee!");
    await react("👨🏿‍💼");
    let target = m.message.extendedTextMessage?.contextInfo?.participant || args[0]?.replace('@', '') + '@s.whatsapp.net';
    if (!target) return reply("Mtag mtu unayetaka kumpandisha cheo.");
    await sock.groupParticipantsUpdate(remoteJid, [target], "promote");
    reply(`✅ Success! Mtumiaji amekuwa Admin wa JAMPAN-XMD.`);
}
break;

case 'apk': {
    if (!args[0]) return reply("*Weka jina la app!* Mfano: .apk WhatsApp");
    await react("✨");
    try {
        const { search, download } = require("aptoide-scraper");
        const searchResults = await search(args.join(' '));
        if (searchResults.length === 0) return reply("App haijapatikana.");
        const appData = await download(searchResults[0].id);
        
        const captionText = `『 *𝐉𝐀𝐌𝐏𝐀𝐍-𝐗𝐌𝐃 𝐀𝐏𝐊* 』\n\n` +
            `*📌 Jina:* ${appData.name}\n` +
            `*⚖️ Saizi:* ${appData.size}\n`;

        await sock.sendMessage(remoteJid, { image: { url: appData.icon }, caption: captionText }, { quoted: m });
        await sock.sendMessage(remoteJid, { 
            document: { url: appData.dllink }, 
            mimetype: 'application/vnd.android.package-archive', 
            fileName: `${appData.name}.apk` 
        }, { quoted: m });
    } catch (e) { reply("Kosa limetokea wakati wa kupakua."); }
}
break;

case 'github': {
    if (!args[0]) return reply("Weka GitHub username!");
    await react("📃");
    try {
        const response = await axios.get(`https://api.github.com/users/${args[0]}`);
        const data = response.data;
        let userInfo = `°GITHUB USER INFO°\n\n🚩 Id : ${data.id}\n🔖 Username : ${data.login}\n✨ Bio : ${data.bio || "N/A"}\n🔓 Repos : ${data.public_repos}\n👪 Followers : ${data.followers}`;
        await replyWithStyle(sock, remoteJid, userInfo, m);
    } catch (e) { reply("Mtumiaji hajapatikana GitHub."); }
}
break;

case 'getall': {
    if (!isOwner) return reply("Reserved for Kelvin Jampan!");
    await react("✅");
    let type = args[0]?.toLowerCase();
    if (type === 'members' && isGroup) {
        const metadata = await sock.groupMetadata(remoteJid);
        let list = `*「 MEMBER LIST - ${metadata.subject} 」*\n\n`;
        metadata.participants.forEach(p => { list += `💠 +${p.id.split('@')[0]}\n`; });
        reply(list);
    } else if (type === 'gc') {
        let groups = await sock.groupFetchAllParticipating();
        let list = `*「 JAMPAN-XMD GROUPS 」*\n\n`;
        Object.values(groups).forEach(g => { list += `✅ ${g.subject}\nID: ${g.id}\n\n`; });
        reply(list);
    } else {
        reply(`*Matumizi:* ${prefix}getall members | gc`);
    }
}
break;

// ==========================================
// JAMPAN-XMD LOGO & GRAPHICS COMMANDS (CASE)
// ==========================================

case 'hacker':
case 'dragonball':
case 'naruto':
case 'didong':
case 'wall':
case 'summer':
case 'neonlight':
case 'greenneon':
case 'glitch':
case 'devil':
case 'boom':
case 'water':
case 'snow':
case 'transformer':
case 'thunder':
case 'harrypotter':
case 'cat':
case 'whitegold':
case 'lightglow':
case 'thor':
case 'neon':
case 'purple':
case 'gold':
case 'arena':
case 'incandescent': {
    const text = args.join(" ");
    if (!text) return await replyWithStyle(sock, remoteJid, `❌ *Please provide a name!* \nExample: ${prefix}${command} JAMPAN`, m);
    
    await react("🎨");
    const loading = await sock.sendMessage(remoteJid, { text: `*_Please wait, JAMPAN-XMD is generating your ${command} logo..._*` }, { quoted: m });

    try {
        let apiUrl = "";
        // Logic ya kuchagua URL kulingana na command
        const links = {
            hacker: "https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html",
            dragonball: "https://en.ephoto360.com/create-dragon-ball-style-text-effects-online-809.html",
            naruto: "https://en.ephoto360.com/naruto-shippuden-logo-style-text-effect-online-808.html",
            didong: "https://ephoto360.com/tao-anh-che-vui-tu-choi-cuoc-goi-voi-ten-cua-ban-930.html",
            wall: "https://textpro.me/break-wall-text-effect-871.html",
            summer: "https://textpro.me/create-sunset-light-text-effects-online-for-free-1124.html",
            neonlight: "https://textpro.me/create-glowing-neon-light-text-effect-online-free-1061.html",
            greenneon: "https://textpro.me/green-neon-text-effect-874.html",
            glitch: "https://textpro.me/create-impressive-glitch-text-effects-online-1027.html",
            devil: "https://textpro.me/create-neon-devil-wings-text-effect-online-free-1014.html",
            boom: "https://en.ephoto360.com/boom-text-comic-style-text-effect-675.html",
            water: "https://en.ephoto360.com/create-water-effect-text-online-295.html",
            snow: "https://textpro.me/create-beautiful-3d-snow-text-effect-online-1101.html",
            transformer: "https://textpro.me/create-a-transformer-text-effect-online-1035.html",
            thunder: "https://textpro.me/online-thunder-text-effect-generator-1031.html",
            harrypotter: "https://textpro.me/create-harry-potter-text-effect-online-1025.html",
            cat: "https://textpro.me/write-text-on-foggy-window-online-free-1015.html",
            whitegold: "https://textpro.me/elegant-white-gold-3d-text-effect-online-free-1070.html",
            lightglow: "https://textpro.me/create-light-glow-sliced-text-effect-online-1068.html",
            thor: "https://textpro.me/create-thor-logo-style-text-effect-online-1064.html",
            neon: "https://textpro.me/neon-text-effect-online-879.html",
            purple: "https://en.ephoto360.com/purple-text-effect-online-100.html",
            gold: "https://en.ephoto360.com/modern-gold-4-213.html",
            arena: "https://en.ephoto360.com/create-cover-arena-of-valor-by-mastering-360.html",
            incandescent: "https://en.ephoto360.com/text-effects-incandescent-bulbs-219.html"
        };

        const targetLink = links[command];
        let data;
        
        // Kutofautisha kati ya TextPro na Ephoto360 APIs
        if (targetLink.includes("textpro.me")) {
            data = await mumaker.textpro(targetLink, text);
        } else {
            data = await mumaker.ephoto(targetLink, text);
        }

        await sock.sendMessage(remoteJid, { delete: loading.key });
        
        await sock.sendMessage(remoteJid, {
            image: { url: data.image },
            caption: `\n━━━━━━━━━━━━━━━━━━━━\n┃ 🎨 *${command.toUpperCase()} LOGO*\n━━━━━━━━━━━━━━━━━━━━\n\n> Generated by JAMPAN-XMD Engine\n\n🌐 *Web:* https://jampanbot.vercel.app\n🌲 *Linktree:* https://jampan47.vercel.app\n\n━━━━━━━━━━━━━━━━━━━━\n┃ 🤖 *POWERED BY JAMPAN-AI* 🚀\n━━━━━━━━━━━━━━━━━━━━`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterName: "kelvin - jampan-Ai",
                    newsletterJid: "120363409292513352@newsletter",
                },
                externalAdReply: {
                    title: "JAMPAN-XMD GRAPHICS",
                    body: "Creative Logo Design Bot",
                    thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                    sourceUrl: "https://jampanbot.vercel.app",
                    mediaType: 1
                }
            }
        }, { quoted: m });

    } catch (e) {
        await sock.sendMessage(remoteJid, { edit: loading.key, text: `🥵 *An error occurred:* ${e.message}` });
    }
}
break;

// ==========================================
// JAMPAN-XMD HEROKU & CONFIG COMMANDS
// ==========================================

case 'anticall': {
    if (!isOwner) return reply("This command is restricted to JAMPAN-XMD owner.");
    if (!args[0]) return reply('Usage:\n\nType "anticall yes" to enable or "anticall no" to disable.');
    await react("📞");
    
    let option = args[0].toLowerCase();
    if (option === 'yes') {
        s.ANTICALL = 'yes';
        reply("Anti-call has been enabled successfully.");
    } else if (option === 'no') {
        s.ANTICALL = 'no';
        reply("Anti-call has been disabled.");
    } else {
        reply("Invalid option! Use yes/no.");
    }
}
break;

case 'areact': {
    if (!isOwner) return reply("This command is restricted to JAMPAN-XMD owner.");
    if (!args[0]) return reply('Usage:\n\nType "areact yes" to enable or "areact no" to disable.');
    await react("🎭");
    
    let option = args[0].toLowerCase();
    s.AUTO_REACT = option === 'yes' ? 'yes' : 'no';
    reply(`Auto-reaction has been ${option === 'yes' ? 'enabled' : 'disabled'}.`);
}
break;

case 'readstatus': {
    if (!isOwner) return reply("Owner only command!");
    await react("👁️");
    if (!args[0]) return reply('Type "readstatus yes" to enable.');
    
    let option = args[0].toLowerCase();
    s.AUTO_READ_STATUS = option === 'yes' ? 'yes' : 'no';
    reply(`Auto status read has been ${option === 'yes' ? 'enabled' : 'disabled'}.`);
}
break;

case 'antidelete': {
    if (!isOwner) return reply("Access Denied! Owner only.");
    await react("🗑️");
    if (!args[0]) return reply('Usage: antidelete yes/no');















        }
    } catch (err) {
        console.error("HandleCommands Error:", err);
    }
};

module.exports = { handleCommands };
