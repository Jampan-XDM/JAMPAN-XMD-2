const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const pino = require('pino');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const config = require('./config');
const { handleCases } = require('./case'); // Tunaita file la cases hapa
const { fetchAIResponse } = require('./api'); // Tunaita API hapa

const prefix = config.PREFIX || '.';

const runtime = (seconds) => {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return ((d > 0 ? d + 'd ' : '') + (h > 0 ? h + 'h ' : '') + (m > 0 ? m + 'm ' : '') + s + 's');
};

const replyWithStyle = async (sock, jid, text, m) => {
    try {
        await sock.sendMessage(jid, {
            text: text,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363409292513352@newsletter',
                    serverMessageId: 144,
                    newsletterName: 'JAMPAN-XMD OFFICIAL 🚀' // IVI NDIVYO INAVYOTAKIWA (Imeongezwa single quote ya kufunga)
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
        }, { quoted: m });
    } catch (e) {
        console.log('Reply Error:', e.message);
    }
};

if (!global.msgCache) global.msgCache = new Map();

const handleCommands = async (sock, m, settings) => {
    try {
        if (!m || !m.message) return;

        const remoteJid = m.key.remoteJid || '';
        const sender = m.key.participant || remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');
        const isOwner = sender.includes(settings.ownerNumber) || m.key.fromMe;

        const messageType = Object.keys(m.message)[0];
        let body = '';
        if (messageType === 'conversation') body = m.message.conversation;
        else if (messageType === 'extendedTextMessage') body = m.message.extendedTextMessage.text;
        else if (messageType === 'imageMessage') body = m.message.imageMessage.caption;
        else if (messageType === 'videoMessage') body = m.message.videoMessage.caption;

        // Anti-Delete Tracker Cache Layer
        if (m.key && m.key.id) {
            global.msgCache.set(m.key.id, m);
            setTimeout(() => global.msgCache.delete(m.key.id), 2 * 60 * 60 * 1000);
        }

        // Processing Anti-Delete Interception
        if (messageType === 'protocolMessage' && m.message.protocolMessage.type === 3) {
            if (global.antidelete !== false) {
                const revokedKey = m.message.protocolMessage.key;
                const deletedMessage = global.msgCache.get(revokedKey.id);
                if (deletedMessage) {
                    // Logic ya kurecover inabaki hapa ili kulinda miundombinu
                    // (Inatumia ile ile uliyoweka kwenye faili lako kuu)
                }
            }
        }

        if (!body) return;

        const react = async (emoji) => {
            try { await sock.sendMessage(remoteJid, { react: { text: emoji, key: m.key } }); } catch (err) {}
        };

        if (settings.autoTyping) await sock.sendPresenceUpdate('composing', remoteJid);
        if (settings.autoRecord) await sock.sendPresenceUpdate('recording', remoteJid);

        // ============================================
        // AUTONOMOUS CHATBOT (NO PREFIX) - USES api.js
        // ============================================
        if (!global.chatbotSettings) global.chatbotSettings = { mode: 'off' };
        if (!global.autonomousChats) global.autonomousChats = {};

        const isUserInRizzSession = global.autonomousChats[sender] && global.autonomousChats[sender].includes(`System: Gen-Z Rizz Mode Active`);

        if (!body.startsWith(prefix) && (global.chatbotSettings.mode !== 'off' || isUserInRizzSession)) {
            const chatbotMode = global.chatbotSettings.mode;
            let shouldReply = false;

            if (!isGroup && !m.key.fromMe && (chatbotMode === 'inbox' || chatbotMode === 'all' || isUserInRizzSession)) shouldReply = true;
            if ((chatbotMode === 'group' || chatbotMode === 'all') && isGroup) {
                const quotedMsg = m.message?.extendedTextMessage?.contextInfo;
                if (quotedMsg?.participant === sock.user.id || quotedMsg?.mentionedJid?.includes(sock.user.id)) shouldReply = true;
            }

            if (shouldReply) {
                await sock.sendPresenceUpdate('composing', remoteJid);
                if (!global.autonomousChats[sender]) global.autonomousChats[sender] = [];
                global.autonomousChats[sender].push(`User: ${body}`);
                if (global.autonomousChats[sender].length > 8) global.autonomousChats[sender].shift();

                const conversationContext = global.autonomousChats[sender].join('\n');
                let identityPrompt = `You are JAMPAN-XMD, a highly intelligent AI chatbot built by Kelvin Jampan (a 19-year-old developer from Tanzania). Context:\n${conversationContext}`;

                if (isUserInRizzSession) {
                    identityPrompt = `You are JAMPAN-XMD, acting as a smooth anonymous Gen-Z secret admirer representative. Use heavy slang (fr, cooked, rizzler). Context:\n${conversationContext}`;
                }

                // INAITA KUTOKA api.js
                let chatbotReply = await fetchAIResponse(identityPrompt, body);
                global.autonomousChats[sender].push(`Bot: ${chatbotReply}`);

                await sock.sendMessage(remoteJid, { text: `> \`\`\`${chatbotReply}\`\`\`` }, { quoted: m });
                return;
            }
        }

        if (!body.startsWith(prefix)) return;

        // Tunatuma data zote kwenda kwenye file la case.js
        // Tunaongeza "const isExecuted =" ili kuona kama case ilipatikana au la
        const isExecuted = await handleCases({ sock, m, body, prefix, remoteJid, sender, isGroup, isOwner, react, replyWithStyle, runtime, settings });

        // =================================================================
        // 🚨 UNKNOWN COMMAND HANDLER (MARKETING ENGINE FOR DEPLOYMENT)
        // =================================================================
        // Kama handleCases haijarudisha true (yaani command haipo kwenye case.js)
        if (!isExecuted) {
            const command = body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();
            
            await react('⚠️');
            
            const errMsg = `*⚠️ JAMPAN-XMD ERROR SYSTEM *

❌ *No command found for:* \`${prefix}${command}\`

🤖 _Umekosea kuandika au command hiyo haipo kwenye chombo hiki kwa sasa. Angalia herufi zako vizuri au tumia \`${prefix}menu\` kuona list kamili!_`;

            // Muundo wa kisasa kabisa wa Native Flow Buttons (URL Link Type)
            const buttonMessage = {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: {
                            body: { text: errMsg },
                            footer: { text: '🤖 Powered by JAMPAN-XMD Core Engine' },
                            header: {
                                title: '⚡ INVALID COMMAND DETECTED',
                                hasMediaAttachment: false
                            },
                            nativeFlowMessage: {
                                buttons: [
                                    {
                                        name: "cta_url", // Njia maalum ya kufungua Link/URL
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "🚀 TAP TO DEPLOY BOT FREE",
                                            url: "https://jampanbot.vercel.app",
                                            merchant_url: "https://jampanbot.vercel.app"
                                        })
                                    },
                                    {
                                        name: "quick_reply", // Button ya dharura ya kurudi menu
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "📋 VIEW BOT MENU",
                                            id: `${prefix}menu`
                                        })
                                    }
                                ]
                            },
                            contextInfo: {
                                forwardingScore: 9999,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterName: 'JAMPAN-XMD OFFICIAL 🚀',
                                    newsletterJid: '120363409292513352@newsletter',
                                },
                                externalAdReply: {
                                    title: '⚡ JAMPAN-XMD AUTOMATION NODE',
                                    body: 'Build & Deploy your own Bot instantly.',
                                    thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                                    sourceUrl: 'https://jampanbot.vercel.app',
                                    mediaType: 1,
                                    renderLargerThumbnail: false
                                }
                            }
                        }
                    }
                }
            };

            // Tuma ujumbe wenye button zote mbili (Link + Quick Reply)
            await sock.relayMessage(remoteJid, buttonMessage, {});
        }

    } catch (globalErr) {
        console.log("Global Handler Error:", globalErr);
    }
};

module.exports = { handleCommands };
