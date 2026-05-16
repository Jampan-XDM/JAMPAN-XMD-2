const fs = require('fs-extra');
const path = require('path');
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
// STYLED REPLY (MODERN FORWARDED)
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
                        newsletterName: 'JAMPAN-XMD UPDATES'
                    },
                    externalAdReply: {
                        title: '🚀 JAMPAN-XMD OFFICIAL',
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
        console.log('Error kwenye replyWithStyle:', e.message);
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
        
        // Kusoma namba ya mmiliki kutoka kwenye settings za index.js
        const isOwner = sender.includes(settings.ownerNumber) || m.key.fromMe;

        // --- UCHUNGUZI WA TYPE YA MESEJI ---
        const messageType = Object.keys(m.message)[0];
        let body = '';

        if (messageType === 'conversation') {
            body = m.message.conversation || '';
        } else if (messageType === 'extendedTextMessage') {
            body = m.message.extendedTextMessage.text || '';
        } else if (messageType === 'imageMessage') {
            body = m.message.imageMessage.caption || '';
        } else if (messageType === 'videoMessage') {
            body = m.message.videoMessage.caption || '';
        }

        // Kama hakuna maandishi yoyote, puuza
        if (!body) return;

        // --- CHUJA PREFIX NA COMMAND ---
        if (!body.startsWith(prefix)) return;

        const command = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();
        const args = body.slice(prefix.length).trim().split(/ +/).slice(1);
        const text = args.join(' ');

        // Mfumo wa Private Mode kulingana na settings za index.js
        if (settings.mode === 'private' && !isOwner) return;

        // --- SYSTEM COMMANDS ---
        switch (command) {
            case 'ping':
                await replyWithStyle(sock, remoteJid, `*JAMPAN-XMD* Iko Online 🚀\n\n*Runtime:* ${runtime(process.uptime())}`, m);
                break;

            case 'autotyping':
                if (!isOwner) return;
                if (!args[0]) return replyWithStyle(sock, remoteJid, `Tumia: ${prefix}autotyping on au off`, m);
                settings.autoTyping = args[0] === 'on';
                await replyWithStyle(sock, remoteJid, `Auto Typing imewekwa: ${settings.autoTyping ? 'ON' : 'OFF'}`, m);
                break;

            // ==========================================
            // YOUTUBE SUBSCRIBERS GROWTH STRATEGY
            // ==========================================

            case 'broadcast': // Tuma link kwenye magroup yote 100 uliyopo
                if (!isOwner) return;
                try {
                    const groups = Object.keys(await sock.groupFetchAllParticipating());
                    await replyWithStyle(sock, remoteJid, `📢 Inaanza kusambaza promo kwenye magroup ${groups.length}...`, m);
                    
                    const promoText = `*HABARI MTANZANIA!* 🇹🇿\n\nNaomba unisupport kwa kusubscribe YouTube Channel yangu ya *Jampani XMD* kwa mafunzo ya kijanja ya Bots, Termux na Web Development.\n\n🔗 *SUBSCRIBE HAPA:* https://youtube.com/@jampani-xmd?si=oLPtRqYf1h1ygSzt\n\n_Asante sana kwa mchango wako!_`;

                    for (let jid of groups) {
                        await sock.sendMessage(jid, { text: promoText });
                        await new Promise(resolve => setTimeout(resolve, 3500)); // Delay ya sekunde 3.5 kulinda namba isipigwe ban
                    }
                    await replyWithStyle(sock, remoteJid, "✅ Broadcast ya YouTube promo imekamilika kwenye magroup yote!", m);
                } catch (err) {
                    console.log("Broadcast Error:", err.message);
                }
                break;

            case 'toeveryone': // Tuma ujumbe inbox (DM) mmoja mmoja kwa members wote wa group husika
                if (!isOwner) return;
                if (!isGroup) return replyWithStyle(sock, remoteJid, "Ndugu Owner, tumia command hii ndani ya Group husika!", m);

                try {
                    const groupMetadata = await sock.groupMetadata(remoteJid);
                    const participants = groupMetadata.participants;
                    
                    await replyWithStyle(sock, remoteJid, `🚀 Mchakato umeanza! Inatuma ujumbe inbox kwa members ${participants.length}. Tafadhali tulia...`, m);

                    const dmText = `Habari, mimi ni *JAMPAN-XMD Bot*. Naomba nikuombe sekunde chache unisupport kijana mwenzako kwa kusubscribe channel yangu ya YouTube:\n\n👉 https://youtube.com/@jampani-xmd?si=oLPtRqYf1h1ygSzt\n\nTafadhali nisaidie kusubscribe, asante sana! 🙏✨`;

                    for (let mem of participants) {
                        // Kuzuia bot isijitumie yenyewe ujumbe inbox
                        if (mem.id === sock.user.id || mem.id.includes(sock.user.id.split(':')[0])) continue;
                        
                        try {
                            await sock.sendMessage(mem.id, { text: dmText });
                            await new Promise(resolve => setTimeout(resolve, 5000)); // Delay ya sekunde 5 kwa kila mtu ili kulinda namba yako isiwe banned na mfumo wa WhatsApp spam filters
                        } catch (e) {
                            console.log(`Ujumbe haukwenda kwa: ${mem.id}`);
                        }
                    }
                    await replyWithStyle(sock, remoteJid, "✅ Kazi imekamilika! Members wote wa kikundi hiki wametumiwa ujumbe wa promo inbox.", m);
                } catch (err) {
                    console.log("ToEveryone Error:", err.message);
                }
                break;

            default:
                break;
        }
    } catch (err) {
        console.error("Critical Error kwenye commands.js:", err.message);
    }
};

module.exports = { handleCommands };
