const { proto, getContentType } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { smsg, getGroupAdmins, formatp, taggz } = require('./lib/myfunc');
const config = require('./config');

const prefix = config.PREFIX || '.';

// ================================
// RUNTIME FORMATTER
// ================================
const runtime = (seconds) => {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return (d > 0 ? d + 'd ' : '') + (h > 0 ? h + 'h ' : '') + (m > 0 ? m + 'm ' : '') + s + 's';
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
                        newsletterName: 'JAMPAN-XMD OFFICIAL'
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

        await sock.sendMessage(
            jid,
            {
                audio: { url: 'https://files.catbox.moe/vmc7k3.mp3' },
                mimetype: 'audio/mpeg',
                ptt: false
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
        if (!m || !m.key) return;

        const remoteJid = m.key.remoteJid || '';
        const sender = m.key.participant || remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');
        const isOwner = sender.includes(settings.ownerNumber) || m.key.fromMe;

        // --- MESSAGE TYPE & BODY ---
        const messageType = m.message ? Object.keys(m.message)[0] : '';
        let body = '';
        if (messageType === 'conversation') body = m.message.conversation;
        else if (messageType === 'extendedTextMessage') body = m.message.extendedTextMessage.text;
        else if (messageType === 'imageMessage') body = m.message.imageMessage.caption;
        else if (messageType === 'videoMessage') body = m.message.videoMessage.caption;

        if (!body) return;

        // --- 1. AUTO PRESENCE ---
        if (settings.autoTyping) await sock.sendPresenceUpdate('composing', remoteJid);
        if (settings.autoRecord) await sock.sendPresenceUpdate('recording', remoteJid);

        // --- 2. COMMAND LOGIC ---
        if (!body.startsWith(prefix)) return;

        const command = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();
        const args = body.slice(prefix.length).trim().split(/ +/).slice(1);
        const text = args.join(' ');

        if (settings.mode === 'private' && !isOwner) return;

        switch (command) {
            case 'ping':
                await replyWithStyle(sock, remoteJid, `*JAMPAN-XMD* Iko Online 🚀\nRuntime: ${runtime(process.uptime())}`, m);
                break;

            case 'autotyping':
                if (!isOwner) return;
                settings.autoTyping = args[0] === 'on';
                await replyWithStyle(sock, remoteJid, `Auto Typing imewekwa: ${settings.autoTyping ? 'ON' : 'OFF'}`, m);
                break;

            case 'autorec':
                if (!isOwner) return;
                settings.autoRecord = args[0] === 'on';
                await replyWithStyle(sock, remoteJid, `Auto Recording imewekwa: ${settings.autoRecord ? 'ON' : 'OFF'}`, m);
                break;

            // ==========================================
            // YOUTUBE & GROUP STRATEGY COMMANDS
            // ==========================================

            case 'broadcast': // Tuma kwa groups zote
                if (!isOwner) return;
                const groups = Object.keys(await sock.groupFetchAllParticipating());
                await replyWithStyle(sock, remoteJid, `📢 Inaanza Broadcast kwenye groups ${groups.length}...`, m);
                
                for (let jid of groups) {
                    await sock.sendMessage(jid, { 
                        text: `*HABARI MTANZANIA!* 🇹🇿\n\nNaomba unisupport kwa kusubscribe YouTube Channel yangu ya *Jampani XMD* kwa mafunzo ya kijanja ya Bots na Coding.\n\n🔗 *SUBSCRIBE HAPA:* https://youtube.com/@jampani-xmd?si=oLPtRqYf1h1ygSzt\n\n_Asante kwa support yako!_` 
                    });
                    await new Promise(resolve => setTimeout(resolve, 3500)); // Delay ya usalama
                }
                await replyWithStyle(sock, remoteJid, "✅ Broadcast imekamilika!", m);
                break;

            case 'toeveryone': // DM kila member wa group
                if (!isOwner) return;
                if (!isGroup) return replyWithStyle(sock, remoteJid, "Tumia command hii ndani ya Group!", m);

                const groupMetadata = await sock.groupMetadata(remoteJid);
                const participants = groupMetadata.participants;
                
                await replyWithStyle(sock, remoteJid, `🚀 Inatuma promo inbox kwa members ${participants.length}...`, m);

                for (let mem of participants) {
                    if (mem.id === sock.user.id) continue;
                    
                    try {
                        await sock.sendMessage(mem.id, { 
                            text: `Habari, naomba unisupport kwa kusubscribe channel yangu ya YouTube ya *Jampani XMD*:\n\n👉 https://youtube.com/@jampani-xmd?si=oLPtRqYf1h1ygSzt\n\nAsante sana!` 
                        });
                        await new Promise(resolve => setTimeout(resolve, 5000)); // Delay ya kuzuia BAN
                    } catch (e) {
                        console.log("Error DM: " + mem.id);
                    }
                }
                await replyWithStyle(sock, remoteJid, "✅ Members wote wametumiwa ujumbe inbox!", m);
                break;


            default:
                break;
        }
    } catch (err) {
        console.error("Error kwenye commands.js:", err.message);
    }
};

module.exports = { handleCommands };
