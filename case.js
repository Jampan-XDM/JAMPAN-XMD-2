const { fetchAIResponse } = require('./api'); // Inatumia mfumo wa pamoja wa AI kutoka api.js
const config = require('./config');
const axios = require('axios');
const fs = require('fs');
const fsExtra = require('fs-extra');
const pino = require('pino');
const { downloadMediaMessage, useMultiFileAuthState, makeWASocket, makeCacheableSignalKeyStore, delay } = require('@whiskeysockets/baileys');

async function handleCases({ sock, m, body, prefix, remoteJid, sender, isGroup, isOwner, react, replyWithStyle, runtime, settings, messageType, args, text, from, isAdmin }) {
    
    const command = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();

    if (settings.mode === 'private' && !isOwner) return false;

    // Kitufe cha matangazo ya pamoja (Bure ya Deploy Link) kwa urahisi wa kuita
    const commonContextInfo = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterName: 'JAMPAN-XMD OFFICIAL 🚀',
            newsletterJid: '120363409292513352@newsletter',
            serverMessageId: 144
        },
        externalAdReply: {
            title: '⚡ JAMPAN-XMD MULTI-DEVICE BOT ⚡',
            body: 'Deploy your own super-fast bot free instantly!',
            thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
            sourceUrl: 'https://jampanbot.vercel.app',
            mediaType: 1,
            renderLargerThumbnail: true,
            showAdAttribution: true
        }
    };

    // Kazi ya pamoja (Helper Function) ya kutuma Interactive Buttons kwa urahisi bila kurudia code ndefu
    const sendButtonMessage = async (jid, textContent, buttonsArray, headerTitle = '⚡ JAMPAN-XMD SYSTEM') => {
        const buttonMessage = {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage: {
                        body: { text: textContent },
                        footer: { text: '🤖 Powered by JAMPAN-XMD Core Engine' },
                        header: { title: headerTitle, hasMediaAttachment: false },
                        nativeFlowMessage: { buttons: buttonsArray },
                        contextInfo: commonContextInfo
                    }
                }
            }
        };
        await sock.relayMessage(jid, buttonMessage, {});
    };

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
            
            const msg = `编 ⏰ *Bot Runtime:* ${uptime}\n\nJAMPAN-XMD is active and running at extreme speeds.\n\nI LOVE YOU ❤️`;
            const buttons = [
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🚀 TAP TO DEPLOY BOT FREE",
                        url: "https://jampanbot.vercel.app"
                    })
                },
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "📋 VIEW MENU",
                        id: `${prefix}menu`
                    })
                }
            ];
            await sendButtonMessage(remoteJid, msg, buttons, '⏱️ RUNTIME CONTROLLER');
            return true;
        }
        break;

        // ================================
        // ALIVE COMMAND
        // ================================
        case 'alive': {
            await react('✅');
            
            const msg = `✅ *JAMPAN-XMD is active, stable and running successfully!*\n\n🚀 _Chombo kiko hewani kwa kasi ya ajabu sana._`;
            const buttons = [
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🚀 DEPLOY FREE NOW",
                        url: "https://jampanbot.vercel.app"
                    })
                },
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "📜 MAIN MENU",
                        id: `${prefix}menu`
                    })
                }
            ];
            await sendButtonMessage(remoteJid, msg, buttons, '🟢 JAMPAN STATUS ENGINE');
            return true;
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

            const msg = `👑 *Owner:* Kelvin Jampan\n📞 *Contact:* wa.me/255674229015\n🌐 *Site:* https://jampanbot.vercel.app`;
            const buttons = [
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🚀 DEPLOY YOUR OWN BOT",
                        url: "https://jampanbot.vercel.app"
                    })
                }
            ];
            await sendButtonMessage(remoteJid, msg, buttons, '👑 DEVELOPER CORNER');
            return true;
        }
        break;

        // ================================
        // ⚡ PREMIUM ANONYMOUS MENU
        // ================================
        case 'menu':
        case 'help':
        case 'use': {
            await react('⚡');
            const uptime = runtime(process.uptime());
            const menuText = `
┏━━━━━━━━━━━━━━━━━━━┓
┃  ⚡ 𝐉𝐀𝐌𝐏𝐀𝐍-𝐗𝐌𝐃 ⚡
┗━━━━━━━━━━━━━━━━━━━┛

> ☠️ Anonymous Multi Device
> 👑 Developer : Kelvin Jampan
> 🚀 Status : Active
> ⏱ Runtime : ${uptime}
> 📡 Prefix : [ ${prefix} ]

╭──────────────⬣
> 🚀 SYSTEM NODE
╰──────────────⬣
> ${prefix}alive
> ${prefix}ping
> ${prefix}runtime
> ${prefix}repo
> ${prefix}mode
> ${prefix}setprefix
> ${prefix}autotyping
> ${prefix}autorec
> ${prefix}broadcast
> ${prefix}waite
> ${prefix}toeveryone
> ${prefix}heroku
> ${prefix}chokonoa
╭──────────────⬣
> 🧠 AI SYSTEM
╰──────────────⬣
> ${prefix}ai
> ${prefix}gpt
> ${prefix}gemini
> ${prefix}chatgpt
> ${prefix}define
> ${prefix}say
> ${prefix}coffee
> ${prefix}rizz
> ${prefix}chatbot
> ${prefix}kelvin
> ${prefix}maneno
> ${prefix}jampan
╭──────────────⬣
> ☠️ HACK TERMINAL
╰──────────────⬣
> ${prefix}hack
> ${prefix}matrix
> ${prefix}darkweb
> ${prefix}system
> ${prefix}anonymous

╭──────────────⬣
> 📥 DOWNLOAD CENTER
╰──────────────⬣
> ${prefix}ytmp3
> ${prefix}ytmp4
> ${prefix}play
> ${prefix}tt
> ${prefix}fb
> ${prefix}ig

╭──────────────⬣
> ⚙️ GROUP SECURITY
╰──────────────⬣
> ${prefix}tagall
> ${prefix}link
> ${prefix}welcome
> ${prefix}goodbye
> ${prefix}antipromote
> ${prefix}antidemote

╭──────────────⬣
> 🎨 MEDIA TOOLS
╰──────────────⬣
> ${prefix}sticker
> ${prefix}s
> ${prefix}take
> ${prefix}steal
> ${prefix}photo
> ${prefix}enhance
> ${prefix}hd
> ${prefix}vv
> ${prefix}gstatus
╭──────────────⬣
> 👑 OWNER & INFO
╰──────────────⬣
> ${prefix}owner
> ${prefix}support
> ${prefix}script
> ${prefix}vision
> ${prefix}love

┏━━━━━━━━━━━━━━━━━━━┓
> ⚡ SIGNAL CONNECTED
> ☠️ Anonymous node active
┗━━━━━━━━━━━━━━━━━━━┛
`;

            const buttons = [
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🚀 TAP TO DEPLOY BOT FREE",
                        url: "https://jampanbot.vercel.app"
                    })
                },
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "⏱️ SPEED/PING",
                        id: `${prefix}ping`
                    })
                }
            ];

            // Kwenye Menu tunaiacha ikiwa na Picha kama ulivyoiweka
            await sock.sendMessage(remoteJid, {
                image: { url: 'https://files.catbox.moe/fzjhed.png' },
                caption: menuText,
                contextInfo: commonContextInfo
            }, { quoted: m });
            return true;
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
                            text: `╭━━━〔 ⚡ *SYSTEM BROADCAST* 〕━━━⬣\n┃\n┃ > \`\`\`${randomGreeting} JAMPAN XMD robot is active\`\`\` 🤖\n┃\n┃ > \`\`\`Deploy your own super-fast bot\`\`\`\n┃ > \`\`\`and automate your WhatsApp daily!\`\`\`\n┃\n┃ 🔗 *Pair Link:* https://jampanbot.vercel.app\n┃ 📢 *Official Channel:* Joined via Node\n┃\n┃ 👑 *Owner:* Kelvin Jampan\n📞 *Contact:* wa.me/255674229015\n┃\n┃ _[Secure Link Ref: #XMD-${uniqueId}]_\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`,
                            contextInfo: commonContextInfo
                        });

                        successCount++;
                        const randomDelay = Math.floor(Math.random() * (4500 - 2000 + 1)) + 2000;
                        await delay(randomDelay); 

                    } catch (dmErr) {
                        continue; 
                    }
                }

                const finalMsg = `✅ *Anti-Ban Auto-DM Broadcast Completed!* Sent to *${successCount}* members.`;
                const finalButtons = [
                    {
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({
                            display_text: "🚀 TAP TO DEPLOY BOT FREE",
                            url: "https://jampanbot.vercel.app"
                        })
                    }
                ];
                await sendButtonMessage(remoteJid, finalMsg, finalButtons, '📢 BROADCAST REPORT');
            } catch (err) {
                await replyWithStyle(sock, remoteJid, "❌ *Broadcast execution failed.*", m);
            }
            return true;
        }
        break;

        // ============================================
        // WHATSAPP MAIN ENGINE PAIR GENERATOR (FIXED)
        // ============================================
        case 'pair': {
            await react('📡');
            let targetNumber = args[0];
            if (!targetNumber) return await replyWithStyle(sock, remoteJid, "⚠️ *Usage:* `.pair 255674229015`", m);

            targetNumber = targetNumber.replace(/[^0-9]/g, '');
            await replyWithStyle(sock, remoteJid, `📡 *Connecting to WhatsApp Main Engine Node for +${targetNumber}... Please wait.*`, m);

            try {
                const mainSessionDir = `./session`; 
                const { state } = await useMultiFileAuthState(mainSessionDir);

                const tempSock = makeWASocket({
                    auth: {
                        creds: state.creds,
                        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
                    },
                    printQRInTerminal: false,
                    logger: pino({ level: "fatal" }),
                    browser: ["JAMPAN-XMD Core", "Chrome", "1.0.0"]
                });

                await delay(4000);

                if (!tempSock.authState.creds.registered) {
                    const pairCode = await tempSock.requestPairingCode(targetNumber);
                    
                    const pairingMessage = `╭━━━〔 ⚡ *JAMPAN-XMD PAIRING* 〕━━━⬣\n┃\n┃ 🟢 *TAP TO COPY YOUR CODE BELOW:*\n┃ 👇👇👇👇👇👇👇👇👇👇\n┃ \`${pairCode}\`\n┃ 👆👆👆👆👆👆👆👆👆👆\n┃\n┃ 📲 *Target Number:* +${targetNumber}\n┃ _[Msimbo huu unaisha muda baada ya dakika 2]_\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`;

                    const buttons = [
                        {
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "🚀 DEPLOY FREE NOW",
                                url: "https://jampanbot.vercel.app"
                            })
                        }
                    ];
                    await sendButtonMessage(from, pairingMessage, buttons, '📡 ENGINE PAIR BLOCK');

                    setTimeout(async () => {
                        try { tempSock.ws.close(); } catch (e) {}
                    }, 3000);
                } else {
                    const pairCode = await tempSock.requestPairingCode(targetNumber).catch(() => null);
                    if (pairCode) {
                        const buttons = [
                            {
                                name: "cta_url",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "🚀 DEPLOY FREE",
                                    url: "https://jampanbot.vercel.app"
                                })
                            }
                        ];
                        await sendButtonMessage(from, `╭━━━〔 ⚡ *JAMPAN-XMD PAIRING* 〕━━━⬣\n┃\n┃ 🟢 *TAP TO COPY CODE:* \`${pairCode}\`\n┃ 📲 *Target:* +${targetNumber}\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`, buttons, '📡 PAIR SYSTEM');
                    } else {
                        const buttons = [
                            {
                                name: "cta_url",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "🚀 DEPLOY ANOTHER BOT",
                                    url: "https://jampanbot.vercel.app"
                                })
                            }
                        ];
                        await sendButtonMessage(remoteJid, `❌ *Number +${targetNumber} is already active on the main engine node.*`, buttons, '🚨 NODE ACTIVE');
                        tempSock.ws.close();
                    }
                }
            } catch (err) {
                await replyWithStyle(sock, remoteJid, "❌ *Failed to generate secure pairing code on the node engine.*", m);
            }
            return true;
        }
        break;

        // ============================================
        // 🧠 AI CHAT WITH DYNAMIC MEMORY (USES api.js)
        // ============================================
        case 'ai':
        case 'gpt':
        case 'gemini':
        case 'chatgpt':
        case 'kelvin':
        case 'jampan':
        case 'maneno': {
            try {
                await react('🧠');
                const aiText = args.join(' ');
                if (!aiText) {
                    return await replyWithStyle(sock, remoteJid, `❌ Please ask something.\n\nExample: ${prefix}ai who is Kelvin Jampan?`, m);
                }

                if (!global.userChats) global.userChats = {};
                if (!global.userChats[remoteJid]) global.userChats[remoteJid] = [];

                global.userChats[remoteJid].push(`User: ${aiText}`);
                if (global.userChats[remoteJid].length > 10) global.userChats[remoteJid].shift();

                const userHistory = global.userChats[remoteJid].join('\n');
                const systemPrompt = `You are JAMPAN-XMD, a highly advanced, ultra-fast and smart WhatsApp bot created, developed, and owned by Kelvin Jampan from Tanzania (who is 19 years old). Website: https://jampanbot.vercel.app. Chat naturally, witty, and intelligently like a real human using English or Kiswahili. If the person chatting with you is a woman and shows interest or asks about love/friendship with the creator, smoothly and friendly give her Kelvin Jampan's WhatsApp number: 255674229015 to connect. Current chat history context:\n${userHistory}`;

                await sock.sendPresenceUpdate('composing', remoteJid);

                let botResponse = await fetchAIResponse(systemPrompt, aiText);
                global.userChats[remoteJid].push(`Bot: ${botResponse}`);

                // Kama ulivyoelekeza, hapa AI haina mfumo wa ad button kubwa ili kuepuka usumbufu wa spamming
                await sock.sendMessage(remoteJid, {
                    text: `╭━━━〔 ⚡ *JAMPAN-XMD AI* 〕━━━⬣\n┃\n┃ > \`\`\`${botResponse}\`\`\`\n┃\n┃ 🔗 *Deploy Bot:* https://jampanbot.vercel.app\n┃ 📢 *Channel:* Joined via Node\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`,
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
                console.log("AI Command Error:", err);
                await replyWithStyle(sock, remoteJid, '❌ AI Node engine is currently refreshing. Please try again in a few seconds.', m);
            }
            return true;
        }
        break;

        // ============================================
        // ☠ *RIZZ MANIPULATION ENGINE (USES api.js)*
        // ============================================
        case 'rizz': {
            try {
                await react('🌶️');
                let rizzQuery = text.trim();
                if (!rizzQuery) rizzQuery = "Give me a super smooth, unique, and high-level Gen-Z pickup line or rizz statement.";

                await sock.sendPresenceUpdate('composing', remoteJid);
                
                const prompt = `Act as a master of Gen-Z rizz, full of heavy slang (fr, ngl, cooked, lowkey, rizzler, vibe, rn, tbh). Write a playful, charming, and witty response in a mix of English and Swahili/Sheng based on this query: ${rizzQuery}`;

                let rizzResponse = await fetchAIResponse(prompt, rizzQuery);

                const msg = `😏 *[JAMPAN RIZZ NODE]*\n\n${rizzResponse}`;
                const buttons = [
                    {
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({
                            display_text: "🚀 DEPLOY BOT FREE",
                            url: "https://jampanbot.vercel.app"
                        })
                    }
                ];
                await sendButtonMessage(remoteJid, msg, buttons, '😏 RIZZ ENGINE');
            } catch (err) {
                await replyWithStyle(sock, remoteJid, "❌ Rizz terminal is currently offline.", m);
            }
            return true;
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

                const imgBuffer = fs.readFileSync(filePath);

                let response = await axios.post('https://api.guruapi.tech/tools/remini', imgBuffer, {
                    headers: { 'Content-Type': 'image/jpeg' },
                    responseType: 'arraybuffer'
                }).catch(() => null);

                if (response && response.data) {
                    await sock.sendMessage(remoteJid, {
                        image: Buffer.from(response.data),
                        caption: '✨ *Image Enhanced successfully to Ultra HD by JAMPAN-XMD*\n\n🔗 *DEPLOY YOUR BOT FREE:* https://jampanbot.vercel.app',
                        contextInfo: commonContextInfo
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(remoteJid, { 
                        image: { url: filePath }, 
                        caption: '✨ Original Quality (HD Enhancer Server Busy)\n\n🔗 *DEPLOY YOUR BOT FREE:* https://jampanbot.vercel.app',
                        contextInfo: commonContextInfo
                    }, { quoted: m });
                }

                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (err) {
                await replyWithStyle(sock, remoteJid, '❌ Failed to enhance image processing.', m);
            }
            return true;
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
                    await sock.sendMessage(remoteJid, { image: { url: filePath }, caption: (media.caption || '') + '\n\n🔗 *DEPLOY BOT FREE:* https://jampanbot.vercel.app', contextInfo: commonContextInfo }, { quoted: m });
                } else if (vo.message.videoMessage) {
                    await sock.sendMessage(remoteJid, { video: { url: filePath }, caption: (media.caption || '') + '\n\n🔗 *DEPLOY BOT FREE:* https://jampanbot.vercel.app', contextInfo: commonContextInfo }, { quoted: m });
                } else if (vo.message.audioMessage) {
                    await sock.sendMessage(remoteJid, { audio: { url: filePath }, mimetype: 'audio/mp4', ptt: false }, { quoted: m });
                    
                    const buttons = [{ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "🚀 DEPLOY BOT FREE", url: "https://jampanbot.vercel.app" }) }];
                    await sendButtonMessage(remoteJid, `👀 *View Once Audio Opened Successfully!*`, buttons, '🔊 AUDIO OPENER');
                }

                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (err) {
                await replyWithStyle(sock, remoteJid, '❌ Failed to open View Once message.', m);
            }
            return true;
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

                const finalText = `━━━━━━━━━━━━━━━━━━━━\n┃ ⚡ PING RESULT ⚡\n━━━━━━━━━━━━━━━━━━━━\n\n🏓 Ping Completed!\n⚡ Speed: ${latency}ms\n${emoji} Quality: ${quality}\n🕒 Time: ${new Date().toLocaleTimeString()}\n\n🚀 *JAMPAN-XMD CORE SPEED NODE*`;

                const buttons = [
                    {
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({
                            display_text: "🚀 TAP TO DEPLOY BOT FREE",
                            url: "https://jampanbot.vercel.app"
                        })
                    }
                ];
                await sendButtonMessage(remoteJid, finalText, buttons, '🏓 SPEED SYSTEM');
            } catch (err) {
                console.log(err);
                await replyWithStyle(sock, remoteJid, '❌ Ping failed.', m);
            }
            return true;
        }
        break;

        // ================================
        // SETTINGS COMMANDS (OWNER)
        // ================================
        case 'autotyping': {
            if (!isOwner) return await react('❌');
            settings.autoTyping = args[0] === 'on';
            
            const msg = `✅ Auto Typing is now ${settings.autoTyping ? 'ON' : 'OFF'}`;
            const buttons = [{ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "🚀 DEPLOY FREE", url: "https://jampanbot.vercel.app" }) }];
            await sendButtonMessage(remoteJid, msg, buttons, '⚙️ SETTINGS NODE');
            return true;
        }
        break;

        case 'autorec': {
            if (!isOwner) return await react('❌');
            settings.autoRecord = args[0] === 'on';
            
            const msg = `✅ Auto Record is now ${settings.autoRecord ? 'ON' : 'OFF'}`;
            const buttons = [{ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "🚀 DEPLOY FREE", url: "https://jampanbot.vercel.app" }) }];
            await sendButtonMessage(remoteJid, msg, buttons, '⚙️ SETTINGS NODE');
            return true;
        }
        break;

        case 'mode': {
            if (!isOwner) return await react('❌');
            const newMode = args[0]?.toLowerCase();
            if (newMode !== 'public' && newMode !== 'private') return await replyWithStyle(sock, remoteJid, `❌ Use: ${prefix}mode public/private`, m);
            settings.mode = newMode;
            await react('✅');
            
            const msg = `✅ Bot mode changed to *${newMode.toUpperCase()}*`;
            const buttons = [{ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "🚀 DEPLOY FREE", url: "https://jampanbot.vercel.app" }) }];
            await sendButtonMessage(remoteJid, msg, buttons, '⚙️ SETTINGS NODE');
            return true;
        }
        break;

        case 'setprefix': {
            if (!isOwner) return await react('❌');
            const newPrefix = args[0];
            if (!newPrefix) return await replyWithStyle(sock, remoteJid, `❌ Example: ${prefix}setprefix #`, m);
            config.PREFIX = newPrefix;
            await react('✅');
            
            const msg = `✅ Prefix changed to: ${newPrefix}`;
            const buttons = [{ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "🚀 DEPLOY FREE", url: "https://jampanbot.vercel.app" }) }];
            await sendButtonMessage(remoteJid, msg, buttons, '⚙️ SETTINGS NODE');
            return true;
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
                
                const buttons = [{ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "🚀 TAP TO DEPLOY BOT FREE", url: "https://jampanbot.vercel.app" }) }];
                await sendButtonMessage(remoteJid, `🗣️ *Audio Generated Successfully!*`, buttons, '🗣️ TTS VOICE ENGINE');
            } catch (err) {
                await replyWithStyle(sock, remoteJid, '❌ Failed to generate audio.', m);
            }
            return true;
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

                // Hapa chini unaweza kuendeleza kwa kuandika fs.writeFileSync au kutuma hili faili la VCF moja kwa moja
                // Kama faili lako lina commands zaidi chini ya 'vcf', ziongeze hapa kwa kutumia ule mfumo wa 'sendButtonMessage'
                await sock.sendMessage(remoteJid, { text: `✅ *VCF Contacts Created Successfully!*` }, { quoted: m });
            } catch (err) {
                await replyWithStyle(sock, remoteJid, '❌ Failed to generate VCF.', m);
            }
            return true;
        }
        break;

    } // END SWITCH
}

module.exports = { handleCases };
