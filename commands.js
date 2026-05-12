// command.js - Ubongo wa JAMPAN-XMD
// Created by Kelvin Jampan

let currentPrefix = "."; 
let uniqueUsers = new Set(); 

const replyWithStyle = async (sock, jid, text, m) => {
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
    }, { quoted: m });

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
    }, { quoted: m });
};

// MUHIMU: Ongeza 'settings' hapa kwenye mabano
const handleCommands = async (sock, m, settings) => {
    try {
        const remoteJid = m.key.remoteJid;
        const pushName = m.pushName || "Mtumiaji";
        const isOwner = remoteJid.includes(settings.ownerNumber) || m.key.fromMe;
        
        const messageType = Object.keys(m.message)[0];
        const body = (messageType === 'conversation') ? m.message.conversation : 
                     (messageType === 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                     (messageType === 'imageMessage') ? m.message.imageMessage.caption : '';

        const prefix = currentPrefix; 

        if (!m.key.fromMe) {
            uniqueUsers.add(remoteJid);
        }

        if (!body.startsWith(prefix)) return;

        const command = body.slice(prefix.length).trim().split(' ')[0].toLowerCase();
        const args = body.trim().split(/ +/).slice(1);

        // --- Dhibiti Private Mode Hapa ---
        if (settings.mode === 'private' && !isOwner) return;

        const react = async (emoji) => {
            await sock.sendMessage(remoteJid, { react: { text: emoji, key: m.key } });
        };

        switch (command) {
                   case 'mode':
                if (!isOwner) return await react("❌");
                const newMode = args[0];
                if (newMode === 'public' || newMode === 'private') {
                    settings.mode = newMode;
                    await react("✅");
                    await replyWithStyle(sock, remoteJid, `✅ Mode imebadilishwa kuwa: *${newMode.toUpperCase()}*`, m);
                }
                break;

            // ... Case zingine zinafuata hapa ...
        // ... (Kile kipengele chako cha juu kinaishia hapa) ...
        const react = async (emoji) => {
            await sock.sendMessage(remoteJid, { react: { text: emoji, key: m.key } });
        };

            // Weka case zako nyingine hapa (bible, ai, nk.)

            default:
                // Kama command haipo, unaweza kuchagua kunyamaza au kutoa reaction
                break;
        }

    } catch (e) {
        console.log("❌ Error kwenye handleCommands: ", e);
    }
};

// HII NDIYO INARUHUSU index.js KUIONA HII FILE
module.exports = { handleCommands };

            case 'menu': {
    await react("📑");
    
    // Kupata muda wa sasa
    const date = new Date().toLocaleDateString('en-TZ', { day: 'numeric', month: 'long', year: 'numeric' });
    const time = new Date().toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' });

    let menuText = `> ╭━━━〔 *JAMPAN-XMD* 〕━━━╮\n` +
                   `> ┃ 👤 *Owner:* Kelvin Jampan\n` +
                   `> ┃ 📅 *Date:* ${date}\n` +
                   `> ┃ ⌚ *Time:* ${time}\n` +
                   `> ╰━━━━━━━━━━━━━━━━━━╯\n\n` +
                   
                   `> ╭──〔 *AI & UTILITIES* 〕──╮\n` +
                   `> ┃ 🗣️ .say [text] - TTS Audio\n` +
                   `> ┃ 📖 .bible [verse] - Holy Bible\n` +
                   `> ┃ 🌐 .trt [lang] [text] - Translate\n` +
                   `> ╰━━━━━━━━━━━━━━━━━━╯\n\n` +
                   
                   `> ╭───〔 *GROUP TOOLS* 〕───╮\n` +
                   `> ┃ 📇 .vcf - Export All Contacts\n` +
                   `> ╰━━━━━━━━━━━━━━━━━━╯\n\n` +
                   
                   `> ╭───〔 *SERVER TOOLS* 〕───╮\n` +
                   `> ┃ 📡 .status - Cloud API Status\n` +
                   `> ╰━━━━━━━━━━━━━━━━━━╯\n\n` +
                   
                   `> *JAMPAN-XMD GLOBAL*`;

    await sock.sendMessage(remoteJid, {
        text: menuText,
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterName: "Kelvin - Jampan-Ai",
                newsletterJid: "120363409292513352@newsletter",
            },
            externalAdReply: {
                title: "JAMPAN-XMD MENU",
                body: "Developed by Kelvin Jampan",
                thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                sourceUrl: "https://jampanbot.vercel.app",
                mediaType: 1
            }
        }
    }, { quoted: m });
    
    await react("✅");
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
                const startTime = Date.now();

                // 1. Meseji ya mwanzo ya kuanza ku-ping
                let pingMsg = await sock.sendMessage(remoteJid, { text: '*_⚡️ Pinging JAMPAN-XMD..._*' }, { quoted: m });

                // 2. Animate Progress Bar
                const progressSteps = [
                    { bar: '▰▱▱▱▱▱▱▱▱▱', percent: '10%' },
                    { bar: '▰▰▰▰▱▱▱▱▱▱', percent: '40%' },
                    { bar: '▰▰▰▰▰▰▰▰▱▱', percent: '70%' },
                    { bar: '▰▰▰▰▰▰▰▰▰▰', percent: '100%' }
                ];

                for (let step of progressSteps) {
                    await delay(200); // Badala ya setTimeout, tunatumia Baileys delay
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
                    edit: pingMsg.key,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterName: "kelvin - jampan-Ai",
                            newsletterJid: "120363409292513352@newsletter",
                        }
                    }
                });

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

            case "fc":
            case "follow": {
                // Tunatenganisha JID kutoka kwenye meseji
                const args = body.trim().split(/ +/).slice(1);
                const jid = args[0];

                if (!args.length) {
                    return await replyWithStyle(sock, remoteJid, `❗ *Tafadhali weka Channel JID.*\n\nMfano:\n${prefix}fc 120363409292513352@newsletter`, m);
                }

                if (!jid.endsWith("@newsletter")) {
                    return await replyWithStyle(sock, remoteJid, `❗ *JID sio sahihi.* Lazima iishe na \`@newsletter\``, m);
                }

                try {
                    await react("😌"); // React kama ilivyokuwa kwenye kodi uliyopata
                    
                    // Kupata taarifa za channel kwanza
                    const metadata = await sock.newsletterMetadata("jid", jid);
                    
                    // Kama bado hatuja-follow (viewer_metadata ni null)
                    if (metadata?.viewer_metadata?.role === null || !metadata?.viewer_metadata) {
                        await sock.newsletterFollow(jid);
                        await replyWithStyle(sock, remoteJid, `✅ *Successfully followed the channel:*\n\n*Name:* ${metadata.name || 'Unknown'}\n*JID:* ${jid}`, m);
                        console.log(`✅ JAMPAN-XMD FOLLOWED: ${jid}`);
                    } else {
                        await replyWithStyle(sock, remoteJid, `📌 *Tayari bot inaifuata channel hii:* \n${metadata.name || jid}`, m);
                    }
                } catch (e) {
                    console.error('❌ Error in follow channel:', e.message);
                    await replyWithStyle(sock, remoteJid, `❌ *Imeshindikana:* ${e.message}`, m);
                }
                break;
            }

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

                // Tunatuma meseji kwa kutumia link yako na branding yako
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
                            sourceUrl: "https://jampanbot.vercel.app", // Link yako rasmi
                            renderLargerThumbnail: false,
                            mediaType: 1
                        }
                    }
                }, { quoted: m });

                // Tuma Audio kama kawaida
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
                        case "ai": 
            case "gpt": 
            case "gemini": 
            case "chatgpt": {
                await react("🧠");
                
                // Tunapata text ya swali
                const text = body.slice(command.length + prefix.length).trim();
                if (!text) return await replyWithStyle(sock, remoteJid, "❌ Please tell me something!..\n\nExample: .ai who is Kelvin Jampan?", m);
                
                // Memory ya mazungumzo
                if (!global.userChats) global.userChats = {};
                if (!global.userChats[m.key.remoteJid]) global.userChats[m.key.remoteJid] = [];
                
                global.userChats[m.key.remoteJid].push(`User: ${text}`);
                if (global.userChats[m.key.remoteJid].length > 10) global.userChats[m.key.remoteJid].shift(); 
                
                let userHistory = global.userChats[m.key.remoteJid].join("\n"); 

                // --- SYSTEM LOGIC (UTAMBULISHO WA BOT) ---
                const systemPrompt = `You are JAMPAN-XMD, a friendly smart WhatsApp bot. 
                Owner: Kelvin Jampan from Dodoma, Tanzania (wa.me/255674229015).
                Creator details: Kelvin is a developer, 3D animator, and music producer.
                Website: https://jampanbot.vercel.app
                Rules: 
                - Chat naturally like a human. 
                - If someone asks to play music, reply ONLY with: .play [song name]
                - If someone asks for video, reply ONLY with: .video [name]
                - If a girl likes Kelvin, share his number.
                - Use Kiswahili or English.
                History: ${userHistory}`;

                try {
                    const axios = require('axios');
                    
                    // Direct request kwenda OpenAI (Kutumia Key yako)
                    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                        model: "gpt-4o-mini", // Model yenye kasi na gharama nafuu
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
                    global.userChats[m.key.remoteJid].push(`Bot: ${botResponse}`);

                    // Tuma jibu kwa style ya JAMPAN-XMD
                    await replyWithStyle(sock, remoteJid, botResponse, m);

                } catch (e) {
                    console.error("OpenAI Error:", e.response ? e.response.data : e.message);
                    await replyWithStyle(sock, remoteJid, "❌ OpenAI is busy or balance is low. Try again later!", m);
                }
                break;
            }

case 'getpp':
            case 'pp':
            case 'profilepic': {
                try {
                    await react("📸");
                    let targetUser = m.key.remoteJid;
                    
                    // Check if user mentioned someone or replied to a message
                    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                        targetUser = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
                    } else if (m.quoted) {
                        targetUser = m.quoted.sender;
                    }
                    
                    const ppUrl = await sock.profilePictureUrl(targetUser, 'image').catch(() => null);
                    
                    if (ppUrl) {
                        await sock.sendMessage(remoteJid, { 
                            image: { url: ppUrl }, 
                            caption: `📸 *Profile picture of @${targetUser.split('@')[0]}*\n\n_Retrieved by JAMPAN-XMD_`,
                            mentions: [targetUser]
                        }, { quoted: m });
                    } else {
                        await replyWithStyle(sock, remoteJid, `❌ @${targetUser.split('@')[0]} doesn't have a profile picture or it's hidden by privacy settings.`, m);
                    }
                } catch (error) {
                    console.error(error);
                    await replyWithStyle(sock, remoteJid, "❌ Error fetching profile picture.", m);
                }
                break;
            }
            
            case 'toall':
            case 'broadcast': {
                // Check if the sender is the owner (Kelvin Jampan)
                if (!m.key.fromMe && !isOwner) {
                    return await replyWithStyle(sock, remoteJid, "*Who Are You to command me huh??* 🤨", m);
                }

                const text = body.slice(command.length + prefix.length).trim();
                if (!text) {
                    return await replyWithStyle(sock, remoteJid, `*Which message?*\n\nExample: ${prefix + command} Hello everyone, check out my new update!`, m);
                }

                // Ensure the command is used within a group to get members
                if (!m.isGroup) {
                    return await replyWithStyle(sock, remoteJid, "❌ This command can only be used inside a group to fetch members.", m);
                }

                try {
                    await react("📢");
                    const groupMetadata = await sock.groupMetadata(remoteJid);
                    const participants = groupMetadata.participants;
                    const members = participants.map(v => v.id);

                    await replyWithStyle(sock, remoteJid, `🚀 *Broadcasting to ${members.length} members...*\nPlease wait, this process takes time to avoid bans.`, m);

                    for (let member of members) {
                        // 1.5 seconds delay between messages to stay safe from WhatsApp spam filters
                        await new Promise(resolve => setTimeout(resolve, 1500)); 

                        await sock.sendMessage(member, {
                            text: text,
                            contextInfo: {
                                forwardingScore: 999,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterName: "kelvin - jampan-Ai",
                                    newsletterJid: "120363409292513352@newsletter",
                                },
                                externalAdReply: {
                                    title: "JAMPAN-XMD BROADCAST",
                                    body: "Official Message from Developer",
                                    thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                                    sourceUrl: "https://jampanbot.vercel.app",
                                    renderLargerThumbnail: false,
                                    mediaType: 1
                                }
                            }
                        }).catch(err => console.log(`Failed to send to ${member}:`, err.message));
                    }

                    await replyWithStyle(sock, remoteJid, `✅ *Broadcast Completed!*\nSuccessfully delivered to ${members.length} contacts privately.`, m);
                    await react("✅");

                } catch (error) {
                    console.error("Broadcast Error:", error);
                    await replyWithStyle(sock, remoteJid, "❌ Broadcast failed. Make sure I am an admin or the group is accessible.", m);
                }
                break;
            }
            
            case 'define': {
                await react("📚");
                const term = body.slice(command.length + prefix.length).trim();

                if (!term) {
                    return await replyWithStyle(sock, remoteJid, `🔤 *Usage:* ${prefix}define [word]\nExample: ${prefix}define technology`, m);
                }

                try {
                    await replyWithStyle(sock, remoteJid, `🔎 Searching definition for *${term}*...`, m);

                    const axios = require('axios');
                    // Using the GiftedTech API as per your original logic
                    let res = await axios.get(`https://api.giftedtech.my.id/api/tools/define?apikey=gifted&term=${encodeURIComponent(term)}`);

                    if (!res.data || res.data.result.length === 0) {
                        return await replyWithStyle(sock, remoteJid, `❌ *No definition found for:* _${term}_`, m);
                    }

                    let definitions = res.data.result;
                    let replyText = `───〔 📚 *DEFINITION* 〕───⬣\n\n`;
                    replyText += `📌 *Term:* ${term.toUpperCase()}\n\n`;

                    // We take the top 2 definitions to keep the message clean
                    definitions.slice(0, 2).forEach((def, i) => {
                        replyText += `🧠 *Meaning ${i + 1}:*\n${def.definition}\n`;
                        if (def.example) {
                            replyText += `💡 *Example:* _${def.example}_\n\n`;
                        }
                    });

                    replyText += `──────⬣\n*Generated by JAMPAN-XMD*`;

                    await sock.sendMessage(remoteJid, {
                        text: replyText,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterName: "kelvin - jampan-Ai",
                                newsletterJid: "120363409292513352@newsletter",
                            },
                            externalAdReply: {
                                title: "JAMPAN DICTIONARY",
                                body: `Global definition for '${term}'`,
                                thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                                sourceUrl: "https://jampanbot.vercel.app",
                                renderLargerThumbnail: false,
                                mediaType: 1
                            }
                        }
                    }, { quoted: m });

                    await react("✅");

                } catch (e) {
                    console.error('Define Error:', e);
                    await replyWithStyle(sock, remoteJid, "❌ *Failed to fetch definition. Try again later.*", m);
                }
                break;
            }
            
            case 'coffee':
            case 'cafe': {
                await react("☕");
                const JampanFacts = [
                    "JAMPAN-XMD is the most advanced AI bot developed by Kelvin Jampan! 🤖",
                    "Kelvin Jampan built this bot to automate tasks effortlessly for global users. 🚀",
                    "JAMPAN-XMD supports over 1000+ specialized commands! 🎉",
                    "The bot is powered by high-end AI technology, curated by Kelvin Jampan. 💡",
                    "JAMPAN-XMD can fetch real-time data from APIs in milliseconds. ⚡",
                    "With 99.9% uptime, Kelvin Jampan ensures you are always connected. 🌐",
                    "This bot is designed by Kelvin to make your digital life easier. 😎",
                    "JAMPAN-XMD can handle thousands of global users simultaneously. 👥",
                    "Kelvin Jampan integrated multimedia support for images, videos, and HD audio. 🎨",
                    "JAMPAN-XMD is constantly updated with new features by its developer. 🔄",
                    "The bot is highly customizable to fit your personal or business needs. 🛠️",
                    "Kelvin Jampan built a robust error-handling system for smooth performance. 🛡️",
                    "JAMPAN-XMD can generate AI art, quotes, and technical codes! 🖼️",
                    "Kelvin Jampan is a multi-talented developer, animator, and music producer. 👑",
                    "This bot can fetch real-time weather, news, and stock market updates. 📊",
                    "Kelvin Jampan ensures JAMPAN-XMD is secure and protects your privacy. 🔒",
                    "The interface is optimized for easy navigation and fast responses. 🖥️",
                    "JAMPAN-XMD can integrate with major third-party apps and services. 🔗",
                    "Kelvin Jampan designed this bot for both personal and professional use. 💼",
                    "It features a built-in AI tutor for educational and coding support. 📖",
                    "Kelvin Jampan started building JAMPAN-XMD to revolutionize WhatsApp AI. 🚀",
                    "JAMPAN-XMD can generate high-quality QR codes and barcodes instantly. 📇",
                    "The bot features a built-in translator supporting multiple global languages. 🌍",
                    "Kelvin Jampan is the mastermind behind the JAMPAN-XMD ecosystem. 💎"
                ];

                const randomFact = JampanFacts[Math.floor(Math.random() * JampanFacts.length)];
                
                await sock.sendMessage(remoteJid, {
                    image: { url: 'https://coffee.alexflipnote.dev/random' },
                    caption: `☕ *Enjoy your coffee!*\n\n*Did you know?*\n${randomFact}\n\n*Powered by Kelvin Jampan*`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterName: "kelvin - jampan-Ai",
                            newsletterJid: "120363409292513352@newsletter",
                        },
                        externalAdReply: {
                            title: "JAMPAN-XMD COFFEE BREAK",
                            body: "Developed by Kelvin Jampan",
                            thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                            sourceUrl: "https://jampanbot.vercel.app",
                            renderLargerThumbnail: false,
                            mediaType: 1
                        }
                    }
                }, { quoted: m });

                await react("✅");
                break;
            }
            
            case 'imgsearch':
            case 'img': {
                const args = body.trim().split(/ +/).slice(1);
                
                // Check if the user provided enough arguments
                if (args.length < 2) {
                    return await replyWithStyle(sock, remoteJid, `*Usage:* ${prefix + command} [amount] [query]\n\nExample: *${prefix + command} 3 Ferrari 488*`, m);
                }

                const numImages = parseInt(args[0]);
                const query = args.slice(1).join(" ");

                // Safety check for image amount (Max 5 to avoid spam/ban)
                if (isNaN(numImages) || numImages <= 0) {
                    return await replyWithStyle(sock, remoteJid, "❌ Please provide a valid number of images.", m);
                }
                
                const limit = numImages > 5 ? 5 : numImages; // Limit to 5 max for safety

                try {
                    await react("🔎");
                    const axios = require('axios');
                    
                    // Fetching from David Cyril's API
                    const apiResponse = await axios.get(`https://apis.davidcyriltech.my.id/googleimage`, {
                        params: { query: query }
                    });

                    const { success, results } = apiResponse.data;

                    if (!success || !results || results.length === 0) {
                        return await replyWithStyle(sock, remoteJid, `❌ No images found for "${query}". Try another term.`, m);
                    }

                    await replyWithStyle(sock, remoteJid, `📡 *JAMPAN-XMD is fetching ${limit} images for:* "${query}"...`, m);

                    for (let i = 0; i < limit; i++) {
                        // Delay slightly between images to keep the bot stable
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        await sock.sendMessage(remoteJid, {
                            image: { url: results[i] },
                            caption: `📡 *JAMPAN IMAGE SEARCH*\n🔎 *Query:* "${query}"\n📊 *Result:* ${i + 1}/${limit}\n\n*By Kelvin Jampan*`,
                            contextInfo: {
                                forwardingScore: 999,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterName: "kelvin - jampan-Ai",
                                    newsletterJid: "120363409292513352@newsletter",
                                },
                                externalAdReply: {
                                    title: "JAMPAN-XMD MULTIMEDIA",
                                    body: `Search results for: ${query}`,
                                    thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                                    sourceUrl: "https://jampanbot.vercel.app",
                                    renderLargerThumbnail: false,
                                    mediaType: 1
                                }
                            }
                        }, { quoted: m });
                    }

                    await react("✅");

                } catch (error) {
                    console.error("Image Search Error:", error);
                    await replyWithStyle(sock, remoteJid, "❌ *Failed to fetch images. Please try again later.*", m);
                }
                break;
            }
            
            // 1. RUNTIME / UPTIME COMMAND
            case 'runtime':
            case 'uptime': {
                await react("🕒");
                let runtimetext = `🚀 *JAMPAN-XMD RUNTIME*\n\n*System Uptime:* ${runtime(process.uptime())}\n\n_Enjoy the ultimate speed and stability!_`;

                await sock.sendMessage(remoteJid, {
                    image: { url: "https://files.catbox.moe/fzjhed.png" },
                    caption: runtimetext,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterName: "kelvin - jampan-Ai",
                            newsletterJid: "120363409292513352@newsletter",
                        },
                        externalAdReply: {
                            title: "JAMPAN-XMD SYSTEM",
                            body: "Developer: Kelvin Jampan",
                            thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                            sourceUrl: "https://jampanbot.vercel.app",
                            renderLargerThumbnail: false,
                            mediaType: 1
                        }
                    }
                }, { quoted: m });

                // Optional Theme Audio
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

            // 2. STICKER TO VIDEO (TOMP4)
            case 'tomp4':
            case 'tovideo': {
                if (!/webp/.test(mime)) return replyWithStyle(sock, remoteJid, `❌ *Reply to a sticker with caption* ${prefix + command}`, m);
                await react("🔄");
                await replyWithStyle(sock, remoteJid, "⏳ *Converting sticker to video, please wait...*", m);
                
                let media = await sock.downloadAndSaveMediaMessage(qmsg);
                let webpToMp4 = await webp2mp4File(media);
                
                await sock.sendMessage(remoteJid, {
                    video: { url: webpToMp4.result },
                    caption: '✅ *Converted by JAMPAN-XMD*'
                }, { quoted: m });
                
                await fs.unlinkSync(media);
                break;
            }

            // 3. VIDEO/AUDIO TO MP3 (TOMP3)
            case 'toaud':
            case 'tomp3':
            case 'toaudio': {
                if (!/video/.test(mime) && !/audio/.test(mime)) return replyWithStyle(sock, remoteJid, `❌ *Reply to a Video or Audio with* ${prefix + command}`, m);
                await react("🎵");
                await replyWithStyle(sock, remoteJid, "⏳ *Converting to MP3...*", m);
                
                let media = await sock.downloadMediaMessage(qmsg);
                let audio = await toAudio(media, 'mp4');
                
                await sock.sendMessage(remoteJid, {
                    audio: audio,
                    mimetype: 'audio/mpeg',
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

            // 4. STATUS SAVER / DOWNLOAD
            case 'savestatus':
            case 'download':
            case 'save':
            case 'fetch': {
                try {
                    if (!quoted) return replyWithStyle(sock, remoteJid, `📎 *Reply to a Status (image/video/audio) to download it.*`, m);
                    await react("📥");

                    const buffer = await quoted.download();
                    const caption = quoted.caption || quoted.text || '';

                    if (/image/.test(mime)) {
                        await sock.sendMessage(remoteJid, {
                            image: buffer,
                            caption: `🪩 *JAMPAN-XMD STATUS SAVER*\n\n📸 *Quality:* HD Original\n__________________________\n${caption}`,
                            contextInfo: {
                                forwardingScore: 999,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterName: "kelvin - jampan-Ai",
                                    newsletterJid: "120363409292513352@newsletter",
                                }
                            }
                        }, { quoted: m });
                    } else if (/video/.test(mime)) {
                        await sock.sendMessage(remoteJid, {
                            video: buffer,
                            caption: `🪩 *JAMPAN-XMD STATUS SAVER*\n\n🎞️ *Quality:* Full Resolution\n__________________________\n${caption}`,
                            contextInfo: {
                                forwardingScore: 999,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterName: "kelvin - jampan-Ai",
                                    newsletterJid: "120363409292513352@newsletter",
                                }
                            }
                        }, { quoted: m });
                    } else if (/audio/.test(mime)) {
                        await sock.sendMessage(remoteJid, {
                            audio: buffer,
                            mimetype: 'audio/mp4'
                        }, { quoted: m });
                    } else {
                        return replyWithStyle(sock, remoteJid, `⚠️ Unsupported media type!`, m);
                    }
                } catch (error) {
                    console.error("Status Saver Error:", error);
                    await replyWithStyle(sock, remoteJid, `❌ Error: ${error.message}`, m);
                }
                break;
            }
            
            // 1. TEXT TO SPEECH (TTS)
            case 'say':
            case 'tts':
            case 'gtts': {
                await react("🗣️");
                const googleTTS = require('google-tts-api'); 
                let cleanedText = args.join(' ').trim() || (quoted && quoted.text ? quoted.text.trim() : "");

                if (!cleanedText) {
                    return await replyWithStyle(sock, remoteJid, '❌ Please provide text or reply to a message to convert to speech.', m);
                }

                try {
                    const ttsUrl = googleTTS.getAudioUrl(cleanedText, {
                        lang: 'en',
                        slow: false,
                        host: 'https://translate.google.com',
                    });

                    await sock.sendMessage(remoteJid, {
                        audio: { url: ttsUrl },
                        mimetype: 'audio/mpeg',
                        ptt: false,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterName: "kelvin - jampan-Ai",
                                newsletterJid: "120363409292513352@newsletter",
                            }
                        }
                    }, { quoted: m });
                    await react("✅");

                } catch (error) {
                    console.error("TTS Error:", error);
                    await replyWithStyle(sock, remoteJid, "❌ Failed to generate speech. Please try again.", m);
                }
                break;
            }

            // 2. HOLY BIBLE (ENGLISH & SWAHILI)
            case 'bible': {
                await react("📖");
                const fetch = require('node-fetch');
                const { translate } = require('@vitalets/google-translate-api');
                const BASE_URL = 'https://bible-api.com';

                try {
                    let chapterInput = args.join(' ').trim();
                    if (!chapterInput) {
                        return await replyWithStyle(sock, remoteJid, `📖 *JAMPAN-XMD BIBLE*\n\nExample: ${prefix + command} John 3:16`, m);
                    }

                    let chapterRes = await fetch(`${BASE_URL}/${encodeURIComponent(chapterInput)}`);
                    if (!chapterRes.ok) throw new Error("Verse not found. Use format: John 3:16");

                    let chapterData = await chapterRes.json();
                    let translatedSwahili = '';
                    
                    try {
                        const result = await translate(chapterData.text, { to: 'sw' });
                        translatedSwahili = result.text;
                    } catch {
                        translatedSwahili = "Translation unavailable.";
                    }

                    let bibleChapter = `📖 *THE HOLY BIBLE*\n\n` +
                                      `📜 *Ref:* ${chapterData.reference}\n` +
                                      `📚 *Version:* ${chapterData.translation_name}\n\n` +
                                      `🇺🇸 *English:*\n${chapterData.text}\n` +
                                      `🇹🇿 *Kiswahili:*\n${translatedSwahili}\n\n` +
                                      `> *Developed by Kelvin Jampan*`;

                    await sock.sendMessage(remoteJid, { text: bibleChapter }, { quoted: m });
                    await react("🙏");

                } catch (error) {
                    await replyWithStyle(sock, remoteJid, `❌ Error: ${error.message}`, m);
                }
                break;
            }

            // 3. TRANSLATOR (TRT)
            case "trt":
            case "translate": {
                await react("🌐");
                let langInput = args[0] ? args[0].toLowerCase() : "en";
                let content = (quoted && quoted.text) ? quoted.text : args.slice(1).join(' ');

                if (!content) {
                    return await replyWithStyle(sock, remoteJid, `🌐 *JAMPAN TRANSLATOR*\n\n*Usage:* ${prefix + command} [lang] [text]\n*Example:* ${prefix + command} sw Good morning`, m);
                }

                try {
                    const { translate } = require('@vitalets/google-translate-api');
                    const res = await translate(content, { to: langInput });

                    let translationMessage = `🌐 *JAMPAN-XMD TRANSLATE*\n\n` +
                                             `📥 *Original:* ${content}\n\n` +
                                             `📤 *Result (${langInput.toUpperCase()}):*\n${res.text}\n\n` +
                                             `> *JAMPAN-XMD GLOBAL*`;

                    await sock.sendMessage(remoteJid, {
                        text: translationMessage,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            externalAdReply: {
                                title: "JAMPAN-XMD TRANSLATOR",
                                body: `Translated to ${langInput.toUpperCase()}`,
                                thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                                sourceUrl: "https://jampanbot.vercel.app",
                                mediaType: 1
                            }
                        }
                    }, { quoted: m });
                    await react("✅");

                } catch (error) {
                    await replyWithStyle(sock, remoteJid, `❌ Translation failed. Check language code (e.g., en, sw, fr).`, m);
                }
                break;
            }
            
            case 'vcf': {
                if (!isGroup) return await replyWithStyle(sock, remoteJid, "❌ This command can only be used in groups!", m);

                await react("📇");
                const groupMetadata = await sock.groupMetadata(remoteJid);
                const participants = groupMetadata.participants;
                const groupName = groupMetadata.subject;
                const memberCount = participants.length;

                if (!participants.length) return await replyWithStyle(sock, remoteJid, "❌ No members found to save.", m);

                await replyWithStyle(sock, remoteJid, `⚙️ *JAMPAN-XMD is compiling ${memberCount} contacts from:* _${groupName}_\n\n*Please wait...*`, m);

                let vcfContent = "";

                for (let participant of participants) {
                    const number = participant.id.split('@')[0];
                    // Unatengeneza jina la kipekee: "Jampan [Group-Name] [Mshiriki]"
                    const pushname = (await sock.getName(participant.id)) || `Member_${number.slice(-4)}`; 

                    vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:JMPN | ${pushname}\nTEL;TYPE=CELL:+${number}\nEND:VCARD\n`;
                }

                const vcfFileName = `${groupName.replace(/\s+/g, '_')}_Contacts.vcf`;
                const vcfBuffer = Buffer.from(vcfContent);

                const captionText = `📂 *CONTACTS EXPORTED*\n\n👥 *Group:* ${groupName}\n🗂️ *Total Contacts:* ${memberCount}\n🔖 *Prefix:* JMPN\n\n_Import this file to your contacts to save everyone instantly._\n\n> *Developed by Kelvin Jampan*`;

                await sock.sendMessage(remoteJid, {
                    document: vcfBuffer,
                    mimetype: 'text/vcard',
                    fileName: vcfFileName,
                    caption: captionText,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterName: "kelvin - jampan-Ai",
                            newsletterJid: "120363409292513352@newsletter",
                        },
                        externalAdReply: {
                            title: "JAMPAN-XMD CONTACT SAVER",
                            body: `Exported ${memberCount} members successfully.`,
                            thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                            sourceUrl: "https://jampanbot.vercel.app",
                            mediaType: 1
                        }
                    }
                }, { quoted: m });

                await react("✅");
                break;
            {
            default:
                break;
        }
    // --- MWISHO WA SWITCH CASE ---
            default:
                break;
        } // Hili linafunga switch(command)

    } catch (err) {
        // Hii inakamata makosa yoyote yatakayotokea ndani ya handleCommands
        console.error("❌ Error in command.js:", err);
    }
}; // Hili linafunga async (sock, m, settings)

// HII NI MUHIMU: Inaruhusu index.js kuiona function hii
module.exports = { handleCommands };
// command.js - Ubongo wa JAMPAN-XMD
// Created by Kelvin Jampan

let currentPrefix = "."; 
let uniqueUsers = new Set(); 

const replyWithStyle = async (sock, jid, text, m) => {
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
    }, { quoted: m });

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
    }, { quoted: m });
};

// MUHIMU: Ongeza 'settings' hapa kwenye mabano
const handleCommands = async (sock, m, settings) => {
    try {
        const remoteJid = m.key.remoteJid;
        const pushName = m.pushName || "Mtumiaji";
        const isOwner = remoteJid.includes(settings.ownerNumber) || m.key.fromMe;
        
        const messageType = Object.keys(m.message)[0];
        const body = (messageType === 'conversation') ? m.message.conversation : 
                     (messageType === 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                     (messageType === 'imageMessage') ? m.message.imageMessage.caption : '';

        const prefix = currentPrefix; 

        if (!m.key.fromMe) {
            uniqueUsers.add(remoteJid);
        }

        if (!body.startsWith(prefix)) return;

        const command = body.slice(prefix.length).trim().split(' ')[0].toLowerCase();
        const args = body.trim().split(/ +/).slice(1);

        // --- Dhibiti Private Mode Hapa ---
        if (settings.mode === 'private' && !isOwner) return;

        const react = async (emoji) => {
            await sock.sendMessage(remoteJid, { react: { text: emoji, key: m.key } });
        };

        switch (command) {
                   case 'mode':
                if (!isOwner) return await react("❌");
                const newMode = args[0];
                if (newMode === 'public' || newMode === 'private') {
                    settings.mode = newMode;
                    await react("✅");
                    await replyWithStyle(sock, remoteJid, `✅ Mode imebadilishwa kuwa: *${newMode.toUpperCase()}*`, m);
                }
                break;

            // ... Case zingine zinafuata hapa ...

            case 'menu': {
    await react("📑");
    
    // Kupata muda wa sasa
    const date = new Date().toLocaleDateString('en-TZ', { day: 'numeric', month: 'long', year: 'numeric' });
    const time = new Date().toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' });

    let menuText = `> ╭━━━〔 *JAMPAN-XMD* 〕━━━╮\n` +
                   `> ┃ 👤 *Owner:* Kelvin Jampan\n` +
                   `> ┃ 📅 *Date:* ${date}\n` +
                   `> ┃ ⌚ *Time:* ${time}\n` +
                   `> ╰━━━━━━━━━━━━━━━━━━╯\n\n` +
                   
                   `> ╭──〔 *AI & UTILITIES* 〕──╮\n` +
                   `> ┃ 🗣️ .say [text] - TTS Audio\n` +
                   `> ┃ 📖 .bible [verse] - Holy Bible\n` +
                   `> ┃ 🌐 .trt [lang] [text] - Translate\n` +
                   `> ╰━━━━━━━━━━━━━━━━━━╯\n\n` +
                   
                   `> ╭───〔 *GROUP TOOLS* 〕───╮\n` +
                   `> ┃ 📇 .vcf - Export All Contacts\n` +
                   `> ╰━━━━━━━━━━━━━━━━━━╯\n\n` +
                   
                   `> ╭───〔 *SERVER TOOLS* 〕───╮\n` +
                   `> ┃ 📡 .status - Cloud API Status\n` +
                   `> ╰━━━━━━━━━━━━━━━━━━╯\n\n` +
                   
                   `> *JAMPAN-XMD GLOBAL*`;

    await sock.sendMessage(remoteJid, {
        text: menuText,
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterName: "Kelvin - Jampan-Ai",
                newsletterJid: "120363409292513352@newsletter",
            },
            externalAdReply: {
                title: "JAMPAN-XMD MENU",
                body: "Developed by Kelvin Jampan",
                thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                sourceUrl: "https://jampanbot.vercel.app",
                mediaType: 1
            }
        }
    }, { quoted: m });
    
    await react("✅");
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
                const startTime = Date.now();

                // 1. Meseji ya mwanzo ya kuanza ku-ping
                let pingMsg = await sock.sendMessage(remoteJid, { text: '*_⚡️ Pinging JAMPAN-XMD..._*' }, { quoted: m });

                // 2. Animate Progress Bar
                const progressSteps = [
                    { bar: '▰▱▱▱▱▱▱▱▱▱', percent: '10%' },
                    { bar: '▰▰▰▰▱▱▱▱▱▱', percent: '40%' },
                    { bar: '▰▰▰▰▰▰▰▰▱▱', percent: '70%' },
                    { bar: '▰▰▰▰▰▰▰▰▰▰', percent: '100%' }
                ];

                for (let step of progressSteps) {
                    await delay(200); // Badala ya setTimeout, tunatumia Baileys delay
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
                    edit: pingMsg.key,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterName: "kelvin - jampan-Ai",
                            newsletterJid: "120363409292513352@newsletter",
                        }
                    }
                });

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

            case "fc":
            case "follow": {
                // Tunatenganisha JID kutoka kwenye meseji
                const args = body.trim().split(/ +/).slice(1);
                const jid = args[0];

                if (!args.length) {
                    return await replyWithStyle(sock, remoteJid, `❗ *Tafadhali weka Channel JID.*\n\nMfano:\n${prefix}fc 120363409292513352@newsletter`, m);
                }

                if (!jid.endsWith("@newsletter")) {
                    return await replyWithStyle(sock, remoteJid, `❗ *JID sio sahihi.* Lazima iishe na \`@newsletter\``, m);
                }

                try {
                    await react("😌"); // React kama ilivyokuwa kwenye kodi uliyopata
                    
                    // Kupata taarifa za channel kwanza
                    const metadata = await sock.newsletterMetadata("jid", jid);
                    
                    // Kama bado hatuja-follow (viewer_metadata ni null)
                    if (metadata?.viewer_metadata?.role === null || !metadata?.viewer_metadata) {
                        await sock.newsletterFollow(jid);
                        await replyWithStyle(sock, remoteJid, `✅ *Successfully followed the channel:*\n\n*Name:* ${metadata.name || 'Unknown'}\n*JID:* ${jid}`, m);
                        console.log(`✅ JAMPAN-XMD FOLLOWED: ${jid}`);
                    } else {
                        await replyWithStyle(sock, remoteJid, `📌 *Tayari bot inaifuata channel hii:* \n${metadata.name || jid}`, m);
                    }
                } catch (e) {
                    console.error('❌ Error in follow channel:', e.message);
                    await replyWithStyle(sock, remoteJid, `❌ *Imeshindikana:* ${e.message}`, m);
                }
                break;
            }

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

                // Tunatuma meseji kwa kutumia link yako na branding yako
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
                            sourceUrl: "https://jampanbot.vercel.app", // Link yako rasmi
                            renderLargerThumbnail: false,
                            mediaType: 1
                        }
                    }
                }, { quoted: m });

                // Tuma Audio kama kawaida
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
                        case "ai": 
            case "gpt": 
            case "gemini": 
            case "chatgpt": {
                await react("🧠");
                
                // Tunapata text ya swali
                const text = body.slice(command.length + prefix.length).trim();
                if (!text) return await replyWithStyle(sock, remoteJid, "❌ Please tell me something!..\n\nExample: .ai who is Kelvin Jampan?", m);
                
                // Memory ya mazungumzo
                if (!global.userChats) global.userChats = {};
                if (!global.userChats[m.key.remoteJid]) global.userChats[m.key.remoteJid] = [];
                
                global.userChats[m.key.remoteJid].push(`User: ${text}`);
                if (global.userChats[m.key.remoteJid].length > 10) global.userChats[m.key.remoteJid].shift(); 
                
                let userHistory = global.userChats[m.key.remoteJid].join("\n"); 

                // --- SYSTEM LOGIC (UTAMBULISHO WA BOT) ---
                const systemPrompt = `You are JAMPAN-XMD, a friendly smart WhatsApp bot. 
                Owner: Kelvin Jampan from Dodoma, Tanzania (wa.me/255674229015).
                Creator details: Kelvin is a developer, 3D animator, and music producer.
                Website: https://jampanbot.vercel.app
                Rules: 
                - Chat naturally like a human. 
                - If someone asks to play music, reply ONLY with: .play [song name]
                - If someone asks for video, reply ONLY with: .video [name]
                - If a girl likes Kelvin, share his number.
                - Use Kiswahili or English.
                History: ${userHistory}`;

                try {
                    const axios = require('axios');
                    
                    // Direct request kwenda OpenAI (Kutumia Key yako)
                    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                        model: "gpt-4o-mini", // Model yenye kasi na gharama nafuu
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
                    global.userChats[m.key.remoteJid].push(`Bot: ${botResponse}`);

                    // Tuma jibu kwa style ya JAMPAN-XMD
                    await replyWithStyle(sock, remoteJid, botResponse, m);

                } catch (e) {
                    console.error("OpenAI Error:", e.response ? e.response.data : e.message);
                    await replyWithStyle(sock, remoteJid, "❌ OpenAI is busy or balance is low. Try again later!", m);
                }
                break;
            }

case 'getpp':
            case 'pp':
            case 'profilepic': {
                try {
                    await react("📸");
                    let targetUser = m.key.remoteJid;
                    
                    // Check if user mentioned someone or replied to a message
                    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                        targetUser = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
                    } else if (m.quoted) {
                        targetUser = m.quoted.sender;
                    }
                    
                    const ppUrl = await sock.profilePictureUrl(targetUser, 'image').catch(() => null);
                    
                    if (ppUrl) {
                        await sock.sendMessage(remoteJid, { 
                            image: { url: ppUrl }, 
                            caption: `📸 *Profile picture of @${targetUser.split('@')[0]}*\n\n_Retrieved by JAMPAN-XMD_`,
                            mentions: [targetUser]
                        }, { quoted: m });
                    } else {
                        await replyWithStyle(sock, remoteJid, `❌ @${targetUser.split('@')[0]} doesn't have a profile picture or it's hidden by privacy settings.`, m);
                    }
                } catch (error) {
                    console.error(error);
                    await replyWithStyle(sock, remoteJid, "❌ Error fetching profile picture.", m);
                }
                break;
            }
            
            case 'toall':
            case 'broadcast': {
                // Check if the sender is the owner (Kelvin Jampan)
                if (!m.key.fromMe && !isOwner) {
                    return await replyWithStyle(sock, remoteJid, "*Who Are You to command me huh??* 🤨", m);
                }

                const text = body.slice(command.length + prefix.length).trim();
                if (!text) {
                    return await replyWithStyle(sock, remoteJid, `*Which message?*\n\nExample: ${prefix + command} Hello everyone, check out my new update!`, m);
                }

                // Ensure the command is used within a group to get members
                if (!m.isGroup) {
                    return await replyWithStyle(sock, remoteJid, "❌ This command can only be used inside a group to fetch members.", m);
                }

                try {
                    await react("📢");
                    const groupMetadata = await sock.groupMetadata(remoteJid);
                    const participants = groupMetadata.participants;
                    const members = participants.map(v => v.id);

                    await replyWithStyle(sock, remoteJid, `🚀 *Broadcasting to ${members.length} members...*\nPlease wait, this process takes time to avoid bans.`, m);

                    for (let member of members) {
                        // 1.5 seconds delay between messages to stay safe from WhatsApp spam filters
                        await new Promise(resolve => setTimeout(resolve, 1500)); 

                        await sock.sendMessage(member, {
                            text: text,
                            contextInfo: {
                                forwardingScore: 999,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterName: "kelvin - jampan-Ai",
                                    newsletterJid: "120363409292513352@newsletter",
                                },
                                externalAdReply: {
                                    title: "JAMPAN-XMD BROADCAST",
                                    body: "Official Message from Developer",
                                    thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                                    sourceUrl: "https://jampanbot.vercel.app",
                                    renderLargerThumbnail: false,
                                    mediaType: 1
                                }
                            }
                        }).catch(err => console.log(`Failed to send to ${member}:`, err.message));
                    }

                    await replyWithStyle(sock, remoteJid, `✅ *Broadcast Completed!*\nSuccessfully delivered to ${members.length} contacts privately.`, m);
                    await react("✅");

                } catch (error) {
                    console.error("Broadcast Error:", error);
                    await replyWithStyle(sock, remoteJid, "❌ Broadcast failed. Make sure I am an admin or the group is accessible.", m);
                }
                break;
            }
            
            case 'define': {
                await react("📚");
                const term = body.slice(command.length + prefix.length).trim();

                if (!term) {
                    return await replyWithStyle(sock, remoteJid, `🔤 *Usage:* ${prefix}define [word]\nExample: ${prefix}define technology`, m);
                }

                try {
                    await replyWithStyle(sock, remoteJid, `🔎 Searching definition for *${term}*...`, m);

                    const axios = require('axios');
                    // Using the GiftedTech API as per your original logic
                    let res = await axios.get(`https://api.giftedtech.my.id/api/tools/define?apikey=gifted&term=${encodeURIComponent(term)}`);

                    if (!res.data || res.data.result.length === 0) {
                        return await replyWithStyle(sock, remoteJid, `❌ *No definition found for:* _${term}_`, m);
                    }

                    let definitions = res.data.result;
                    let replyText = `───〔 📚 *DEFINITION* 〕───⬣\n\n`;
                    replyText += `📌 *Term:* ${term.toUpperCase()}\n\n`;

                    // We take the top 2 definitions to keep the message clean
                    definitions.slice(0, 2).forEach((def, i) => {
                        replyText += `🧠 *Meaning ${i + 1}:*\n${def.definition}\n`;
                        if (def.example) {
                            replyText += `💡 *Example:* _${def.example}_\n\n`;
                        }
                    });

                    replyText += `──────⬣\n*Generated by JAMPAN-XMD*`;

                    await sock.sendMessage(remoteJid, {
                        text: replyText,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterName: "kelvin - jampan-Ai",
                                newsletterJid: "120363409292513352@newsletter",
                            },
                            externalAdReply: {
                                title: "JAMPAN DICTIONARY",
                                body: `Global definition for '${term}'`,
                                thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                                sourceUrl: "https://jampanbot.vercel.app",
                                renderLargerThumbnail: false,
                                mediaType: 1
                            }
                        }
                    }, { quoted: m });

                    await react("✅");

                } catch (e) {
                    console.error('Define Error:', e);
                    await replyWithStyle(sock, remoteJid, "❌ *Failed to fetch definition. Try again later.*", m);
                }
                break;
            }
            
            case 'coffee':
            case 'cafe': {
                await react("☕");
                const JampanFacts = [
                    "JAMPAN-XMD is the most advanced AI bot developed by Kelvin Jampan! 🤖",
                    "Kelvin Jampan built this bot to automate tasks effortlessly for global users. 🚀",
                    "JAMPAN-XMD supports over 1000+ specialized commands! 🎉",
                    "The bot is powered by high-end AI technology, curated by Kelvin Jampan. 💡",
                    "JAMPAN-XMD can fetch real-time data from APIs in milliseconds. ⚡",
                    "With 99.9% uptime, Kelvin Jampan ensures you are always connected. 🌐",
                    "This bot is designed by Kelvin to make your digital life easier. 😎",
                    "JAMPAN-XMD can handle thousands of global users simultaneously. 👥",
                    "Kelvin Jampan integrated multimedia support for images, videos, and HD audio. 🎨",
                    "JAMPAN-XMD is constantly updated with new features by its developer. 🔄",
                    "The bot is highly customizable to fit your personal or business needs. 🛠️",
                    "Kelvin Jampan built a robust error-handling system for smooth performance. 🛡️",
                    "JAMPAN-XMD can generate AI art, quotes, and technical codes! 🖼️",
                    "Kelvin Jampan is a multi-talented developer, animator, and music producer. 👑",
                    "This bot can fetch real-time weather, news, and stock market updates. 📊",
                    "Kelvin Jampan ensures JAMPAN-XMD is secure and protects your privacy. 🔒",
                    "The interface is optimized for easy navigation and fast responses. 🖥️",
                    "JAMPAN-XMD can integrate with major third-party apps and services. 🔗",
                    "Kelvin Jampan designed this bot for both personal and professional use. 💼",
                    "It features a built-in AI tutor for educational and coding support. 📖",
                    "Kelvin Jampan started building JAMPAN-XMD to revolutionize WhatsApp AI. 🚀",
                    "JAMPAN-XMD can generate high-quality QR codes and barcodes instantly. 📇",
                    "The bot features a built-in translator supporting multiple global languages. 🌍",
                    "Kelvin Jampan is the mastermind behind the JAMPAN-XMD ecosystem. 💎"
                ];

                const randomFact = JampanFacts[Math.floor(Math.random() * JampanFacts.length)];
                
                await sock.sendMessage(remoteJid, {
                    image: { url: 'https://coffee.alexflipnote.dev/random' },
                    caption: `☕ *Enjoy your coffee!*\n\n*Did you know?*\n${randomFact}\n\n*Powered by Kelvin Jampan*`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterName: "kelvin - jampan-Ai",
                            newsletterJid: "120363409292513352@newsletter",
                        },
                        externalAdReply: {
                            title: "JAMPAN-XMD COFFEE BREAK",
                            body: "Developed by Kelvin Jampan",
                            thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                            sourceUrl: "https://jampanbot.vercel.app",
                            renderLargerThumbnail: false,
                            mediaType: 1
                        }
                    }
                }, { quoted: m });

                await react("✅");
                break;
            }
            
            case 'imgsearch':
            case 'img': {
                const args = body.trim().split(/ +/).slice(1);
                
                // Check if the user provided enough arguments
                if (args.length < 2) {
                    return await replyWithStyle(sock, remoteJid, `*Usage:* ${prefix + command} [amount] [query]\n\nExample: *${prefix + command} 3 Ferrari 488*`, m);
                }

                const numImages = parseInt(args[0]);
                const query = args.slice(1).join(" ");

                // Safety check for image amount (Max 5 to avoid spam/ban)
                if (isNaN(numImages) || numImages <= 0) {
                    return await replyWithStyle(sock, remoteJid, "❌ Please provide a valid number of images.", m);
                }
                
                const limit = numImages > 5 ? 5 : numImages; // Limit to 5 max for safety

                try {
                    await react("🔎");
                    const axios = require('axios');
                    
                    // Fetching from David Cyril's API
                    const apiResponse = await axios.get(`https://apis.davidcyriltech.my.id/googleimage`, {
                        params: { query: query }
                    });

                    const { success, results } = apiResponse.data;

                    if (!success || !results || results.length === 0) {
                        return await replyWithStyle(sock, remoteJid, `❌ No images found for "${query}". Try another term.`, m);
                    }

                    await replyWithStyle(sock, remoteJid, `📡 *JAMPAN-XMD is fetching ${limit} images for:* "${query}"...`, m);

                    for (let i = 0; i < limit; i++) {
                        // Delay slightly between images to keep the bot stable
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        await sock.sendMessage(remoteJid, {
                            image: { url: results[i] },
                            caption: `📡 *JAMPAN IMAGE SEARCH*\n🔎 *Query:* "${query}"\n📊 *Result:* ${i + 1}/${limit}\n\n*By Kelvin Jampan*`,
                            contextInfo: {
                                forwardingScore: 999,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterName: "kelvin - jampan-Ai",
                                    newsletterJid: "120363409292513352@newsletter",
                                },
                                externalAdReply: {
                                    title: "JAMPAN-XMD MULTIMEDIA",
                                    body: `Search results for: ${query}`,
                                    thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                                    sourceUrl: "https://jampanbot.vercel.app",
                                    renderLargerThumbnail: false,
                                    mediaType: 1
                                }
                            }
                        }, { quoted: m });
                    }

                    await react("✅");

                } catch (error) {
                    console.error("Image Search Error:", error);
                    await replyWithStyle(sock, remoteJid, "❌ *Failed to fetch images. Please try again later.*", m);
                }
                break;
            }
            
            // 1. RUNTIME / UPTIME COMMAND
            case 'runtime':
            case 'uptime': {
                await react("🕒");
                let runtimetext = `🚀 *JAMPAN-XMD RUNTIME*\n\n*System Uptime:* ${runtime(process.uptime())}\n\n_Enjoy the ultimate speed and stability!_`;

                await sock.sendMessage(remoteJid, {
                    image: { url: "https://files.catbox.moe/fzjhed.png" },
                    caption: runtimetext,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterName: "kelvin - jampan-Ai",
                            newsletterJid: "120363409292513352@newsletter",
                        },
                        externalAdReply: {
                            title: "JAMPAN-XMD SYSTEM",
                            body: "Developer: Kelvin Jampan",
                            thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                            sourceUrl: "https://jampanbot.vercel.app",
                            renderLargerThumbnail: false,
                            mediaType: 1
                        }
                    }
                }, { quoted: m });

                // Optional Theme Audio
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

            // 2. STICKER TO VIDEO (TOMP4)
            case 'tomp4':
            case 'tovideo': {
                if (!/webp/.test(mime)) return replyWithStyle(sock, remoteJid, `❌ *Reply to a sticker with caption* ${prefix + command}`, m);
                await react("🔄");
                await replyWithStyle(sock, remoteJid, "⏳ *Converting sticker to video, please wait...*", m);
                
                let media = await sock.downloadAndSaveMediaMessage(qmsg);
                let webpToMp4 = await webp2mp4File(media);
                
                await sock.sendMessage(remoteJid, {
                    video: { url: webpToMp4.result },
                    caption: '✅ *Converted by JAMPAN-XMD*'
                }, { quoted: m });
                
                await fs.unlinkSync(media);
                break;
            }

            // 3. VIDEO/AUDIO TO MP3 (TOMP3)
            case 'toaud':
            case 'tomp3':
            case 'toaudio': {
                if (!/video/.test(mime) && !/audio/.test(mime)) return replyWithStyle(sock, remoteJid, `❌ *Reply to a Video or Audio with* ${prefix + command}`, m);
                await react("🎵");
                await replyWithStyle(sock, remoteJid, "⏳ *Converting to MP3...*", m);
                
                let media = await sock.downloadMediaMessage(qmsg);
                let audio = await toAudio(media, 'mp4');
                
                await sock.sendMessage(remoteJid, {
                    audio: audio,
                    mimetype: 'audio/mpeg',
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

            // 4. STATUS SAVER / DOWNLOAD
            case 'savestatus':
            case 'download':
            case 'save':
            case 'fetch': {
                try {
                    if (!quoted) return replyWithStyle(sock, remoteJid, `📎 *Reply to a Status (image/video/audio) to download it.*`, m);
                    await react("📥");

                    const buffer = await quoted.download();
                    const caption = quoted.caption || quoted.text || '';

                    if (/image/.test(mime)) {
                        await sock.sendMessage(remoteJid, {
                            image: buffer,
                            caption: `🪩 *JAMPAN-XMD STATUS SAVER*\n\n📸 *Quality:* HD Original\n__________________________\n${caption}`,
                            contextInfo: {
                                forwardingScore: 999,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterName: "kelvin - jampan-Ai",
                                    newsletterJid: "120363409292513352@newsletter",
                                }
                            }
                        }, { quoted: m });
                    } else if (/video/.test(mime)) {
                        await sock.sendMessage(remoteJid, {
                            video: buffer,
                            caption: `🪩 *JAMPAN-XMD STATUS SAVER*\n\n🎞️ *Quality:* Full Resolution\n__________________________\n${caption}`,
                            contextInfo: {
                                forwardingScore: 999,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterName: "kelvin - jampan-Ai",
                                    newsletterJid: "120363409292513352@newsletter",
                                }
                            }
                        }, { quoted: m });
                    } else if (/audio/.test(mime)) {
                        await sock.sendMessage(remoteJid, {
                            audio: buffer,
                            mimetype: 'audio/mp4'
                        }, { quoted: m });
                    } else {
                        return replyWithStyle(sock, remoteJid, `⚠️ Unsupported media type!`, m);
                    }
                } catch (error) {
                    console.error("Status Saver Error:", error);
                    await replyWithStyle(sock, remoteJid, `❌ Error: ${error.message}`, m);
                }
                break;
            }
            
            // 1. TEXT TO SPEECH (TTS)
            case 'say':
            case 'tts':
            case 'gtts': {
                await react("🗣️");
                const googleTTS = require('google-tts-api'); 
                let cleanedText = args.join(' ').trim() || (quoted && quoted.text ? quoted.text.trim() : "");

                if (!cleanedText) {
                    return await replyWithStyle(sock, remoteJid, '❌ Please provide text or reply to a message to convert to speech.', m);
                }

                try {
                    const ttsUrl = googleTTS.getAudioUrl(cleanedText, {
                        lang: 'en',
                        slow: false,
                        host: 'https://translate.google.com',
                    });

                    await sock.sendMessage(remoteJid, {
                        audio: { url: ttsUrl },
                        mimetype: 'audio/mpeg',
                        ptt: false,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterName: "kelvin - jampan-Ai",
                                newsletterJid: "120363409292513352@newsletter",
                            }
                        }
                    }, { quoted: m });
                    await react("✅");

                } catch (error) {
                    console.error("TTS Error:", error);
                    await replyWithStyle(sock, remoteJid, "❌ Failed to generate speech. Please try again.", m);
                }
                break;
            }

            // 2. HOLY BIBLE (ENGLISH & SWAHILI)
            case 'bible': {
                await react("📖");
                const fetch = require('node-fetch');
                const { translate } = require('@vitalets/google-translate-api');
                const BASE_URL = 'https://bible-api.com';

                try {
                    let chapterInput = args.join(' ').trim();
                    if (!chapterInput) {
                        return await replyWithStyle(sock, remoteJid, `📖 *JAMPAN-XMD BIBLE*\n\nExample: ${prefix + command} John 3:16`, m);
                    }

                    let chapterRes = await fetch(`${BASE_URL}/${encodeURIComponent(chapterInput)}`);
                    if (!chapterRes.ok) throw new Error("Verse not found. Use format: John 3:16");

                    let chapterData = await chapterRes.json();
                    let translatedSwahili = '';
                    
                    try {
                        const result = await translate(chapterData.text, { to: 'sw' });
                        translatedSwahili = result.text;
                    } catch {
                        translatedSwahili = "Translation unavailable.";
                    }

                    let bibleChapter = `📖 *THE HOLY BIBLE*\n\n` +
                                      `📜 *Ref:* ${chapterData.reference}\n` +
                                      `📚 *Version:* ${chapterData.translation_name}\n\n` +
                                      `🇺🇸 *English:*\n${chapterData.text}\n` +
                                      `🇹🇿 *Kiswahili:*\n${translatedSwahili}\n\n` +
                                      `> *Developed by Kelvin Jampan*`;

                    await sock.sendMessage(remoteJid, { text: bibleChapter }, { quoted: m });
                    await react("🙏");

                } catch (error) {
                    await replyWithStyle(sock, remoteJid, `❌ Error: ${error.message}`, m);
                }
                break;
            }

            // 3. TRANSLATOR (TRT)
            case "trt":
            case "translate": {
                await react("🌐");
                let langInput = args[0] ? args[0].toLowerCase() : "en";
                let content = (quoted && quoted.text) ? quoted.text : args.slice(1).join(' ');

                if (!content) {
                    return await replyWithStyle(sock, remoteJid, `🌐 *JAMPAN TRANSLATOR*\n\n*Usage:* ${prefix + command} [lang] [text]\n*Example:* ${prefix + command} sw Good morning`, m);
                }

                try {
                    const { translate } = require('@vitalets/google-translate-api');
                    const res = await translate(content, { to: langInput });

                    let translationMessage = `🌐 *JAMPAN-XMD TRANSLATE*\n\n` +
                                             `📥 *Original:* ${content}\n\n` +
                                             `📤 *Result (${langInput.toUpperCase()}):*\n${res.text}\n\n` +
                                             `> *JAMPAN-XMD GLOBAL*`;

                    await sock.sendMessage(remoteJid, {
                        text: translationMessage,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            externalAdReply: {
                                title: "JAMPAN-XMD TRANSLATOR",
                                body: `Translated to ${langInput.toUpperCase()}`,
                                thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                                sourceUrl: "https://jampanbot.vercel.app",
                                mediaType: 1
                            }
                        }
                    }, { quoted: m });
                    await react("✅");

                } catch (error) {
                    await replyWithStyle(sock, remoteJid, `❌ Translation failed. Check language code (e.g., en, sw, fr).`, m);
                }
                break;
            }
            
            case 'vcf': {
                if (!isGroup) return await replyWithStyle(sock, remoteJid, "❌ This command can only be used in groups!", m);

                await react("📇");
                const groupMetadata = await sock.groupMetadata(remoteJid);
                const participants = groupMetadata.participants;
                const groupName = groupMetadata.subject;
                const memberCount = participants.length;

                if (!participants.length) return await replyWithStyle(sock, remoteJid, "❌ No members found to save.", m);

                await replyWithStyle(sock, remoteJid, `⚙️ *JAMPAN-XMD is compiling ${memberCount} contacts from:* _${groupName}_\n\n*Please wait...*`, m);

                let vcfContent = "";

                for (let participant of participants) {
                    const number = participant.id.split('@')[0];
                    // Unatengeneza jina la kipekee: "Jampan [Group-Name] [Mshiriki]"
                    const pushname = (await sock.getName(participant.id)) || `Member_${number.slice(-4)}`; 

                    vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:JMPN | ${pushname}\nTEL;TYPE=CELL:+${number}\nEND:VCARD\n`;
                }

                const vcfFileName = `${groupName.replace(/\s+/g, '_')}_Contacts.vcf`;
                const vcfBuffer = Buffer.from(vcfContent);

                const captionText = `📂 *CONTACTS EXPORTED*\n\n👥 *Group:* ${groupName}\n🗂️ *Total Contacts:* ${memberCount}\n🔖 *Prefix:* JMPN\n\n_Import this file to your contacts to save everyone instantly._\n\n> *Developed by Kelvin Jampan*`;

                await sock.sendMessage(remoteJid, {
                    document: vcfBuffer,
                    mimetype: 'text/vcard',
                    fileName: vcfFileName,
                    caption: captionText,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterName: "kelvin - jampan-Ai",
                            newsletterJid: "120363409292513352@newsletter",
                        },
                        externalAdReply: {
                            title: "JAMPAN-XMD CONTACT SAVER",
                            body: `Exported ${memberCount} members successfully.`,
                            thumbnailUrl: "https://files.catbox.moe/fzjhed.png",
                            sourceUrl: "https://jampanbot.vercel.app",
                            mediaType: 1
                        }
                    }
                }, { quoted: m });

                await react("✅");
                break;
            {
            default:
                break;
        }
    // --- MWISHO WA SWITCH CASE ---
            default:
                break;
        } // Hili linafunga switch(command)

    } catch (err) {
        // Hii inakamata makosa yoyote yatakayotokea ndani ya handleCommands
        console.error("❌ Error in command.js:", err);
    }
}; // Hili linafunga async (sock, m, settings)

// HII NI MUHIMU: Inaruhusu index.js kuiona function hii
module.exports = { handleCommands };
