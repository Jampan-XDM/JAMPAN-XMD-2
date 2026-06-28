const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const pino = require('pino');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const config = require('./config');
const { handleCases } = require('./case'); // Tunaita file la cases hapa[span_1](start_span)[span_1](end_span)
const { fetchAIResponse } = require('./api'); // Tunaita API hapa[span_2](start_span)[span_2](end_span)

const prefix = config.PREFIX || '.';[span_3](start_span)[span_3](end_span)

const runtime = (seconds) => {[span_4](start_span)[span_4](end_span)
    seconds = Number(seconds);[span_5](start_span)[span_5](end_span)
    const d = Math.floor(seconds / (3600 * 24));[span_6](start_span)[span_6](end_span)
    const h = Math.floor((seconds % (3600 * 24)) / 3600);[span_7](start_span)[span_7](end_span)
    const m = Math.floor((seconds % 3600) / 60);[span_8](start_span)[span_8](end_span)
    const s = Math.floor(seconds % 60);[span_9](start_span)[span_9](end_span)
    return ((d > 0 ? d + 'd ' : '') + (h > 0 ? h + 'h ' : '') + (m > 0 ? m + 'm ' : '') + s + 's');[span_10](start_span)[span_10](end_span)
};[span_11](start_span)[span_11](end_span)

const replyWithStyle = async (sock, jid, text, m) => {[span_12](start_span)[span_12](end_span)
    try {[span_13](start_span)[span_13](end_span)
        await sock.sendMessage(jid, {[span_14](start_span)[span_14](end_span)
            text: text,[span_15](start_span)[span_15](end_span)
            contextInfo: {[span_16](start_span)[span_16](end_span)
                forwardingScore: 9999,[span_17](start_span)[span_17](end_span)
                isForwarded: true,[span_18](start_span)[span_18](end_span)
                forwardedNewsletterMessageInfo: {[span_19](start_span)[span_19](end_span)
                    newsletterJid: '120363409292513352@newsletter',[span_20](start_span)[span_20](end_span)
                    serverMessageId: 144,[span_21](start_span)[span_21](end_span)
                    newsletterName: 'JAMPAN-XMD OFFICIAL 🚀[span_22](start_span)'[span_22](end_span)
                },[span_23](start_span)[span_23](end_span)
                externalAdReply: {[span_24](start_span)[span_24](end_span)
                    title: '🚀 JAMPAN-XMD V3',[span_25](start_span)[span_25](end_span)
                    body: 'Kelvin Jampan | Dev Tech',[span_26](start_span)[span_26](end_span)
                    thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',[span_27](start_span)[span_27](end_span)
                    sourceUrl: 'https://youtube.com/@jampani-xmd?si=oLPtRqYf1h1ygSzt',[span_28](start_span)[span_28](end_span)
                    mediaType: 1,[span_29](start_span)[span_29](end_span)
                    renderLargerThumbnail: true,[span_30](start_span)[span_30](end_span)
                    showAdAttribution: true[span_31](start_span)[span_31](end_span)
                }[span_32](start_span)[span_32](end_span)
            }[span_33](start_span)[span_33](end_span)
        }, { quoted: m });[span_34](start_span)[span_34](end_span)
    } catch (e) {[span_35](start_span)[span_35](end_span)
        console.log('Reply Error:', e.message);[span_36](start_span)[span_36](end_span)
    }[span_37](start_span)[span_37](end_span)
};[span_38](start_span)[span_38](end_span)

if (!global.msgCache) global.msgCache = new Map();[span_39](start_span)[span_39](end_span)

const handleCommands = async (sock, m, settings) => {[span_40](start_span)[span_40](end_span)
    try {[span_41](start_span)[span_41](end_span)
        if (!m || !m.message) return;[span_42](start_span)[span_42](end_span)

        const remoteJid = m.key.remoteJid || '';[span_43](start_span)[span_43](end_span)
        const sender = m.key.participant || remoteJid;[span_44](start_span)[span_44](end_span)
        const isGroup = remoteJid.endsWith('@g.us');[span_45](start_span)[span_45](end_span)
        const isOwner = sender.includes(settings.ownerNumber) || m.key.fromMe;[span_46](start_span)[span_46](end_span)

        const messageType = Object.keys(m.message)[0];[span_47](start_span)[span_47](end_span)
        let body = '';[span_48](start_span)[span_48](end_span)
        if (messageType === 'conversation') body = m.message.conversation;[span_49](start_span)[span_49](end_span)
        else if (messageType === 'extendedTextMessage') body = m.message.extendedTextMessage.text;[span_50](start_span)[span_50](end_span)
        else if (messageType === 'imageMessage') body = m.message.imageMessage.caption;[span_51](start_span)[span_51](end_span)
        else if (messageType === 'videoMessage') body = m.message.videoMessage.caption;[span_52](start_span)[span_52](end_span)

        // Anti-Delete Tracker Cache Layer[span_53](start_span)[span_53](end_span)
        if (m.key && m.key.id) {[span_54](start_span)[span_54](end_span)
            global.msgCache.set(m.key.id, m);[span_55](start_span)[span_55](end_span)
            setTimeout(() => global.msgCache.delete(m.key.id), 2 * 60 * 60 * 1000);[span_56](start_span)[span_56](end_span)
        }[span_57](start_span)[span_57](end_span)

        // Processing Anti-Delete Interception[span_58](start_span)[span_58](end_span)
        if (messageType === 'protocolMessage' && m.message.protocolMessage.type === 3) {[span_59](start_span)[span_59](end_span)
            if (global.antidelete !== false) {[span_60](start_span)[span_60](end_span)
                const revokedKey = m.message.protocolMessage.key;[span_61](start_span)[span_61](end_span)
                const deletedMessage = global.msgCache.get(revokedKey.id);[span_62](start_span)[span_62](end_span)
                if (deletedMessage) {[span_63](start_span)[span_63](end_span)
                    // Logic ya kurecover inabaki hapa ili kulinda miundombinu[span_64](start_span)[span_64](end_span)
                    // (Inatumia ile ile uliyoweka kwenye faili lako kuu)[span_65](start_span)[span_65](end_span)
                }[span_66](start_span)[span_66](end_span)
            }[span_67](start_span)[span_67](end_span)
        }[span_68](start_span)[span_68](end_span)

        if (!body) return;[span_69](start_span)[span_69](end_span)

        const react = async (emoji) => {[span_70](start_span)[span_70](end_span)
            try { await sock.sendMessage(remoteJid, { react: { text: emoji, key: m.key } }); } catch (err) {}[span_71](start_span)[span_71](end_span)
        };[span_72](start_span)[span_72](end_span)

        if (settings.autoTyping) await sock.sendPresenceUpdate('composing', remoteJid);[span_73](start_span)[span_73](end_span)
        if (settings.autoRecord) await sock.sendPresenceUpdate('recording', remoteJid);[span_74](start_span)[span_74](end_span)

        // ============================================
        // AUTONOMOUS CHATBOT (NO PREFIX) - USES api.js[span_75](start_span)[span_75](end_span)
        // ============================================
        if (!global.chatbotSettings) global.chatbotSettings = { mode: 'off' };[span_76](start_span)[span_76](end_span)
        if (!global.autonomousChats) global.autonomousChats = {};[span_77](start_span)[span_77](end_span)

        const isUserInRizzSession = global.autonomousChats[sender] && global.autonomousChats[sender].includes(`System: Gen-Z Rizz Mode Active`);[span_78](start_span)[span_78](end_span)

        if (!body.startsWith(prefix) && (global.chatbotSettings.mode !== 'off' || isUserInRizzSession)) {[span_79](start_span)[span_79](end_span)
            const chatbotMode = global.chatbotSettings.mode;[span_80](start_span)[span_80](end_span)
            let shouldReply = false;[span_81](start_span)[span_81](end_span)

            if (!isGroup && !m.key.fromMe && (chatbotMode === 'inbox' || chatbotMode === 'all' || isUserInRizzSession)) shouldReply = true;[span_82](start_span)[span_82](end_span)
            if ((chatbotMode === 'group' || chatbotMode === 'all') && isGroup) {[span_83](start_span)[span_83](end_span)
                const quotedMsg = m.message?.extendedTextMessage?.contextInfo;[span_84](start_span)[span_84](end_span)
                if (quotedMsg?.participant === sock.user.id || quotedMsg?.mentionedJid?.includes(sock.user.id)) shouldReply = true;[span_85](start_span)[span_85](end_span)
            }[span_86](start_span)[span_86](end_span)

            if (shouldReply) {[span_87](start_span)[span_87](end_span)
                await sock.sendPresenceUpdate('composing', remoteJid);[span_88](start_span)[span_88](end_span)
                if (!global.autonomousChats[sender]) global.autonomousChats[sender] = [];[span_89](start_span)[span_89](end_span)
                global.autonomousChats[sender].push(`User: ${body}`);[span_90](start_span)[span_90](end_span)
                if (global.autonomousChats[sender].length > 8) global.autonomousChats[sender].shift();[span_91](start_span)[span_91](end_span)

                const conversationContext = global.autonomousChats[sender].join('\n');[span_92](start_span)[span_92](end_span)
                let identityPrompt = `You are JAMPAN-XMD, a highly intelligent AI chatbot built by Kelvin Jampan (a 19-year-old developer from Tanzania). Context:\n${conversationContext}`;[span_93](start_span)[span_93](end_span)

                if (isUserInRizzSession) {[span_94](start_span)[span_94](end_span)
                    identityPrompt = `You are JAMPAN-XMD, acting as a smooth anonymous Gen-Z secret admirer representative. Use heavy slang (fr, cooked, rizzler). Context:\n${conversationContext}`;[span_95](start_span)[span_95](end_span)
                }[span_96](start_span)[span_96](end_span)

                // INAITA KUTOKA api.js[span_97](start_span)[span_97](end_span)
                let chatbotReply = await fetchAIResponse(identityPrompt, body);[span_98](start_span)[span_98](end_span)
                global.autonomousChats[sender].push(`Bot: ${chatbotReply}`);[span_99](start_span)[span_99](end_span)

                await sock.sendMessage(remoteJid, { text: `> \`\`\`${chatbotReply}\`\`\`` }, { quoted: m });[span_100](start_span)[span_100](end_span)
                return;[span_101](start_span)[span_101](end_span)
            }[span_102](start_span)[span_102](end_span)
        }[span_103](start_span)[span_103](end_span)

        if (!body.startsWith(prefix)) return;[span_104](start_span)[span_104](end_span)

        // Tunatuma data zote kwenda kwenye file la case.js[span_105](start_span)[span_105](end_span)
        // Tunaongeza "const isExecuted =" ili kuona kama case ilipatikana au la
        const isExecuted = await handleCases({ sock, m, body, prefix, remoteJid, sender, isGroup, isOwner, react, replyWithStyle, runtime, settings });[span_106](start_span)[span_106](end_span)

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

    } catch (globalErr) {[span_107](start_span)[span_107](end_span)
        console.log("Global Handler Error:", globalErr);[span_108](start_span)[span_108](end_span)
    }[span_109](start_span)[span_109](end_span)
};[span_110](start_span)[span_110](end_span)

module.exports = { handleCommands };[span_111](start_span)[span_111](end_span)
