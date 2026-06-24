const { proto, getContentType, makeCacheableSignalKeyStore, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const makeWASocket = require('@whiskeysockets/baileys').default;
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const axios = require('axios');
const pino = require('pino');
const { smsg, getGroupAdmins, formatp, taggz } = require('./lib/myfunc');
const config = require('./config');

const prefix = config.PREFIX || '.';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ================================
// RUNTIME FORMATTER
// ================================
const runtime = (seconds) => {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return (
        (d > 0 ? d + 'd ' : '') +
        (h > 0 ? h + 'h ' : '') +
        (m > 0 ? m + 'm ' : '') +
        s + 's'
    );
};

// ================================
// STYLED REPLY (MODERN & FORWARDED)
// ================================
const replyWithStyle = async (sock, jid, text, m) => {
    try {
        await sock.sendMessage(
            jid,
            {
                text: text,
                contextInfo: {
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363409292513352@newsletter',
                        serverMessageId: 144,
                        newsletterName: 'JAMPAN-XMD OFFICIAL 🚀'
                    },
                    externalAdReply: {
                        title: '🚀 JAMPAN-XMD V3',
                        body: 'Kelvin Jampan | Dev Tech',
                        thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                        sourceUrl: 'https://youtube.com/@jampani-xmd?si=oLPtRqYf1h1ygSzt',
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        showAdAttribution: true
                    }
                }
            },
            { quoted: m }
        );
    } catch (e) {
        console.log('Reply Error:', e.message);
    }
};

// ================================
// MAIN COMMAND HANDLER
// ================================
const handleCommands = async (sock, m, settings) => {
    try {
        if (!m || !m.message) return;

        const remoteJid = m.key.remoteJid || '';
        const sender = m.key.participant || remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');
        const isOwner = sender.includes(settings.ownerNumber) || m.key.fromMe;
        const from = remoteJid;

        // --- FETCH ADMINS IF GROUP ---
        let groupAdmins = [];
        let isAdmin = false;
        if (isGroup) {
            try {
                const groupMetadata = await sock.groupMetadata(remoteJid);
                groupAdmins = groupMetadata.participants.filter(v => v.admin !== null).map(v => v.id);
                isAdmin = groupAdmins.includes(sender);
            } catch (e) {
                groupAdmins = [];
                isAdmin = false;
            }
        }

        // --- MESSAGE TYPE & BODY ---
        const messageType = Object.keys(m.message)[0];
        let body = '';
        if (messageType === 'conversation') body = m.message.conversation;
        else if (messageType === 'extendedTextMessage') body = m.message.extendedTextMessage.text;
        else if (messageType === 'imageMessage') body = m.message.imageMessage.caption;
        else if (messageType === 'videoMessage') body = m.message.videoMessage.caption;

        if (!body) return;

        // --- FUNCTION REACT ---
        const react = async (emoji) => {
            try {
                await sock.sendMessage(remoteJid, {
                    react: { text: emoji, key: m.key }
                });
            } catch (err) {
                console.log('Reaction Error:', err.message);
            }
        };

        // --- AUTO PRESENCE ---
        if (settings.autoTyping) await sock.sendPresenceUpdate('composing', remoteJid);
        if (settings.autoRecord) await sock.sendPresenceUpdate('recording', remoteJid);

        // --- COMMAND LOGIC CHECK ---
        if (!body.startsWith(prefix)) return;

        const command = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();
        const args = body.slice(prefix.length).trim().split(/ +/).slice(1);
        const text = args.join(' ');

        if (settings.mode === 'private' && !isOwner) return;

        // ================================
        // START MAIN SWITCH COMMANDS
        // ================================
        switch (command) {

            // ================================
            // RUNTIME COMMAND
            // ================================
            case 'runtime':
            case 'rtime': {
                await react('⏱️');
                const uptime = runtime(process.uptime());
                await replyWithStyle(sock, remoteJid, `⏰ *Bot Runtime:* ${uptime}\n\nJAMPAN-XMD is active and running at extreme speeds.\n\nI LOVE YOU ❤️`, m);
            }
            break;

            // ================================
            // ALIVE COMMAND
            // ================================
            case 'alive': {
                await react('✅');
                await replyWithStyle(sock, remoteJid, '✅ *JAMPAN-XMD is active, stable and running successfully!*', m);
            }
            break;

            // ================================
            // OWNER & CREATOR INFO
            // ================================
            case 'owner':
            case 'me':
            case 'dev': {
                await react('👑');
                await sock.sendMessage(remoteJid, {
                    contacts: {
                        displayName: 'Kelvin Jampan',
                        contacts: [{
                            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Kelvin Jampan\nTEL;type=CELL;type=VOICE;waid=255674229015:+255674229015\nEND:VCARD`
                        }]
                    }
                }, { quoted: m });
                await replyWithStyle(sock, remoteJid, '👑 *Owner:* Kelvin Jampan\n📞 *Contact:* wa.me/255674229015\n🌐 *Site:* https://jampanbot.vercel.app', m);
            }
            break;

            // ================================
            // GET JID FROM LINK
            // ================================
            case 'getjid':
            case 'jid': {
                await react('🆔');
                const linkJid = args[0];
                if (!linkJid) {
                    return await replyWithStyle(sock, remoteJid, "⚠️ *Please provide a Group or Channel link!*\n\n*Usage:*\n`.jid https://chat.whatsapp.com/KJH675...`", m);
                }

                if (linkJid.includes("chat.whatsapp.com")) {
                    try {
                        const code = linkJid.split("chat.whatsapp.com/")[1].split("?")[0]; 
                        const metadata = await sock.groupGetInviteInfo(code);
                        const responseText = `\n╭━━〔 👥 GROUP JID FOUND 〕━━⬣\n┃\n┃ 📝 *Name:* ${metadata.subject}\n┃ 🆔 *JID:* \`${metadata.id}@g.us\`\n┃ 👤 *Creator:* ${metadata.owner ? metadata.owner.split('@')[0] : 'Unknown'}\n┃\n╰━━━━━━━━━━━━━━━━━━⬣\n`;
                        await replyWithStyle(sock, remoteJid, responseText, m);
                    } catch (err) {
                        await replyWithStyle(sock, remoteJid, "❌ *Failed to fetch Group JID.* Invalid link.", m);
                    }
                } else if (linkJid.includes("whatsapp.com/channel")) {
                    try {
                        const code = linkJid.split("whatsapp.com/channel/")[1].split("?")[0];
                        const channelMetadata = await sock.newsletterInfoWithInvite(code);
                        const responseText = `\n╭━━〔 📢 CHANNEL JID FOUND 〕━━⬣\n┃\n┃ 📝 *Name:* ${channelMetadata.name}\n┃ 🆔 *JID:* \`${channelMetadata.id}@newsletter\`\n┃ 👥 *Followers:* ${channelMetadata.subscribers || 'Unknown'}\n┃\n╰━━━━━━━━━━━━━━━━━━⬣\n`;
                        await replyWithStyle(sock, remoteJid, responseText, m);
                    } catch (err) {
                        await replyWithStyle(sock, remoteJid, "❌ *Failed to fetch Channel JID.*", m);
                    }
                } else {
                    await replyWithStyle(sock, remoteJid, "⚠️ *Invalid WhatsApp Group or Channel link!*", m);
                }
            }
            break;

            // ================================
            // ANTIBAN AUTO-DM BROADCAST
            // ================================
            case 'ad-dm':
            case 'broadcast-dm': {
                if (!isOwner) return await react('❌');
                if (!isGroup) return await replyWithStyle(sock, remoteJid, "⚠️ *This command can only be executed inside a Group!*", m);

                await react('🚀');
                await replyWithStyle(sock, remoteJid, "🚀 *Initializing Advanced Anti-Ban Jet Auto-DM Broadcast... Please wait.*", m);

                try {
                    const groupMetadata = await sock.groupMetadata(remoteJid);
                    const members = groupMetadata.participants;
                    let successCount = 0;
                    const greetings = ["Hey!", "Hello!", "Hi there!", "Yo!", "Greetings!", "Quick update!"];

                    for (let member of members) {
                        const memberJid = member.id;
                        if (memberJid === sock.user.id) continue;

                        try {
                            const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
                            const uniqueId = Math.random().toString(36).substring(2, 6).toUpperCase();

                            await sock.sendMessage(memberJid, {
                                text: `╭━━━〔 ⚡ *SYSTEM BROADCAST* 〕━━━⬣
┃
┃ > \`\`\`${randomGreeting} JAMPAN XMD robot is active\`\`\` 🤖
┃
┃ > \`\`\`Deploy your own super-fast bot\`\`\`
┃ > \`\`\`and automate your WhatsApp daily!\`\`\`
┃
┃ 🔗 *Pair Link:* https://jampanbot.vercel.app
┃ 📢 *Official Channel:* Joined via Node
┃
┃ 👑 *Owner:* Kelvin Jampan
┃ 📞 *Contact:* wa.me/255674229015
┃
┃ _[Secure Link Ref: #XMD-${uniqueId}]_
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`,
                                contextInfo: {
                                    forwardingScore: 9999,
                                    isForwarded: true,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterName: 'JAMPAN-XMD SYSTEM 🚀',
                                        newsletterJid: '120363409292513352@newsletter',
                                        serverMessageId: 144
                                    },
                                    externalAdReply: {
                                        title: '⚡ JAMPAN-XMD MULTI-DEVICE ⚡',
                                        body: 'Experience the extreme speed bot node.',
                                        thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                                        sourceUrl: 'https://jampanbot.vercel.app',
                                        mediaType: 1,
                                        renderLargerThumbnail: true
                                    }
                                }
                            });

                            successCount++;
                            const randomDelay = Math.floor(Math.random() * (4500 - 2000 + 1)) + 2000;
                            await delay(randomDelay); 

                        } catch (dmErr) {
                            continue; 
                        }
                    }
                    await replyWithStyle(sock, remoteJid, `✅ *Anti-Ban Auto-DM Broadcast Completed!* Sent to *${successCount}* members.`, m);
                } catch (err) {
                    await replyWithStyle(sock, remoteJid, "❌ *Broadcast execution failed.*", m);
                }
            }
            break;

            // ================================
            // WHATSAPP ON-NODE PAIR GENERATOR
            // ================================
            case 'pair': {
                await react('📡');
                let targetNumber = args[0];
                if (!targetNumber) return await replyWithStyle(sock, remoteJid, "⚠️ *Usage:* `.pair 255674229015`", m);

                targetNumber = targetNumber.replace(/[^0-9]/g, '');
                await replyWithStyle(sock, remoteJid, `📡 *Connecting to WhatsApp Servers for +${targetNumber}... Please wait.*`, m);

                try {
                    const tempFolder = `./sessions/temp_pair_${targetNumber}_${Date.now()}`;
                    fsExtra.ensureDirSync(tempFolder);
                    const { state } = await useMultiFileAuthState(tempFolder);

                    const tempSock = makeWASocket({
                        auth: {
                            creds: state.creds,
                            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
                        },
                        printQRInTerminal: false,
                        logger: pino({ level: "fatal" }),
                        browser: ["Ubuntu", "Chrome", "20.0.04"]
                    });

                    await delay(5000);

                    if (!tempSock.authState.creds.registered) {
                        const pairCode = await tempSock.requestPairingCode(targetNumber);
                        await sock.sendMessage(from, {
                            text: `╭━━━〔 ⚡ *JAMPAN-XMD PAIRING* 〕━━━⬣
┃
┃ > \`\`\`Your WhatsApp pairing code is ready!\`\`\`
┃
┃ 🔑 *PAIR CODE:*  *${pairCode}*
┃ 📲 *Target Number:* +${targetNumber}
┃
┃ _[Code expires in 2 minutes]_
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`,
                            contextInfo: {
                                forwardingScore: 9999,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterName: 'JAMPAN-XMD SYSTEM 🚀',
                                    newsletterJid: '120363409292513352@newsletter',
                                    serverMessageId: 144
                                },
                                externalAdReply: {
                                    title: '⚡ JAMPAN-XMD CODE GENERATOR ⚡',
                                    body: 'Fast and secure automated node pairing.',
                                    thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                                    sourceUrl: 'https://jampanbot.vercel.app',
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        }, { quoted: m });

                        setTimeout(async () => {
                            try { tempSock.ws.close(); await fsExtra.remove(tempFolder); } catch (e) {}
                        }, 2000);
                    } else {
                        await replyWithStyle(sock, remoteJid, "❌ *Number already active.*", m);
                        tempSock.ws.close(); await fsExtra.remove(tempFolder);
                    }
                } catch (err) {
                    await replyWithStyle(sock, remoteJid, "❌ *Failed to generate pairing code.*", m);
                }
            }
            break;

            // ================================
            // ENHANCED DAVID CYRIL AI CHATBOT
            // ================================
            case 'ai':
            case 'gpt':
            case 'gemini':
            case 'chatgpt': {
                try {
                    await react('🧠');
                    if (!text) return await replyWithStyle(sock, remoteJid, `❌ Please ask something.\n\nExample: ${prefix}ai What is coding?`, m);

                    await sock.sendPresenceUpdate('composing', remoteJid);
                    const response = await axios.get(`https://apis.davidcyril.name.ng/endpoints/ai/gpt4?q=${encodeURIComponent(text)}`);
                    const aiReply = response.data.result || response.data.response || "No response template structure matched.";

                    await sock.sendMessage(remoteJid, {
                        text: `╭━━━〔 ⚡ *JAMPAN-XMD AI* 〕━━━⬣
┃
┃ > \`\`\`${aiReply}\`\`\`
┃
┃ 🔗 *Deploy Bot:* https://jampanbot.vercel.app
┃ 📢 *Channel:* Joined via Node
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`,
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterName: 'JAMPAN-XMD SYSTEM 🚀',
                                newsletterJid: '120363409292513352@newsletter',
                                serverMessageId: 144
                            },
                            externalAdReply: {
                                title: '⚡ JAMPAN-XMD ARTIFICIAL INTELLIGENCE ⚡',
                                body: 'Powered by David Cyril GPT Engine.',
                                thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                                sourceUrl: 'https://jampanbot.vercel.app',
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: m });
                } catch (err) {
                    await replyWithStyle(sock, remoteJid, '❌ AI server is currently busy. Please try again.', m);
                }
            }
            break;

            },
            externalAdReply: {
                title: '⚡ JAMPAN-XMD CONTROL PANEL',
                body: 'Fast • Secure • Anonymous',
                thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                sourceUrl: 'https://jampanbot.vercel.app',
                mediaType: 1,
                renderLargerThumbnail: true,
                showAdAttribution: true
            }
        }
    }, { quoted: m });

}
break;


            // ================================
            // ENHANCE IMAGE / HD (REMINI API)
            // ================================
            case 'enhance':
            case 'hd': {
                try {
                    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    const isImg = messageType === 'imageMessage' || quotedMsg?.imageMessage;

                    if (!isImg) return await replyWithStyle(sock, remoteJid, '❌ Reply to an image and type .enhance or .hd', m);

                    await react('🪄');
                    const mediaMessage = quotedMsg?.imageMessage || m.message.imageMessage;
                    const filePath = await sock.downloadAndSaveMediaMessage(mediaMessage);

                    await replyWithStyle(sock, remoteJid, '⏳ Enhancing image quality to ultra-HD via jampan XMD engine...', m);

                    // Upload file buffer or process with API
                    const imgBuffer = fs.readFileSync(filePath);
                    
                    // Using David Cyril's Remini API endpoint
                    const response = await axios.post('https://apis.davidcyril.name.ng/endpoints/ai/remini', imgBuffer, {
                        headers: { 'Content-Type': 'image/jpeg' },
                        responseType: 'arraybuffer'
                    }).catch(() => null);

                    if (response && response.data) {
                        await sock.sendMessage(remoteJid, {
                            image: Buffer.from(response.data),
                            caption: '✨ *Image Enhanced successfully to Ultra HD by JAMPAN-XMD*'
                        }, { quoted: m });
                    } else {
                        // Fallback to sending back original file if API fails
                        await sock.sendMessage(remoteJid, { image: { url: filePath }, caption: '✨ Original Quality (HD Enhancer Server Busy)' }, { quoted: m });
                    }

                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                } catch (err) {
                    await replyWithStyle(sock, remoteJid, '❌ Failed to enhance image processing.', m);
                }
            }
            break;

            // ================================
            // VIEW ONCE OPENER
            // ================================
            case 'vv':
            case 'viewonce': {
                try {
                    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    const vo = quotedMsg?.viewOnceMessageV2 || quotedMsg?.viewOnceMessageV2Extension;

                    if (!vo) return await replyWithStyle(sock, remoteJid, '❌ Reply to a View Once message!', m);

                    await react('👀');
                    const media = vo.message.imageMessage || vo.message.videoMessage || vo.message.audioMessage;
                    const filePath = await sock.downloadAndSaveMediaMessage(media);

                    if (vo.message.imageMessage) {
                        await sock.sendMessage(remoteJid, { image: { url: filePath }, caption: media.caption || '' }, { quoted: m });
                    } else if (vo.message.videoMessage) {
                        await sock.sendMessage(remoteJid, { video: { url: filePath }, caption: media.caption || '' }, { quoted: m });
                    } else if (vo.message.audioMessage) {
                        await sock.sendMessage(remoteJid, { audio: { url: filePath }, mimetype: 'audio/mp4', ptt: false }, { quoted: m });
                    }

                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                } catch (err) {
                    await replyWithStyle(sock, remoteJid, '❌ Failed to open View Once message.', m);
                }
            }
            break;

            // ================================
            // PING & SPEED TEST (WITH PROGRESS BAR)
            // ================================
            case 'ping': {
                try {
                    await react('🚀');
                    const startTime = Date.now();
                    const pingMsg = await sock.sendMessage(remoteJid, { text: '⚡ Pinging JAMPAN-XMD...' }, { quoted: m });

                    const progressSteps = [
                        { bar: '▰▱▱▱▱▱▱▱▱▱', percent: '10%' },
                        { bar: '▰▰▰▰▱▱▱▱▱▱', percent: '40%' },
                        { bar: '▰▰▰▰▰▰▰▱▱▱', percent: '70%' },
                        { bar: '▰▰▰▰▰▰▰▰▰▰', percent: '100%' }
                    ];

                    for (const step of progressSteps) {
                        await delay(200);
                        await sock.sendMessage(remoteJid, { text: `${step.bar} ${step.percent}`, edit: pingMsg.key });
                    }

                    const latency = Date.now() - startTime;
                    let quality = 'EXCELLENT', emoji = '🟢';
                    if (latency > 100 && latency < 300) { quality = 'GOOD'; emoji = '🟡'; }
                    else if (latency >= 300) { quality = 'FAIR'; emoji = '🟠'; }

                    const finalText = `━━━━━━━━━━━━━━━━━━━━\n┃ ⚡ PING RESULT ⚡\n━━━━━━━━━━━━━━━━━━━━\n\n🏓 Ping Completed!\n⚡ Speed: ${latency}ms\n${emoji} Quality: ${quality}\n🕒 Time: ${new Date().toLocaleTimeString()}\n\n━━━━━━━━━━━━━━━━━━━━\n┃ 🤖 JAMPAN-XMD 🚀\n━━━━━━━━━━━━━━━━━━━━`;

                    await sock.sendMessage(remoteJid, {
                        image: { url: 'https://files.catbox.moe/fzjhed.png' },
                        caption: finalText,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: { newsletterName: 'kelvin - jampan-Ai', newsletterJid: '120363409292513352@newsletter' }
                        }
                    }, { quoted: m });
                } catch (err) {
                    console.log(err);
                    await replyWithStyle(sock, remoteJid, '❌ Ping failed.', m);
                }
            }
            break;

            // ================================
            // SETTINGS COMMANDS (OWNER)
            // ================================
            case 'autotyping': {
                if (!isOwner) return await react('❌');
                settings.autoTyping = args[0] === 'on';
                await replyWithStyle(sock, remoteJid, `✅ Auto Typing is now ${settings.autoTyping ? 'ON' : 'OFF'}`, m);
            }
            break;

            case 'autorec': {
                if (!isOwner) return await react('❌');
                settings.autoRecord = args[0] === 'on';
                await replyWithStyle(sock, remoteJid, `✅ Auto Record is now ${settings.autoRecord ? 'ON' : 'OFF'}`, m);
            }
            break;

            case 'mode': {
                if (!isOwner) return await react('❌');
                const newMode = args[0]?.toLowerCase();
                if (newMode !== 'public' && newMode !== 'private') return await replyWithStyle(sock, remoteJid, `❌ Use: ${prefix}mode public/private`, m);
                settings.mode = newMode;
                await react('✅');
                await replyWithStyle(sock, remoteJid, `✅ Bot mode changed to *${newMode.toUpperCase()}*`, m);
            }
            break;

            case 'setprefix': {
                if (!isOwner) return await react('❌');
                const newPrefix = args[0];
                if (!newPrefix) return await replyWithStyle(sock, remoteJid, `❌ Example: ${prefix}setprefix #`, m);
                config.PREFIX = newPrefix;
                await react('✅');
                await replyWithStyle(sock, remoteJid, `✅ Prefix changed to: ${newPrefix}`, m);
            }
            break;

            // ================================
            // TEXT TO SPEECH (SAY)
            // ================================
            case 'say': {
                try {
                    await react('🗣️');
                    const googleTTS = require('google-tts-api');
                    const ttsText = args.join(' ');
                    if (!ttsText) return await replyWithStyle(sock, remoteJid, '❌ Enter text to speak.', m);

                    const audioUrl = googleTTS.getAudioUrl(ttsText, { lang: 'en', slow: false });
                    await sock.sendMessage(remoteJid, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', ptt: true }, { quoted: m });
                } catch (err) {
                    await replyWithStyle(sock, remoteJid, '❌ Failed to generate audio.', m);
                }
            }
            break;

            // ================================
            // VCF EXPORT
            // ================================
            case 'vcf': {
                try {
                    if (!isGroup) return await replyWithStyle(sock, remoteJid, '❌ Group only command.', m);
                    await react('📇');

                    const metadata = await sock.groupMetadata(remoteJid);
                    const participants = metadata.participants;
                    let vcfContent = '';

                    participants.forEach((p) => {
                        const number = p.id.split('@')[0];
                        vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:JAMPAN | ${number}\nTEL;TYPE=CELL:+${number}\nEND:VCARD\n`;
                    });

                    await sock.sendMessage(remoteJid, {
                        document: Buffer.from(vcfContent),
                        mimetype: 'text/vcard',
                        fileName: 'JampanContacts.vcf',
                        caption: `✅ Exported ${participants.length} contacts`
                    }, { quoted: m });
                } catch (err) {
                    await replyWithStyle(sock, remoteJid, '❌ Failed to export contacts.', m);
                }
            }
            break;

            // ============================================
            // 🧠 ADVANCED AI CHAT WITH DYNAMIC MEMORY (ACTIVE ENGINE)
            // ============================================
            case 'ai':
            case 'gpt':
            case 'gemini':
            case 'chatgpt': {
                try {
                    await react('🧠');
                    const aiText = args.join(' ');
                    if (!aiText) {
                        return await replyWithStyle(sock, remoteJid, `❌ Please ask something.\n\nExample: ${prefix}ai who is Kelvin Jampan?`, m);
                    }

                    // Initialize conversational history memory
                    if (!global.userChats) global.userChats = {};
                    if (!global.userChats[remoteJid]) global.userChats[remoteJid] = [];

                    global.userChats[remoteJid].push(`User: ${aiText}`);
                    if (global.userChats[remoteJid].length > 10) global.userChats[remoteJid].shift();

                    const userHistory = global.userChats[remoteJid].join('\n');
                    
                    // The core system personality blueprint
                    const systemPrompt = `You are JAMPAN-XMD, a highly advanced, ultra-fast and smart WhatsApp bot created, developed, and owned by Kelvin Jampan from Tanzania (who is 19 years old). Website: https://jampanbot.vercel.app. Chat naturally, witty, and intelligently like a real human using English or Kiswahili. If the person chatting with you is a woman and shows interest or asks about love/friendship with the creator, smoothly and friendly give her Kelvin Jampan's WhatsApp number: 255674229015 to connect. Current chat history context:\n${userHistory}`;

                    // Let user know the node is composing
                    await sock.sendPresenceUpdate('composing', remoteJid);

                    // Routing request to the unlimited active GPT-4 engine
                    const response = await axios.get(`https://apis.davidcyril.name.ng/endpoints/ai/gpt4?q=${encodeURIComponent(systemPrompt + "\nUser Current Input: " + aiText)}`);
                    
                    const botResponse = response.data.result || response.data.response || "No analytical response matched from the server node.";
                    
                    // Save bot response to local memory cache
                    global.userChats[remoteJid].push(`Bot: ${botResponse}`);

                    // Send back formatted inside our custom premium layout
                    await sock.sendMessage(remoteJid, {
                        text: `╭━━━〔 ⚡ *JAMPAN-XMD AI* 〕━━━⬣
┃
┃ > \`\`\`${botResponse}\`\`\`
┃
┃ 🔗 *Deploy Bot:* https://jampanbot.vercel.app
┃ 📢 *Channel:* Joined via Node
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`,
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterName: 'JAMPAN-XMD SYSTEM 🚀',
                                newsletterJid: '120363409292513352@newsletter',
                                serverMessageId: 144
                            },
                            externalAdReply: {
                                title: '⚡ JAMPAN-XMD ARTIFICIAL INTELLIGENCE ⚡',
                                body: 'Powered by David Cyril GPT-4 Engine.',
                                thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                                sourceUrl: 'https://jampanbot.vercel.app',
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: m });

                } catch (err) {
                    console.log("AI Command Error:", err);
                    await replyWithStyle(sock, remoteJid, '❌ AI Node engine is currently refreshing. Please try again in a few seconds.', m);
                }
            }
            break;
  
                        // ================================
            // STICKER GENERATOR
            // ================================
            case 'sticker':
            case 's': {
                try {
                    await react('✨');
                    const { Sticker, StickerTypes } = require('wa-sticker-formatter');
                    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    const mediaMessage = quotedMsg?.imageMessage || quotedMsg?.videoMessage || m.message?.imageMessage || m.message?.videoMessage;

                    if (!mediaMessage) return await replyWithStyle(sock, remoteJid, "❌ Reply to image/video!", m);

                    const media = await sock.downloadMediaMessage(quotedMsg ? { message: quotedMsg } : m);
                    const sticker = new Sticker(media, {
                        pack: "JAMPAN-XMD",
                        author: "Kelvin Jampan",
                        type: args.includes('-c') ? StickerTypes.CROPPED : StickerTypes.FULL,
                        quality: 70
                    });

                    await sock.sendMessage(remoteJid, { sticker: await sticker.toBuffer() }, { quoted: m });
                } catch (err) {
                    console.log(err);
                    await replyWithStyle(sock, remoteJid, '❌ Failed to create sticker.', m);
                }
            }
            break;
    
                                  // ================================
            // STEAL / TAKE STICKER METADATA
            // ================================
            case 'take':
            case 'steal': {
                try {
                    await react('📸');
                    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    if (!quotedMsg?.stickerMessage) return await replyWithStyle(sock, remoteJid, '❌ Reply to a sticker.', m);

                    const { Sticker, StickerTypes } = require('wa-sticker-formatter');
                    const mediaPath = await sock.downloadAndSaveMediaMessage(quotedMsg.stickerMessage);
                    const packName = args.join(' ') || 'JAMPAN-XMD';

                    const sticker = new Sticker(mediaPath, {
                        pack: packName,
                        author: "Kelvin Jampan",
                        type: StickerTypes.CROPPED,
                        quality: 70
                    });

                    await sock.sendMessage(remoteJid, { sticker: await sticker.toBuffer() }, { quoted: m });
                    if (fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
                } catch (err) {
                    console.log(err);
                    await replyWithStyle(sock, remoteJid, '❌ Failed to change sticker metadata.', m);
                }
            }
            break;
     
                                          // ================================
            // STICKER TO PHOTO
            // ================================
            case 'photo': {
                try {
                    await react('🖼️');
                    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    if (!quotedMsg?.stickerMessage) return await replyWithStyle(sock, remoteJid, '❌ Reply to a sticker.', m);

                    const stickerPath = await sock.downloadAndSaveMediaMessage(quotedMsg.stickerMessage);
                    const outputPath = `${stickerPath}.png`;
                    const { exec } = require('child_process');

                    exec(`ffmpeg -i "${stickerPath}" "${outputPath}"`, async (err) => {
                        if (err) return await replyWithStyle(sock, remoteJid, '❌ Failed to convert sticker. Hakikisha ffmpeg imesakinishwa.', m);

                        await sock.sendMessage(remoteJid, { image: fs.readFileSync(outputPath), caption: '✅ Converted by JAMPAN-XMD' }, { quoted: m });
                        if (fs.existsSync(stickerPath)) fs.unlinkSync(stickerPath);
                        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    });
                } catch (err) {
                    console.log(err);
                    await replyWithStyle(sock, remoteJid, '❌ Failed to convert sticker.', m);
                }
            }
            break;
        
            // ================================
            // GITHUB LOOKUP
            // ================================
            case "github":
            case "gh": {
                if (!args[0]) return await replyWithStyle(sock, remoteJid, `❌ Example: ${prefix}github KelvinJampan`, m);
                await react("📃");
                try {
                    const response = await axios.get(`https://api.github.com/users/${args[0]}`);
                    const data = response.data;
                    const githubText = `╭━━〔 GITHUB INFO 〕━━⬣\n┃ 👤 Name: ${data.name || "N/A"}\n┃ 🔖 Username: ${data.login}\n┃ 👥 Followers: ${data.followers}\n┃ 📦 Repos: ${data.public_repos}\n┃ 🌍 Location: ${data.location || "N/A"}\n┃ 🔗 ${data.html_url}\n╰━━━━━━━━━━━━━━━━━━⬣`;
                    await sock.sendMessage(remoteJid, { image: { url: data.avatar_url }, caption: githubText }, { quoted: m });
                } catch (e) {
                    await replyWithStyle(sock, remoteJid, "❌ GitHub user not found!", m);
                }
            }
            break;                                                  
                // ============================================
            // 📚 PREMIUM ANONYMOUS DICTIONARY (DEFINE ENGINE)
            // ============================================
            case 'define': {
                try {
                    await react('📚');
                    const term = args.join(' ');
                    if (!term) {
                        return await replyWithStyle(sock, remoteJid, `⚠️ *Please provide a word to define!*\n\n*Usage:* \`${prefix}define intelligence\``, m);
                    }

                    // Inform user the node is scanning databases
                    await sock.sendPresenceUpdate('composing', remoteJid);

                    // Fetching data from an unlimited, reliable open-source dictionary endpoint
                    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term)}`).catch(() => null);

                    if (!response || !response.data || response.data.length === 0) {
                        return await sock.sendMessage(remoteJid, {
                            text: `╭━━━〔 📚 *DICTIONARY SCAN* 〕━━━⬣\n┃\n┃ > \`\`\`No valid definition found for: ${term.toUpperCase()}\`\`\`\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`,
                            contextInfo: { isForwarded: true, forwardedNewsletterMessageInfo: { newsletterName: 'JAMPAN-XMD SYSTEM 🚀', newsletterJid: '120363409292513352@newsletter', serverMessageId: 144 }}
                        }, { quoted: m });
                    }

                    const wordData = response.data[0];
                    const wordName = wordData.word.toUpperCase();
                    const phonetic = wordData.phonetic || (wordData.phonetics && wordData.phonetics[0]?.text) || 'N/A';
                    
                    // Grab the first meaning and its definition
                    const meaning = wordData.meanings[0];
                    const partOfSpeech = meaning.partOfSpeech.toUpperCase();
                    const mainDefinition = meaning.definitions[0].definition;
                    const example = meaning.definitions[0].example || null;

                    // Building premium gray-themed response layout
                    let definitionPayload = `╭━━━〔 ⚡ *JAMPAN-XMD DICTIONARY* 〕━━━⬣
┃
┃ 📌 *Word:* \`${wordName}\` [_${phonetic}_]
┃ ⚙️ *Type:* _${partOfSpeech}_
┃
┃ > \`\`\`Definition: ${mainDefinition}\`\`\``;

                    if (example) {
                        definitionPayload += `\n┃\n┃ > \`\`\`Example: "${example}"\`\`\``;
                    }

                    definitionPayload += `\n┃\n┃ 🔗 *Deploy:* https://jampanbot.vercel.app\n┃ 👑 *Owner:* Kelvin Jampan\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`;

                    // Dispatch formatted payload through verified newsletter context
                    await sock.sendMessage(remoteJid, {
                        text: definitionPayload,
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterName: 'JAMPAN-XMD SYSTEM 🚀',
                                newsletterJid: '120363409292513352@newsletter',
                                serverMessageId: 144
                            },
                            externalAdReply: {
                                title: `⚡ LEXICON NODE: ${wordName} ⚡`,
                                body: 'Automated linguistic data retrieval.',
                                thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                                sourceUrl: 'https://jampanbot.vercel.app',
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: m });

                } catch (err) {
                    console.log("Dictionary Command Error:", err);
                    await replyWithStyle(sock, remoteJid, '❌ Dictionary server node timed out. Please try again later.', m);
                }
            }
            break;
            // ============================================
            // ☕ AI COFFEE & LEGENDARY JAMPAN FAMILY TRIBUTE
            // ============================================
            case 'coffee': {
                try {
                    await react('☕');
                    
                    // Inform the user that the AI node is brewing the text
                    await sock.sendPresenceUpdate('composing', remoteJid);

                    // Crafting a dynamic AI prompt to generate legendary congratulations for the lineage
                    const aiPrompt = "Write a short, powerful, and highly respectful congratulatory or praise statement (1-3 sentences) in English celebrating the Jampan legacy. Mention Kelvin Jampan (the brilliant 19-year-old developer and creator of JAMPAN-XMD), his father Maneno, and his grandfather Jampan. Make it sound epic, futuristic, and full of respect for this family lineage.";

                    let tributeText = "";
                    try {
                        const aiResponse = await axios.get(`https://apis.davidcyril.name.ng/endpoints/ai/gpt4?q=${encodeURIComponent(aiPrompt)}`);
                        tributeText = aiResponse.data.result || aiResponse.data.response || "Salute to the unstoppable lineage of Kelvin, his father Maneno, and grandfather Jampan!";
                    } catch (aiErr) {
                        // Resilient fallback just in case the AI server blinks
                        tributeText = "Salute to the legendary lineage! From Grandfather Jampan, to Father Maneno, down to the brilliant developer Kelvin Jampan—creators of the supreme JAMPAN-XMD node.";
                    }

                    // Constructing the premium layout payload
                    const coffeePayload = `╭━━━〔 ☕ *JAMPAN LEGACY BREW* 〕━━━⬣
┃
┃ > \`\`\`${tributeText}\`\`\`
┃
┃ ☕ *Enjoy your fresh coffee!*
┃ 🔗 *Deploy:* https://jampanbot.vercel.app
┃ 👑 *Owner:* Kelvin Jampan
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`;

                    // Dispatching the message combined with a fresh random coffee image and newsletter context
                    await sock.sendMessage(remoteJid, {
                        image: { url: 'https://coffee.alexflipnote.dev/random' },
                        caption: coffeePayload,
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterName: 'JAMPAN-XMD SYSTEM 🚀',
                                newsletterJid: '120363409292513352@newsletter',
                                serverMessageId: 144
                            },
                            externalAdReply: {
                                title: '⚡ THE JAMPAN LINEAGE DOCK ⚡',
                                body: 'Grandfather Jampan • Father Maneno • Dev Kelvin',
                                thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                                sourceUrl: 'https://jampanbot.vercel.app',
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: m });

                } catch (err) {
                    console.log("Coffee Command Error:", err);
                    await replyWithStyle(sock, remoteJid, '❌ Failed to connect to the coffee server node.', m);
                }
            }
            break;
                        
                  case 'love': {
                await react('❤️');
                await replyWithStyle(sock, remoteJid, '❤️ You became the most important person in my life.', m);
            }
            break;

            case 'vision': {
                await react('🔎');
                await replyWithStyle(sock, remoteJid, '❤️ Our mission is making WhatsApp automation fun and smart.', m);
            }
            break;                                              

            case 'script': {
                await react('📜');
                await replyWithStyle(sock, remoteJid, `┏━━━━━━━━━━━━━━\n┃ JAMPAN-XMD\n┃ STATUS: ACTIVE\n┗━━━━━━━━━━━━━━\n\n👑 Creator:\nKelvin Jampan\n\n📢 Channel:\nhttps://whatsapp.com/channel/0029Vb7fTNf3QxS8A6rbBB3S\n\n© JAMPAN-XMD`, m);
            }
            break;

            case 'support':
            case 'channel': {
                await react('📢');
                await replyWithStyle(sock, remoteJid, '📢 Official Channel:\nhttps://whatsapp.com/channel/0029Vb7fTNf3QxS8A6rbBB3S', m);
            }
            break;

            case 'heroku': {
                await react('🚀');
                await replyWithStyle(sock, remoteJid, '🚀 JAMPAN-XMD is running on Heroku successfully.', m);
            }
            break;

            // ================================
            // GROUP MANAGEMENT COMMANDS
            // ================================
            case "tagall": {
                if (!isGroup) return await replyWithStyle(sock, remoteJid, "❌ Group only command!", m);
                await react("📢");
                const metadata = await sock.groupMetadata(remoteJid);
                const participants = metadata.participants;
                let teks = `📢 *TAG ALL*\n\n`;
                for (let mem of participants) { teks += `👤 @${mem.id.split("@")[0]}\n`; }
                await sock.sendMessage(remoteJid, { text: teks, mentions: participants.map(v => v.id) }, { quoted: m });
            }
            break;

            case "link": {
                if (!isGroup) return await replyWithStyle(sock, remoteJid, "❌ Group only!", m);
                await react("🔗");
                const code = await sock.groupInviteCode(remoteJid);
                await replyWithStyle(sock, remoteJid, `🔗 https://chat.whatsapp.com/${code}`, m);
            }
            break;

            // ============================================
            // ⚙️ GROUP SECURITY & AUTOMATION (ON/OFF ENGINES)
            // ============================================
            
            case 'welcome': {
                if (!isGroup) return await replyWithStyle(sock, remoteJid, "⚠️ *This command can only be used in groups!*", m);
                if (!isAdmin && !isOwner) return await react('❌');
                
                const action = args[0]?.toLowerCase();
                if (!global.groupSettings) global.groupSettings = {};
                if (!global.groupSettings[remoteJid]) global.groupSettings[remoteJid] = { welcome: false, goodbye: false, antilink: false };

                if (action === 'on') {
                    global.groupSettings[remoteJid].welcome = true;
                    await react('✅');
                    await replyWithStyle(sock, remoteJid, "🚀 *JAMPAN-XMD AI Welcome Engine is now turned ON!*\n\nEvery new member will be welcomed dynamically with their PFP and an AI personalized greeting.", m);
                } else if (action === 'off') {
                    global.groupSettings[remoteJid].welcome = false;
                    await react('✅');
                    await replyWithStyle(sock, remoteJid, "🔒 *JAMPAN-XMD AI Welcome Engine is now turned OFF!*", m);
                } else {
                    await replyWithStyle(sock, remoteJid, `⚠️ *Usage:* \`${prefix}welcome on\` or \`${prefix}welcome off\`\n\n*Current Status:* ${global.groupSettings[remoteJid].welcome ? '🟢 ON' : '🔴 OFF'}`, m);
                }
            }
            break;

            case 'goodbye': {
                if (!isGroup) return await replyWithStyle(sock, remoteJid, "⚠️ *This command can only be used in groups!*", m);
                if (!isAdmin && !isOwner) return await react('❌');
                
                const action = args[0]?.toLowerCase();
                if (!global.groupSettings) global.groupSettings = {};
                if (!global.groupSettings[remoteJid]) global.groupSettings[remoteJid] = { welcome: false, goodbye: false, antilink: false };

                if (action === 'on') {
                    global.groupSettings[remoteJid].goodbye = true;
                    await react('✅');
                    await replyWithStyle(sock, remoteJid, "🚀 *JAMPAN-XMD Goodbye Engine is now turned ON!*\n\nThe group will be notified whenever someone leaves.", m);
                } else if (action === 'off') {
                    global.groupSettings[remoteJid].goodbye = false;
                    await react('✅');
                    await replyWithStyle(sock, remoteJid, "🔒 *JAMPAN-XMD Goodbye Engine is now turned OFF!*", m);
                } else {
                    await replyWithStyle(sock, remoteJid, `⚠️ *Usage:* \`${prefix}goodbye on\` or \`${prefix}goodbye off\`\n\n*Current Status:* ${global.groupSettings[remoteJid].goodbye ? '🟢 ON' : '🔴 OFF'}`, m);
                }
            }
            break;

            case 'promote': {
                if (!isGroup) return await replyWithStyle(sock, remoteJid, "⚠️ *This command can only be used in groups!*", m);
                if (!isAdmin && !isOwner) return await replyWithStyle(sock, remoteJid, "❌ *Only group admins or the owner can promote members!*", m);
                
                // Fetch the replied-to user or mentioned user
                const quotedMsg = m.message?.extendedTextMessage?.contextInfo;
                let targetUser = quotedMsg?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

                if (!targetUser) return await replyWithStyle(sock, remoteJid, "⚠️ *Please reply to someone's message or tag them to promote!*\n\n*Example:* Reply to a message with `.promote`", m);

                try {
                    await react('⚡');
                    await sock.groupParticipantsUpdate(remoteJid, [targetUser], "promote");
                    await replyWithStyle(sock, remoteJid, `✨ *Success!* @${targetUser.split('@')[0]} has been promoted to *Group Admin* by JAMPAN-XMD node.`, m);
                } catch (err) {
                    await replyWithStyle(sock, remoteJid, "❌ *Failed to promote user.* Ensure the bot is an admin in this group.", m);
                }
            }
            break;

            case 'demote': {
                if (!isGroup) return await replyWithStyle(sock, remoteJid, "⚠️ *This command can only be used in groups!*", m);
                if (!isAdmin && !isOwner) return await replyWithStyle(sock, remoteJid, "❌ *Only group admins or the owner can demote members!*", m);
                
                const quotedMsg = m.message?.extendedTextMessage?.contextInfo;
                let targetUser = quotedMsg?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

                if (!targetUser) return await replyWithStyle(sock, remoteJid, "⚠️ *Please reply to someone's message or tag them to demote!*\n\n*Example:* Reply to a message with `.demote`", m);

                try {
                    await react('⚡');
                    await sock.groupParticipantsUpdate(remoteJid, [targetUser], "demote");
                    await replyWithStyle(sock, remoteJid, `🛡️ *Success!* @${targetUser.split('@')[0]} has been demoted from *Admin status* by JAMPAN-XMD node.`, m);
                } catch (err) {
                    await replyWithStyle(sock, remoteJid, "❌ *Failed to demote user.* Ensure the bot is an admin.", m);
                }
            }
            break;

            // ============================================
            // 🚀 EXTRA BONUS AUTOMATION: ANTILINK (KICK INTRUDERS)
            // ============================================
            case 'antilink': {
                if (!isGroup) return await replyWithStyle(sock, remoteJid, "⚠️ *This command can only be used in groups!*", m);
                if (!isAdmin && !isOwner) return await react('❌');
                
                const action = args[0]?.toLowerCase();
                if (!global.groupSettings) global.groupSettings = {};
                if (!global.groupSettings[remoteJid]) global.groupSettings[remoteJid] = { welcome: false, goodbye: false, antilink: false };

                if (action === 'on') {
                    global.groupSettings[remoteJid].antilink = true;
                    await react('🛡️');
                    await replyWithStyle(sock, remoteJid, "🛡️ *JAMPAN-XMD Anti-Link Guard is now ON!*\n\nAnyone who sends a WhatsApp group link without permission will be automatically kicked out.", m);
                } else if (action === 'off') {
                    global.groupSettings[remoteJid].antilink = false;
                    await react('✅');
                    await replyWithStyle(sock, remoteJid, "🔓 *JAMPAN-XMD Anti-Link Guard is now OFF!*", m);
                } else {
                    await replyWithStyle(sock, remoteJid, `⚠️ *Usage:* \`${prefix}antilink on\` or \`${prefix}antilink off\`\n\n*Current Status:* ${global.groupSettings[remoteJid].antilink ? '🟢 ON' : '🔴 OFF'}`, m);
                }
            }
            break;
            
              // ==========================================
            // YOUTUBE & STRATEGIC BROADCAST COMMANDS
            // ==========================================
case 'broadcast': {
    if (!isOwner) return await replyWithStyle(sock, remoteJid, '❌ This command is only available for the bot owner.', m);

    try {
        const groups = Object.keys(await sock.groupFetchAllParticipating());

        await replyWithStyle(
            sock,
            remoteJid,
            `📢 Starting YouTube promotion broadcast to ${groups.length} groups...`,
            m
        );

        const promoCaption = `
╭━━〔 🎬 JAMPAN XMD CHANNEL 〕━━⬣
┃
┃ 🚀 Want to learn:
┃ • WhatsApp Bot Development
┃ • Termux Tricks
┃ • Web Development
┃ • Baileys & Pair Code Systems
┃ • Advanced Bot Features
┃
┃ 🔥 Subscribe to my official
┃ YouTube channel now and level up!
┃
┃ 👑 Channel: *Jampani XMD*
┃
┃ 📌 Tap the image below to open
┃ the YouTube channel directly.
┃
╰━━━━━━━━━━━━━━⬣
`;

        for (let jid of groups) {

            await sock.sendMessage(jid, {
                image: {
                    url: 'https://i.imgur.com/8amqBSN.jpeg'
                },
                caption: promoCaption,
                contextInfo: {
                    externalAdReply: {
                        title: '🎥 JAMPAN XMD OFFICIAL',
                        body: 'Bots • Termux • Coding • Tutorials',
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        thumbnailUrl: 'https://i.imgur.com/8amqBSN.jpeg',
                        sourceUrl: 'https://youtube.com/@jampani-xmd?si=oLPtRqYf1h1ygSzt'
                    }
                }
            });

            await delay(3500); // Anti-ban delay
        }

        await replyWithStyle(
            sock,
            remoteJid,
            '✅ YouTube promotion broadcast completed successfully!',
            m
        );

    } catch (err) {
        console.log(err);

        await replyWithStyle(
            sock,
            remoteJid,
            '❌ Broadcast failed. Please check logs.',
            m
        );
    }
}
break;

            // ============================================
            // 📡 PRE-RESOLVED DEPLOY ACCELERATOR BROADCAST (WAITE ENGINE)
            // ============================================
            case 'waite': {
                if (!isOwner) return await react('❌');

                try {
                    await react('🚀');

                    // Fetching active chats using resilient memory storage fallback
                    const chatStorage = sock.store?.chats?.all() || await sock.getChats?.() || [];
                    
                    if (chatStorage.length === 0) {
                        return await replyWithStyle(sock, remoteJid, "❌ *No active DM chat history found in memory store.*", m);
                    }

                    // Count target private user nodes only
                    const privateUsers = chatStorage.filter(user => user.id && user.id.endsWith('@s.whatsapp.net'));

                    await sock.sendMessage(remoteJid, {
                        text: `╭━━━〔 ⚡ *DEPLOY BROADCAST* 〕━━━⬣\n┃\n┃ > \`\`\`Initializing secure packet delivery...\`\`\`\n┃\n┃ 📊 *Target Nodes:* ${privateUsers.length} Private Chats\n┃ 🛡️ *Anti-Ban Shield:* Active Jitter\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`,
                        contextInfo: { isForwarded: true, forwardedNewsletterMessageInfo: { newsletterName: 'JAMPAN-XMD SYSTEM 🚀', newsletterJid: '120363409292513352@newsletter', serverMessageId: 144 }}
                    }, { quoted: m });

                    let deliveredCount = 0;

                    for (let user of privateUsers) {
                        try {
                            const uniqueRef = Math.random().toString(36).substring(2, 6).toUpperCase();

                            await sock.sendMessage(user.id, {
                                text: `╭━━━〔 ⚡ *SYSTEM ANNOUNCEMENT* 〕━━━⬣
┃
┃ > \`\`\`JAMPAN-XMD MULTI-DEVICE IS ACTIVE\`\`\` 🤖
┃
┃ 🚀 *Tap below to deploy your own high-speed automated node instantly.*
┃
┃ 🔗 *Deploy Link:* https://jampanbot.vercel.app
┃ 👑 *Owner:* Kelvin Jampan
┃ 📢 *Channel:* Joined via Node
┃
┃ _[Packet Security Ref: #DEPLOY-${uniqueRef}]_
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`,
                                contextInfo: {
                                    forwardingScore: 9999,
                                    isForwarded: true,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterName: 'JAMPAN-XMD SYSTEM 🚀',
                                        newsletterJid: '120363409292513352@newsletter',
                                        serverMessageId: 144
                                    },
                                    externalAdReply: {
                                        title: '🚀 CLICK TO DEPLOY YOUR JAMPAN BOT 🚀',
                                        body: 'Fast • Secure • Anonymous Cloud Storage & Automation',
                                        thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                                        sourceUrl: 'https://jampanbot.vercel.app',
                                        mediaType: 1,
                                        renderLargerThumbnail: true
                                    }
                                }
                            });

                            deliveredCount++;

                            // ANTI-BAN ADVANCED HUMANIZED DELAY: Variable jitter between 2.5s and 5s
                            const antiBanDelay = Math.floor(Math.random() * (5000 - 2500 + 1)) + 2500;
                            await delay(antiBanDelay);

                        } catch (sendErr) {
                            // Skip inactive/blocked nodes without crashing the master script
                            continue;
                        }
                    }

                    await sock.sendMessage(remoteJid, {
                        text: `╭━━━〔 ✅ *BROADCAST COMPLETE* 〕━━━⬣\n┃\n┃ > \`\`\`Deployment packets successfully distributed.\`\`\`\n┃\n┃ 📊 *Delivered:* ${deliveredCount} / ${privateUsers.length} Users\n┃ 🛡️ *Status:* Safe Execution\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`,
                        contextInfo: { isForwarded: true, forwardedNewsletterMessageInfo: { newsletterName: 'JAMPAN-XMD SYSTEM 🚀', newsletterJid: '120363409292513352@newsletter', serverMessageId: 144 }}
                    }, { quoted: m });

                } catch (err) {
                    console.log("Waite Broadcast Critical Crash Prevented:", err);
                    await replyWithStyle(sock, remoteJid, '❌ Critical database read failure during broadcast initialization.', m);
                }
            }
            break;
            
case 'repo': {
    try {

        await sock.sendMessage(remoteJid, {
            text: `
╭━━〔 🤖 JAMPAN-XMD SYSTEM 〕━━⬣
┃
┃ ⚡ Bot Name : JAMPAN-XMD
┃ 👑 Owner : Kelvin Jampan
┃ 🚀 Status : Active & Online
┃
┃ > Anonymous deployment access enabled
┃
┃ 🔗 Tap below to deploy instantly
┃
╰━━━━━━━━━━━━━━━━⬣
`,
            contextInfo: {
                externalAdReply: {
                    title: '🚀 JAMPAN-XMD DEPLOY',
                    body: 'Fast • Free • Secure',
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnailUrl: 'https://i.imgur.com/8amqBSN.jpeg',
                    sourceUrl: 'https://jampanbot.vercel.app'
                }
            }
        }, { quoted: m });

    } catch (err) {
        console.log(err);

        await replyWithStyle(
            sock,
            remoteJid,
            '❌ Repo command failed.',
            m
        );
    }
}
break;

            // ============================================
            // 🎨 ADVANCED AI LOGO & TEXT GRAPHIC ENGINE (MULTI-TEMPLATE)
            // ============================================
            case 'hacker': case 'dragonball': case 'naruto': case 'wall': case 'summer': case 'neonlight':
            case 'greenneon': case 'glitch': case 'devil': case 'boom': case 'water': case 'snow':
            case 'transformer': case 'thunder': case 'harrypotter': case 'whitegold': case 'thor':
            case 'neon': case 'gold': case 'purple': case 'arena': case 'write': case 'meme': case 'url': {
                
                try {
                    const targetText = text.trim();
                    if (!targetText) {
                        return await replyWithStyle(sock, remoteJid, `⚠️ *Please provide a name or text for the graphic!*\n\n*Usage:* \`${prefix}${command} Kelvin\``, m);
                    }

                    await react('🎨');
                    await sock.sendMessage(remoteJid, { text: `🎨 *JAMPAN-XMD AI is compounding your "${command}" graphic template for "${targetText}"...*` }, { quoted: m });

                    // Dynamically structural prompt generation based on what command the user typed
                    let aiPrompt = `A high-quality premium professional 3D typography logo design texturing the word "${targetText}". `;
                    
                    if (command === 'hacker') aiPrompt += `The text should be embedded in a dark cyber hacker theme environment, matrix green binary codes background, anonymous neon lighting style, realistic render, 8k resolution.`;
                    else if (command === 'neonlight' || command === 'neon') aiPrompt += `The text should be a glowing vibrant electric neon light sign on a dark textured brick wall background.`;
                    else if (command === 'greenneon') aiPrompt += `The text should be glowing in intense alien matrix green neon lights, futuristic cyberpunk concept.`;
                    else if (command === 'dragonball') aiPrompt += `The text should be in the epic style of anime Dragon Ball Z, blazing yellow energy aura aura, super saiyan theme.`;
                    else if (command === 'naruto') aiPrompt += `The text should be styled after Naruto anime title, orange ninja scroll flames style background.`;
                    else if (command === 'devil') aiPrompt += `The text should have red hot devil horns and tail, dark hell flames, cinematic scary dark atmosphere.`;
                    else if (command === 'gold' || command === 'whitegold') aiPrompt += `The text should be crafted in luxury shiny liquid 24k gold metal plating, professional clean background, high reflections.`;
                    else if (command === 'thunder' || command === 'thor') aiPrompt += `The text should be struck by powerful electric blue lightning bolts, dark storm clouds cinematic background.`;
                    else if (command === 'glitch') aiPrompt += `The text should have a digital breakdown glitch effect, chromatic aberration, retro vaporwave hacking terminal style.`;
                    else if (command === 'harrypotter') aiPrompt += `The text should be written in magical wizarding metallic texture font, mystical smoke and sparks around it.`;
                    else if (command === 'water') aiPrompt += `The text should be beautifully sculpted out of crystal clear splashing water drops, refreshing marine background.`;
                    else if (command === 'snow') aiPrompt += `The text should be covered in frosted ice crystals and soft white winter snow, cold arctic atmosphere.`;
                    else if (command === 'transformer') aiPrompt += `The text should be designed as a mechanical robot steel transformer texture, metallic armor plates.`;
                    else if (command === 'purple') aiPrompt += `The text should be glowing in deep galaxy purple and violet neon cosmic nebula effects.`;
                    else {
                        aiPrompt += `The theme of the graphic artwork must be based on a premium "${command}" concept, high quality cinematic render, 4k.`;
                    }

                    // Routing the prompt to David Cyril's DALL-E AI endpoint
                    const imageUrl = `https://apis.davidcyril.name.ng/endpoints/ai/dalle?q=${encodeURIComponent(aiPrompt)}`;

                    // Dispatching generated AI image artwork inside our master layout
                    await sock.sendMessage(remoteJid, {
                        image: { url: imageUrl },
                        caption: `╭━━━〔 🎨 *AI GRAPHIC GENERATOR* 〕━━━⬣
┃
┃ 📌 *Template:* \`${command.toUpperCase()}\`
┃ 📝 *Text Input:* _${targetText}_
┃
┃ 🔗 *Deploy:* https://jampanbot.vercel.app
┃ 👑 *Owner:* Kelvin Jampan
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`,
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterName: 'JAMPAN-XMD SYSTEM 🚀',
                                newsletterJid: '120363409292513352@newsletter',
                                serverMessageId: 144
                            }
                        }
                    }, { quoted: m });

                } catch (err) {
                    console.log("Graphic Engine Error:", err);
                    await replyWithStyle(sock, remoteJid, '❌ The AI graphic engine is currently processing heavy loads. Please try again later.', m);
                }
            }
            break;
            
   case 'hack': {

await react('☠️')

await replyWithStyle(sock, remoteJid, `
╭━━〔 ☠️ HACK NODE 〕━━⬣
┃
┃ ⚡ Accessing target...
┃ 💻 Injecting payload...
┃ 📡 Bypassing firewall...
┃ 🔓 Root access granted
┃
╰━━〔 JAMPAN-XMD 〕━━⬣
`, m)

}
break;



case 'matrix': {

await react('🧠')

await replyWithStyle(sock, remoteJid, `
1010101010101010

⚡ MATRIX NODE ACTIVE

> Anonymous signal connected...
> Identity hidden successfully.

☠️ JAMPAN-XMD
`, m)

}
break;



case 'darkweb': {

await react('🌑')

await replyWithStyle(sock, remoteJid, `
╭━━〔 🌑 DARK WEB 〕━━⬣
┃
┃ ☠️ Hidden tunnel connected
┃ 📡 Private node active
┃ 🔥 Anonymous access granted
┃
╰━━〔 SYSTEM ONLINE 〕━━⬣
`, m)

}
break;



case 'system': {

await react('⚡')

await replyWithStyle(sock, remoteJid, `
╭━━〔 ⚡ SYSTEM INFO 〕━━⬣
┃
┃ 💻 CPU : ONLINE
┃ 📡 NETWORK : STABLE
┃ 🔥 STATUS : ACTIVE
┃ 🚀 MODE : PUBLIC
┃ ☠️ SECURITY : ENABLED
┃
╰━━〔 JAMPAN-XMD 〕━━⬣
`, m)

}
break;



case 'anonymous': {

await react('👤')

await replyWithStyle(sock, remoteJid, `
☠️ Anonymous mode enabled

> Identity masked successfully.
> Signal encrypted.

⚡ JAMPAN-XMD
`, m)

}
break;

            // ============================================
            // 📡 HIGH-SPEED JID EXTRACTOR NODE (GROUP & CHANNEL)
            // ============================================
            case 'getjid':
            case 'jid': {
                try {
                    await react('🆔');
                    const link = args[0];

                    // If the user didn't provide any link
                    if (!link) {
                        return await replyWithStyle(
                            sock, 
                            remoteJid, 
                            `⚠️ *Please provide a Group or Channel link!*\n\n*Usage:*\n\`${prefix}jid https://chat.whatsapp.com/...\`\n\`${prefix}jid https://whatsapp.com/channel/...\``, 
                            m
                        );
                    }

                    // Let the user know the node is scanning the link
                    await sock.sendPresenceUpdate('composing', remoteJid);

                    // --- PART 1: WHATSAPP GROUP LINK ---
                    if (link.includes("chat.whatsapp.com")) {
                        try {
                            // Extract the invite code, ignoring tracking parameters like ?src=
                            const code = link.split("chat.whatsapp.com/")[1].split("?")[0]; 

                            // Fetch group details from WhatsApp servers
                            const metadata = await sock.groupGetInviteInfo(code);
                            const creationDate = new Date(metadata.creation * 1000).toLocaleString('en-US');
                            const groupOwner = metadata.owner ? `${metadata.owner.split('@')[0]}` : 'Unknown';

                            const groupPayload = `╭━━━〔 👥 *GROUP JID FOUND* 〕━━━⬣
┃
┃ 📝 *Name:* ${metadata.subject}
┃ 📅 *Created On:* _${creationDate}_
┃ 👤 *Creator:* @${groupOwner}
┃
┃ > \`\`\`JID: ${metadata.id}@g.us\`\`\`
┃
┃ 🔗 *Deploy:* https://jampanbot.vercel.app
┃ 👑 *Owner:* Kelvin Jampan
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`;

                            await sock.sendMessage(remoteJid, {
                                text: groupPayload,
                                mentions: metadata.owner ? [metadata.owner] : [],
                                contextInfo: {
                                    forwardingScore: 9999,
                                    isForwarded: true,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterName: 'JAMPAN-XMD SYSTEM 🚀',
                                        newsletterJid: '120363409292513352@newsletter',
                                        serverMessageId: 144
                                    }
                                }
                            }, { quoted: m });

                        } catch (err) {
                            console.error(err);
                            await replyWithStyle(sock, remoteJid, "❌ *Failed to fetch Group JID.*\n\nEnsure the link is valid and active.", m);
                        }
                    } 
                    // --- PART 2: WHATSAPP CHANNEL / NEWSLETTER LINK ---
                    else if (link.includes("whatsapp.com/channel")) {
                        try {
                            // Extract the channel code, ignoring tracking parameters
                            const code = link.split("whatsapp.com/channel/")[1].split("?")[0];

                            // Fetch channel metadata via Baileys built-in function
                            const channelMetadata = await sock.newsletterInfoWithInvite(code);
                            const subscribersCount = channelMetadata.subscribers || 'Hidden/Unknown';

                            const channelPayload = `╭━━━〔 📢 *CHANNEL JID FOUND* 〕━━━⬣
┃
┃ 📝 *Name:* ${channelMetadata.name}
┃ 👥 *Followers:* _${subscribersCount}_
┃
┃ > \`\`\`JID: ${channelMetadata.id}@newsletter\`\`\`
┃
┃ 🔗 *Deploy:* https://jampanbot.vercel.app
┃ 👑 *Owner:* Kelvin Jampan
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`;

                            await sock.sendMessage(remoteJid, {
                                text: channelPayload,
                                contextInfo: {
                                    forwardingScore: 9999,
                                    isForwarded: true,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterName: 'JAMPAN-XMD SYSTEM 🚀',
                                        newsletterJid: '120363409292513352@newsletter',
                                        serverMessageId: 144
                                    }
                                }
                            }, { quoted: m });

                        } catch (err) {
                            console.error(err);
                            await replyWithStyle(sock, remoteJid, "❌ *Failed to fetch Channel JID.*\n\nEnsure the channel link is active and valid.", m);
                        }
                    } 
                    // --- IF LINK IS INVALID ---
                    else {
                        await replyWithStyle(sock, remoteJid, "⚠️ *The link provided is neither a valid WhatsApp Group nor a Channel link!*", m);
                    }

                } catch (globalErr) {
                    console.log("JID Command Error:", globalErr);
                    await replyWithStyle(sock, remoteJid, "❌ *An unexpected error occurred while parsing the network link.*", m);
                }
            }
            break;
            
                                                                                                                                                             // ================================
            // PROFILE PICTURE RETRIEVER
            // ================================
            case 'pp':
            case 'profilepic': {
                try {
                    await react('📸');
                    let targetUser = remoteJid;
                    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;

                    if (mentioned && mentioned.length > 0) targetUser = mentioned[0];
                    else if (m.message?.extendedTextMessage?.contextInfo?.participant) targetUser = m.message.extendedTextMessage.contextInfo.participant;

                    const ppUrl = await sock.profilePictureUrl(targetUser, 'image').catch(() => null);
                    if (!ppUrl) return await replyWithStyle(sock, remoteJid, '❌ User has no profile picture.', m);

                    await sock.sendMessage(remoteJid, {
                        image: { url: ppUrl },
                        caption: `📸 Profile Picture\n\nUser: @${targetUser.split('@')[0]}\n\nRetrieved by JAMPAN-XMD`,
                        mentions: [targetUser]
                    }, { quoted: m });
                } catch (err) {
                    await replyWithStyle(sock, remoteJid, '❌ Failed to fetch profile picture.', m);
                }
            }
            break;

        } // END SWITCH
    } catch (globalErr) {
        console.log("Global Handler Error:", globalErr);
    }
};

module.exports = { handleCommands };
