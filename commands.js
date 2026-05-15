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
        // ================================
        // START COMMANDS
        // ================================
        switch (command) {

   // ================================
            // RUNTIME COMMAND
            // ================================
            case 'runtime': {
                await react('⏱️');

                const uptime = runtime(process.uptime());

                await replyWithStyle(
                    sock,
                    remoteJid,
                    `⏰ Bot Runtime: ${uptime}`,
                    m
                );
            }
            break;

            // ================================
            // OWNER COMMAND
            // ================================
            case 'owner': {
                await react('👑');

                await sock.sendContact(
                    remoteJid,
                    [
                        {
                            displayName: 'Kelvin Jampan',
                            vcard:
`BEGIN:VCARD
VERSION:3.0
FN:Kelvin Jampan
TEL;type=CELL;type=VOICE;waid=255674229015:+255674229015
END:VCARD`
                        }
                    ],
                    m
                );
            }
            break;

            // ================================
            // MENU COMMAND
            // ================================
case 'menu':
case 'help':
case 'use': {
    await react("📜");

    const uptime = runtime(process.uptime());

    const menuText = `
━━━━━━━━━━━━━━━━━━━━
┃  🚀 *JAMPAN-XMD MAIN MENU* 🚀
━━━━━━━━━━━━━━━━━━━━
> *The Ultimate WhatsApp Automation Experience*

👤 *Developer:* Kelvin Jampan
⏱ *Uptime:* ${uptime}
📡 *Prefix:* [ ${prefix} ]
📂 *Commands:* 75
🌐 *Network:* Stable

━━━━━━━━━━━━━━━━━━━━
┃ 🛡️ *SYSTEM & ADMIN*
━━━━━━━━━━━━━━━━━━━━
> ${prefix}ping — Speed test & Latency
> ${prefix}runtime — Active online time
> ${prefix}mode — Toggle Public/Private
> ${prefix}setprefix — Change command symbol
> ${prefix}anticall — Block incoming calls
> ${prefix}areact — Auto emoji reactions
> ${prefix}readstatus — Auto view status
> ${prefix}antidelete — Restore deleted messages
> ${prefix}broadcast — Message all users
> ${prefix}heroku — Deployment status

━━━━━━━━━━━━━━━━━━━━
┃ 🤖 *AI & KNOWLEDGE*
━━━━━━━━━━━━━━━━━━━━
> ${prefix}ai — ChatGPT Smart AI
> ${prefix}gpt — GPT-4o Brain
> ${prefix}gemini — Gemini AI Chat
> ${prefix}chatgpt — AI assistant
> ${prefix}define — Instant dictionary
> ${prefix}say — Text-To-Speech
> ${prefix}fancy — Stylish font generator
> ${prefix}coffee — Random coffee facts

━━━━━━━━━━━━━━━━━━━━
┃ 👑 *CREATOR & IDENTITY*
━━━━━━━━━━━━━━━━━━━━
> ${prefix}owner — Developer VCard
> ${prefix}dev — Developer information
> ${prefix}kelvin — Kelvin Jampan info
> ${prefix}jampan — Bot identity
> ${prefix}script — Script details
> ${prefix}vision — Bot mission
> ${prefix}support — Support links
> ${prefix}me — Contact developer
> ${prefix}love — Romantic quote
> ${prefix}rtime — Motivation message

━━━━━━━━━━━━━━━━━━━━
┃ ⚙️ *GROUP & SECURITY*
━━━━━━━━━━━━━━━━━━━━
> ${prefix}tagall — Mention all members
> ${prefix}link — Get group invite link
> ${prefix}promote — Promote member
> ${prefix}welcome — Welcome system
> ${prefix}goodbye — Goodbye system
> ${prefix}antipromote — Prevent fake promotes
> ${prefix}antidemote — Prevent fake demotes

━━━━━━━━━━━━━━━━━━━━
┃ 📁 *UTILS & TOOLS*
━━━━━━━━━━━━━━━━━━━━
> ${prefix}pp — Download profile picture
> ${prefix}profilepic — User profile photo
> ${prefix}vcf — Export group contacts
> ${prefix}github — GitHub profile lookup
> ${prefix}gh — GitHub quick search
> ${prefix}apk — Download Android APKs
> ${prefix}getall — Extract numbers
> ${prefix}url — Upload media to link

━━━━━━━━━━━━━━━━━━━━
┃ 🎨 *MEDIA & CONVERTERS*
━━━━━━━━━━━━━━━━━━━━
> ${prefix}sticker — Create sticker
> ${prefix}s — Quick sticker
> ${prefix}take — Change sticker metadata
> ${prefix}steal — Steal sticker pack
> ${prefix}meme — Create meme sticker
> ${prefix}write — Write on image
> ${prefix}photo — Sticker to image
> ${prefix}enhance — HD image enhancer
> ${prefix}hd — Improve image quality
> ${prefix}vv — View once opener
> ${prefix}viewonce — Open hidden media

━━━━━━━━━━━━━━━━━━━━
┃ 🎨 *LOGO & GRAPHICS*
━━━━━━━━━━━━━━━━━━━━
> ${prefix}hacker — Hacker logo
> ${prefix}dragonball — Dragon Ball logo
> ${prefix}naruto — Naruto logo
> ${prefix}wall — Wall text effect
> ${prefix}summer — Summer logo
> ${prefix}neonlight — Neon light text
> ${prefix}greenneon — Green neon logo
> ${prefix}glitch — Glitch text effect
> ${prefix}devil — Devil wings logo
> ${prefix}boom — Boom comic logo
> ${prefix}water — Water text style
> ${prefix}snow — Snow logo
> ${prefix}transformer — Transformer style
> ${prefix}thunder — Thunder logo
> ${prefix}harrypotter — Harry Potter logo
> ${prefix}whitegold — White gold effect
> ${prefix}thor — Thor logo
> ${prefix}neon — Neon effect
> ${prefix}gold — Gold logo
> ${prefix}purple — Purple text style
> ${prefix}arena — Arena cover logo

━━━━━━━━━━━━━━━━━━━━
┃ 🤖 *POWERED BY JAMPAN-AI* 🚀
━━━━━━━━━━━━━━━━━━━━`;

    await sock.sendMessage(remoteJid, {
        image: {
            url: "https://files.catbox.moe/fzjhed.png"
        },
        caption: menuText,
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterName: "kelvin - jampan-Ai",
                newsletterJid: "120363409292513352@newsletter",
            },
            // ================================
            // ALIVE COMMAND
            // ================================
            case 'alive': {
                await react('✅');

                await replyWithStyle(
                    sock,
                    remoteJid,
                    '✅ JAMPAN-XMD is active and running successfully!',
                    m
                );
            }
            break;

            // ================================
            // DEFAULT
            // ================================
            default:
                break;
        }

// ================================
// SWITCH COMMANDS
// ================================
switch (command) {

    // ================================
    // ENHANCE IMAGE
    // ================================
    case 'enhance':
    case 'hd': {
        try {

            const quotedMsg =
                m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            const isImg =
                messageType === 'imageMessage' ||
                quotedMsg?.imageMessage;

            if (!isImg) {
                return await replyWithStyle(
                    sock,
                    remoteJid,
                    '❌ Reply to an image and type .enhance',
                    m
                );
            }

            await react('🪄');

            const mediaMessage =
                quotedMsg?.imageMessage ||
                m.message.imageMessage;

            const filePath =
                await sock.downloadAndSaveMediaMessage(mediaMessage);

            await replyWithStyle(
                sock,
                remoteJid,
                '⏳ Enhancing image quality...',
                m
            );

            await sock.sendMessage(
                remoteJid,
                {
                    image: { url: filePath },
                    caption: '✨ Enhanced by JAMPAN-XMD'
                },
                { quoted: m }
            );

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

        } catch (err) {
            console.log(err);
            await replyWithStyle(
                sock,
                remoteJid,
                '❌ Failed to enhance image.',
                m
            );
        }
    }
    break;

    // ================================
    // VIEW ONCE
    // ================================
    case 'vv':
    case 'viewonce': {
        try {

            const quotedMsg =
                m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            const vo =
                quotedMsg?.viewOnceMessageV2 ||
                quotedMsg?.viewOnceMessageV2Extension;

            if (!vo) {
                return await replyWithStyle(
                    sock,
                    remoteJid,
                    '❌ Reply to a View Once message!',
                    m
                );
            }

            await react('👀');

            const media =
                vo.message.imageMessage ||
                vo.message.videoMessage ||
                vo.message.audioMessage;

            const filePath =
                await sock.downloadAndSaveMediaMessage(media);

            if (vo.message.imageMessage) {

                await sock.sendMessage(
                    remoteJid,
                    {
                        image: { url: filePath },
                        caption: media.caption || ''
                    },
                    { quoted: m }
                );

            } else if (vo.message.videoMessage) {

                await sock.sendMessage(
                    remoteJid,
                    {
                        video: { url: filePath },
                        caption: media.caption || ''
                    },
                    { quoted: m }
                );

            } else if (vo.message.audioMessage) {

                await sock.sendMessage(
                    remoteJid,
                    {
                        audio: { url: filePath },
                        mimetype: 'audio/mp4',
                        ptt: false
                    },
                    { quoted: m }
                );
            }

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

        } catch (err) {
            console.log(err);

            await replyWithStyle(
                sock,
                remoteJid,
                '❌ Failed to open View Once message.',
                m
            );
        }
    }
    break;

    // ================================
    // AUTO TYPING
    // ================================
    case 'autotyping': {

        if (!isOwner) {
            return await react('❌');
        }

        settings.autoTyping = args[0] === 'on';

        await replyWithStyle(
            sock,
            remoteJid,
            `✅ Auto Typing is now ${
                settings.autoTyping ? 'ON' : 'OFF'
            }`,
            m
        );
    }
    break;

    // ================================
    // AUTO RECORD
    // ================================
    case 'autorec': {

        if (!isOwner) {
            return await react('❌');
        }

        settings.autoRecord = args[0] === 'on';

        await replyWithStyle(
            sock,
            remoteJid,
            `✅ Auto Record is now ${
                settings.autoRecord ? 'ON' : 'OFF'
            }`,
            m
        );
    }
    break;

    // ================================
    // MODE
    // ================================
    case 'mode': {

        if (!isOwner) {
            return await react('❌');
        }

        const newMode = args[0];

        if (!newMode) {
            return await replyWithStyle(
                sock,
                remoteJid,
                `❌ Example: ${prefix}mode public`,
                m
            );
        }

        if (
            newMode !== 'public' &&
            newMode !== 'private'
        ) {
            return await replyWithStyle(
                sock,
                remoteJid,
                '❌ Choose public or private',
                m
            );
        }

        settings.mode = newMode;

        await react('✅');

        await replyWithStyle(
            sock,
            remoteJid,
            `✅ Bot mode changed to *${newMode.toUpperCase()}*`,
            m
        );
    }
    break;

    // ================================
    // SET PREFIX
    // ================================
    case 'setprefix': {

        if (!isOwner) {
            return await react('❌');
        }

        const newPrefix = args[0];

        if (!newPrefix) {
            return await replyWithStyle(
                sock,
                remoteJid,
                `❌ Example: ${prefix}setprefix #`,
                m
            );
        }

        settings.PREFIX = newPrefix;

        await react('✅');

        await replyWithStyle(
            sock,
            remoteJid,
            `✅ Prefix changed to: ${newPrefix}`,
            m
        );
    }
    break;

    // ================================
    // AI CHAT
    // ================================
    case 'ai':
    case 'chatgpt': {
        try {

            await react('🧠');

            const aiText = args.join(' ');

            if (!aiText) {
                return await replyWithStyle(
                    sock,
                    remoteJid,
                    '❌ Ask something.\nExample: .ai Who is Kelvin Jampan?',
                    m
                );
            }

            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are JAMPAN-XMD AI created by Kelvin Jampan.'
                        },
                        {
                            role: 'user',
                            content: aiText
                        }
                    ]
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const aiReply =
                response.data.choices[0].message.content;

            await replyWithStyle(
                sock,
                remoteJid,
                aiReply,
                m
            );

        } catch (err) {
            console.log(err);

            await replyWithStyle(
                sock,
                remoteJid,
                '❌ AI request failed.',
                m
            );
        }
    }
    break;

    // ================================
    // RUNTIME
    // ================================
    case 'runtime': {

        await react('🕒');

        await replyWithStyle(
            sock,
            remoteJid,
            `🚀 Runtime: ${runtime(process.uptime())}`,
            m
        );
    }
    break;

    // ================================
    // OWNER
    // ================================
    case 'owner': {

        await react('👑');

        await replyWithStyle(
            sock,
            remoteJid,
            '👑 Owner: Kelvin Jampan\n📞 wa.me/255674229015',
            m
        );
    }
    break;

    // ================================
    // TEXT TO SPEECH
    // ================================
    case 'say': {
        try {

            await react('🗣️');

            const googleTTS = require('google-tts-api');

            const ttsText = args.join(' ');

            if (!ttsText) {
                return await replyWithStyle(
                    sock,
                    remoteJid,
                    '❌ Enter text to speak.',
                    m
                );
            }

            const audioUrl = googleTTS.getAudioUrl(
                ttsText,
                {
                    lang: 'sw',
                    slow: false
                }
            );

            await sock.sendMessage(
                remoteJid,
                {
                    audio: { url: audioUrl },
                    mimetype: 'audio/mpeg',
                    ptt: true
                },
                { quoted: m }
            );

        } catch (err) {
            console.log(err);

            await replyWithStyle(
                sock,
                remoteJid,
                '❌ Failed to generate audio.',
                m
            );
        }
    }
    break;

    // ================================
    // VCF EXPORT
    // ================================
    case 'vcf': {
        try {

            if (!isGroup) {
                return await replyWithStyle(
                    sock,
                    remoteJid,
                    '❌ Group only command.',
                    m
                );
            }

            await react('📇');

            const metadata =
                await sock.groupMetadata(remoteJid);

            const participants =
                metadata.participants;

            let vcfContent = '';

            participants.forEach((p) => {

                const number =
                    p.id.split('@')[0];

                vcfContent +=
`BEGIN:VCARD
VERSION:3.0
FN:JAMPAN | ${number}
TEL;TYPE=CELL:+${number}
END:VCARD
`;
            });

            await sock.sendMessage(
                remoteJid,
                {
                    document: Buffer.from(vcfContent),
                    mimetype: 'text/vcard',
                    fileName: 'JampanContacts.vcf',
                    caption: `✅ Exported ${participants.length} contacts`
                },
                { quoted: m }
            );

        } catch (err) {
            console.log(err);

            await replyWithStyle(
                sock,
                remoteJid,
                '❌ Failed to export contacts.',
                m
            );
        }
    }
    break;

    // ================================
    // PERSONALITY
    // ================================
    case 'kelvin':
    case 'kevin':
    case 'jampan':
    case 'maneno': {

        const reactions = [
            '😎',
            '🔥',
            '🚀',
            '👑',
            '💎'
        ];

        const replies = [
            'Hello! Kelvin Jampan is online 😎',
            '🚀 Welcome to JAMPAN-XMD',
            '🔥 JAMPAN-XMD is active!',
            '👑 Powered by Kelvin Jampan'
        ];

        const randomReaction =
            reactions[
                Math.floor(Math.random() * reactions.length)
            ];

        const randomReply =
            replies[
                Math.floor(Math.random() * replies.length)
            ];

        await react(randomReaction);

        await sock.sendMessage(
            remoteJid,
            {
                text: randomReply,
                mentions: [sender],
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    externalAdReply: {
                        title: 'JAMPAN-XMD',
                        body: 'Kelvin Jampan',
                        thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                        sourceUrl: 'https://jampanbot.vercel.app',
                        mediaType: 1
                    }
                }
            },
            { quoted: m }
        );
    }
    break;

    case 'enhance':
    case 'hd': {
        try {

            const quotedMsg =
                m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            const isImg =
                messageType === 'imageMessage' ||
                quotedMsg?.imageMessage;

            if (!isImg) {
                return await replyWithStyle(
                    sock,
                    remoteJid,
                    '❌ Reply to an image and type .enhance',
                    m
                );
            }

            await react('🪄');

            const mediaMessage =
                quotedMsg?.imageMessage ||
                m.message.imageMessage;

            const filePath =
                await sock.downloadAndSaveMediaMessage(mediaMessage);

            await replyWithStyle(
                sock,
                remoteJid,
                '⏳ Enhancing image quality...',
                m
            );

            await sock.sendMessage(
                remoteJid,
                {
                    image: { url: filePath },
                    caption: '✨ Enhanced by JAMPAN-XMD'
                },
                { quoted: m }
            );

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

        } catch (err) {
            console.log(err);
            await replyWithStyle(
                sock,
                remoteJid,
                '❌ Failed to enhance image.',
                m
            );
        }
    }
    break;

    // ================================
    // VIEW ONCE
    // ================================
    case 'vv':
    case 'viewonce': {
        try {

            const quotedMsg =
                m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            const vo =
                quotedMsg?.viewOnceMessageV2 ||
                quotedMsg?.viewOnceMessageV2Extension;

            if (!vo) {
                return await replyWithStyle(
                    sock,
                    remoteJid,
                    '❌ Reply to a View Once message!',
                    m
                );
            }

            await react('👀');

            const media =
                vo.message.imageMessage ||
                vo.message.videoMessage ||
                vo.message.audioMessage;

            const filePath =
                await sock.downloadAndSaveMediaMessage(media);

            if (vo.message.imageMessage) {

                await sock.sendMessage(
                    remoteJid,
                    {
                        image: { url: filePath },
                        caption: media.caption || ''
                    },
                    { quoted: m }
                );

            } else if (vo.message.videoMessage) {

                await sock.sendMessage(
                    remoteJid,
                    {
                        video: { url: filePath },
                        caption: media.caption || ''
                    },
                    { quoted: m }
                );

            } else if (vo.message.audioMessage) {

                await sock.sendMessage(
                    remoteJid,
                    {
                        audio: { url: filePath },
                        mimetype: 'audio/mp4',
                        ptt: false
                    },
                    { quoted: m }
                );
            }

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

        } catch (err) {
            console.log(err);

            await replyWithStyle(
                sock,
                remoteJid,
                '❌ Failed to open View Once message.',
                m
            );
        }
    }
    break;

    // ================================
    // AUTO TYPING
    // ================================
    case 'autotyping': {

        if (!isOwner) {
            return await react('❌');
        }

        settings.autoTyping = args[0] === 'on';

        await replyWithStyle(
            sock,
            remoteJid,
            `✅ Auto Typing is now ${
                settings.autoTyping ? 'ON' : 'OFF'
            }`,
            m
        );
    }
    break;

    // ================================
    // AUTO RECORD
    // ================================
    case 'autorec': {

        if (!isOwner) {
            return await react('❌');
        }

        settings.autoRecord = args[0] === 'on';

        await replyWithStyle(
            sock,
            remoteJid,
            `✅ Auto Record is now ${
                settings.autoRecord ? 'ON' : 'OFF'
            }`,
            m
        );
    }
    break;

    // ================================
    // MODE
    // ================================
    case 'mode': {

        if (!isOwner) {
            return await react('❌');
        }

        const newMode = args[0];

        if (!newMode) {
            return await replyWithStyle(
                sock,
                remoteJid,
                `❌ Example: ${prefix}mode public`,
                m
            );
        }

        if (
            newMode !== 'public' &&
            newMode !== 'private'
        ) {
            return await replyWithStyle(
                sock,
                remoteJid,
                '❌ Choose public or private',
                m
            );
        }

        settings.mode = newMode;

        await react('✅');

        await replyWithStyle(
            sock,
            remoteJid,
            `✅ Bot mode changed to *${newMode.toUpperCase()}*`,
            m
        );
    }
    break;

    // ================================
    // SET PREFIX
    // ================================
    case 'setprefix': {

        if (!isOwner) {
            return await react('❌');
        }

        const newPrefix = args[0];

        if (!newPrefix) {
            return await replyWithStyle(
                sock,
                remoteJid,
                `❌ Example: ${prefix}setprefix #`,
                m
            );
        }

        settings.PREFIX = newPrefix;

        await react('✅');

        await replyWithStyle(
            sock,
            remoteJid,
            `✅ Prefix changed to: ${newPrefix}`,
            m
        );
    }
    break;

    // ================================
    // AI CHAT
    // ================================
    case 'ai':
    case 'chatgpt': {
        try {

            await react('🧠');

            const aiText = args.join(' ');

            if (!aiText) {
                return await replyWithStyle(
                    sock,
                    remoteJid,
                    '❌ Ask something.\nExample: .ai Who is Kelvin Jampan?',
                    m
                );
            }

            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are JAMPAN-XMD AI created by Kelvin Jampan.'
                        },
                        {
                            role: 'user',
                            content: aiText
                        }
                    ]
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const aiReply =
                response.data.choices[0].message.content;

            await replyWithStyle(
                sock,
                remoteJid,
                aiReply,
                m
            );

        } catch (err) {
            console.log(err);

            await replyWithStyle(
                sock,
                remoteJid,
                '❌ AI request failed.',
                m
            );
        }
    }
    break;

    // ================================
    // RUNTIME
    // ================================
    case 'runtime': {

        await react('🕒');

        await replyWithStyle(
            sock,
            remoteJid,
            `🚀 Runtime: ${runtime(process.uptime())}`,
            m
        );
    }
    break;

    // ================================
    // OWNER
    // ================================
    case 'owner': {

        await react('👑');

        await replyWithStyle(
            sock,
            remoteJid,
            '👑 Owner: Kelvin Jampan\n📞 wa.me/255674229015',
            m
        );
    }
    break;

    // ================================
    // TEXT TO SPEECH
    // ================================
    case 'say': {
        try {

            await react('🗣️');

            const googleTTS = require('google-tts-api');

            const ttsText = args.join(' ');

            if (!ttsText) {
                return await replyWithStyle(
                    sock,
                    remoteJid,
                    '❌ Enter text to speak.',
                    m
                );
            }

            const audioUrl = googleTTS.getAudioUrl(
                ttsText,
                {
                    lang: 'sw',
                    slow: false
                }
            );

            await sock.sendMessage(
                remoteJid,
                {
                    audio: { url: audioUrl },
                    mimetype: 'audio/mpeg',
                    ptt: true
                },
                { quoted: m }
            );

        } catch (err) {
            console.log(err);

            await replyWithStyle(
                sock,
                remoteJid,
                '❌ Failed to generate audio.',
                m
            );
        }
    }
    break;

    // ================================
    // VCF EXPORT
    // ================================
    case 'vcf': {
        try {

            if (!isGroup) {
                return await replyWithStyle(
                    sock,
                    remoteJid,
                    '❌ Group only command.',
                    m
                );
            }

            await react('📇');

            const metadata =
                await sock.groupMetadata(remoteJid);

            const participants =
                metadata.participants;

            let vcfContent = '';

            participants.forEach((p) => {

                const number =
                    p.id.split('@')[0];

                vcfContent +=
`BEGIN:VCARD
VERSION:3.0
FN:JAMPAN | ${number}
TEL;TYPE=CELL:+${number}
END:VCARD
`;
            });

            await sock.sendMessage(
                remoteJid,
                {
                    document: Buffer.from(vcfContent),
                    mimetype: 'text/vcard',
                    fileName: 'JampanContacts.vcf',
                    caption: `✅ Exported ${participants.length} contacts`
                },
                { quoted: m }
            );

        } catch (err) {
            console.log(err);

            await replyWithStyle(
                sock,
                remoteJid,
                '❌ Failed to export contacts.',
                m
            );
        }
    }
    break;

    // ================================
    // PERSONALITY
    // ================================
    case 'kelvin':
    case 'kevin':
    case 'jampan':
    case 'maneno': {

        const reactions = [
            '😎',
            '🔥',
            '🚀',
            '👑',
            '💎'
        ];

        const replies = [
            'Hello! Kelvin Jampan is online 😎',
            '🚀 Welcome to JAMPAN-XMD',
            '🔥 JAMPAN-XMD is active!',
            '👑 Powered by Kelvin Jampan'
        ];

        const randomReaction =
            reactions[
                Math.floor(Math.random() * reactions.length)
            ];

        const randomReply =
            replies[
                Math.floor(Math.random() * replies.length)
            ];

        await react(randomReaction);

        await sock.sendMessage(
            remoteJid,
            {
                text: randomReply,
                mentions: [sender],
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    externalAdReply: {
                        title: 'JAMPAN-XMD',
                        body: 'Kelvin Jampan',
                        thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                        sourceUrl: 'https://jampanbot.vercel.app',
                        mediaType: 1
                    }
                }
            },
            { quoted: m }
        );
    }
    break;
// ================================
// ADVANCED AI CHAT
// ================================
case 'ai':
case 'gpt':
case 'gemini':
case 'chatgpt': {
    try {

        await react('🧠');

        const aiText = args.join(' ');

        if (!aiText) {
            return await replyWithStyle(
                sock,
                remoteJid,
                '❌ Please ask something.\n\nExample: .ai who is Kelvin Jampan?',
                m
            );
        }

        // ================================
        // CHAT MEMORY
        // ================================
        if (!global.userChats) {
            global.userChats = {};
        }

        if (!global.userChats[remoteJid]) {
            global.userChats[remoteJid] = [];
        }

        global.userChats[remoteJid].push(`User: ${aiText}`);

        if (global.userChats[remoteJid].length > 10) {
            global.userChats[remoteJid].shift();
        }

        const userHistory =
            global.userChats[remoteJid].join('\n');

        // ================================
        // SYSTEM PROMPT
        // ================================
        const systemPrompt = `
You are JAMPAN-XMD, a smart WhatsApp bot.

Owner:
Kelvin Jampan from Tanzania.

Website:
https://jampanbot.vercel.app

Rules:
- Chat naturally like a human.
- Use English or Kiswahili.
- Keep replies clean and smart.
- If user asks music reply with: .play [song]
- If user asks video reply with: .video [name]

Conversation History:
${userHistory}
`;

        // ================================
        // OPENAI REQUEST
        // ================================
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: aiText
                    }
                ],
                temperature: 0.7
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const botResponse =
            response.data.choices[0].message.content;

        global.userChats[remoteJid].push(
            `Bot: ${botResponse}`
        );

        await replyWithStyle(
            sock,
            remoteJid,
            botResponse,
            m
        );

    } catch (err) {

        console.log(err);

        await replyWithStyle(
            sock,
            remoteJid,
            '❌ OpenAI is busy or API key is invalid.',
            m
        );
    }
}
break;

// ================================
// PROFILE PICTURE
// ================================
case 'pp':
case 'profilepic': {
    try {

        await react('📸');

        let targetUser = remoteJid;

        const mentioned =
            m.message?.extendedTextMessage
            ?.contextInfo?.mentionedJid;

        if (mentioned && mentioned.length > 0) {

            targetUser = mentioned[0];

        } else if (
            m.message?.extendedTextMessage
            ?.contextInfo?.participant
        ) {

            targetUser =
                m.message.extendedTextMessage
                .contextInfo.participant;
        }

        const ppUrl =
            await sock.profilePictureUrl(
                targetUser,
                'image'
            ).catch(() => null);

        if (!ppUrl) {

            return await replyWithStyle(
                sock,
                remoteJid,
                '❌ User has no profile picture.',
                m
            );
        }

        await sock.sendMessage(
            remoteJid,
            {
                image: { url: ppUrl },
                caption:
`📸 Profile Picture

User:
@${targetUser.split('@')[0]}

Retrieved by JAMPAN-XMD`,
                mentions: [targetUser]
            },
            { quoted: m }
        );

    } catch (err) {

        console.log(err);

        await replyWithStyle(
            sock,
            remoteJid,
            '❌ Failed to fetch profile picture.',
            m
        );
    }
}
break;

// ================================
// BROADCAST
// ================================
case 'broadcast': {
    try {

        if (!isOwner) {
            return await replyWithStyle(
                sock,
                remoteJid,
                '❌ Owner only command.',
                m
            );
        }

        if (!isGroup) {
            return await replyWithStyle(
                sock,
                remoteJid,
                '❌ Use this command inside group.',
                m
            );
        }

        const bcText = args.join(' ');

        if (!bcText) {

            return await replyWithStyle(
                sock,
                remoteJid,
                `❌ Example:\n${prefix}broadcast Hello`,
                m
            );
        }

        await react('📢');

        const metadata =
            await sock.groupMetadata(remoteJid);

        const members =
            metadata.participants.map(v => v.id);

        await replyWithStyle(
            sock,
            remoteJid,
            `🚀 Broadcasting to ${members.length} users...`,
            m
        );

        for (const member of members) {

            try {

                await delay(1500);

                await sock.sendMessage(
                    member,
                    {
                        text: bcText,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            externalAdReply: {
                                title: 'JAMPAN-XMD BROADCAST',
                                body: 'Official Broadcast',
                                thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                                sourceUrl: 'https://jampanbot.vercel.app',
                                mediaType: 1
                            }
                        }
                    }
                );

            } catch (e) {
                console.log(
                    `Failed for ${member}`
                );
            }
        }

        await replyWithStyle(
            sock,
            remoteJid,
            '✅ Broadcast completed successfully.',
            m
        );

    } catch (err) {

        console.log(err);

        await replyWithStyle(
            sock,
            remoteJid,
            '❌ Broadcast failed.',
            m
        );
    }
}
break;

// ================================
// LOVE
// ================================
case 'love': {

    await react('❤️');

    await replyWithStyle(
        sock,
        remoteJid,
        '❤️ You became the most important person in my life.',
        m
    );
}
break;

// ================================
// RTIME
// ================================
case 'rtime': {

    await react('😎');

    await replyWithStyle(
        sock,
        remoteJid,
        `HELLO 👋

JAMPAN-XMD is active and more updates are coming soon.

I LOVE YOU ❤️`,
        m
    );
}
break;

// ================================
// SCRIPT
// ================================
case 'script': {

    await react('📜');

    const scriptInfo =
`┏━━━━━━━━━━━━━━
┃ JAMPAN-XMD
┃ STATUS: ACTIVE
┗━━━━━━━━━━━━━━

👑 Creator:
Kelvin Jampan

📢 Channel:
https://whatsapp.com/channel/0029Vb7fTNf3QxS8A6rbBB3S

📞 Contact:
wa.me/255674229015

© JAMPAN-XMD`;

    await replyWithStyle(
        sock,
        remoteJid,
        scriptInfo,
        m
    );
}
break;

// ================================
// VISION
// ================================
case 'vision': {

    await react('🔎');

    await replyWithStyle(
        sock,
        remoteJid,
        '❤️ Our mission is making WhatsApp automation fun and smart.',
        m
    );
}
break;

// ================================
// SUPPORT CHANNEL
// ================================
case 'support':
case 'channel': {

    await react('📢');

    await replyWithStyle(
        sock,
        remoteJid,
        '📢 Official Channel:\nhttps://whatsapp.com/channel/0029Vb7fTNf3QxS8A6rbBB3S',
        m
    );
}
break;

// ================================
// HEROKU
// ================================
case 'heroku': {

    await react('🚀');

    await replyWithStyle(
        sock,
        remoteJid,
        '🚀 JAMPAN-XMD is running on Heroku successfully.',
        m
    );
}
break;

// ================================
// ME
// ================================
case 'me': {

    await react('👑');

    await replyWithStyle(
        sock,
        remoteJid,
        '👑 Developer KELVIN JAMPAN:\nhttps://wa.me/255674229015',
        m
    );
}
break;

// ================================
// SET PREFIX
// ================================
case 'setprefix': {
    try {

        if (!isOwner) {
            return await react('❌');
        }

        await react('⚙️');

        const newPrefix = args[0];

        if (!newPrefix) {

            return await replyWithStyle(
                sock,
                remoteJid,
                `❌ Example:\n${prefix}setprefix #`,
                m
            );
        }

        settings.PREFIX = newPrefix;

        await replyWithStyle(
            sock,
            remoteJid,
            `✅ Prefix changed to: ${newPrefix}`,
            m
        );

    } catch (err) {

        console.log(err);

        await replyWithStyle(
            sock,
            remoteJid,
            '❌ Failed to change prefix.',
            m
        );
    }
}
break;

// ================================
// PING COMMAND
// ================================
case 'ping': {
    try {

        await react('🚀');

        const startTime = Date.now();

        // ================================
        // START MESSAGE
        // ================================
        const pingMsg = await sock.sendMessage(
            remoteJid,
            {
                text: '⚡ Pinging JAMPAN-XMD...'
            },
            { quoted: m }
        );

        // ================================
        // PROGRESS BAR
        // ================================
        const progressSteps = [
            {
                bar: '▰▱▱▱▱▱▱▱▱▱',
                percent: '10%'
            },
            {
                bar: '▰▰▰▰▱▱▱▱▱▱',
                percent: '40%'
            },
            {
                bar: '▰▰▰▰▰▰▰▱▱▱',
                percent: '70%'
            },
            {
                bar: '▰▰▰▰▰▰▰▰▰▰',
                percent: '100%'
            }
        ];

        for (const step of progressSteps) {

            await delay(300);

            await sock.sendMessage(
                remoteJid,
                {
                    text: `${step.bar} ${step.percent}`,
                    edit: pingMsg.key
                }
            );
        }

        // ================================
        // LATENCY
        // ================================
        const latency =
            Date.now() - startTime;

        let quality = 'EXCELLENT';
        let emoji = '🟢';

        if (latency > 100 && latency < 300) {

            quality = 'GOOD';
            emoji = '🟡';

        } else if (latency >= 300) {

            quality = 'FAIR';
            emoji = '🟠';
        }

        // ================================
        // FINAL TEXT
        // ================================
        const finalText =
`━━━━━━━━━━━━━━━━━━━━
┃ ⚡ PING RESULT ⚡
━━━━━━━━━━━━━━━━━━━━

🏓 Ping Completed!
⚡ Speed: ${latency}ms
${emoji} Quality: ${quality}
🕒 Time: ${new Date().toLocaleTimeString()}

━━━━━━━━━━━━━━━━━━━━
┃ 🤖 JAMPAN-XMD 🚀
━━━━━━━━━━━━━━━━━━━━`;

        // ================================
        // SEND IMAGE RESULT
        // ================================
        await sock.sendMessage(
            remoteJid,
            {
                image: {
                    url: 'https://files.catbox.moe/fzjhed.png'
                },
                caption: finalText,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterName: 'kelvin - jampan-Ai',
                        newsletterJid: '120363409292513352@newsletter'
                    },
                    externalAdReply: {
                        title: 'JAMPAN-XMD SPEED',
                        body: 'Kelvin Jampan Official Bot',
                        thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                        sourceUrl: 'https://jampanbot.vercel.app',
                        renderLargerThumbnail: false,
                        mediaType: 1
                    }
                }
            },
            { quoted: m }
        );

        // ================================
        // SEND AUDIO
        // ================================
        await sock.sendMessage(
            remoteJid,
            {
                audio: {
                    url: 'https://files.catbox.moe/vmc7k3.mp3'
                },
                mimetype: 'audio/mpeg',
                ptt: false,
                contextInfo: {
                    forwardingScore: 5,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterName: 'kelvin - jampan-Ai',
                        newsletterJid: '120363409292513352@newsletter'
                    }
                }
            },
            { quoted: m }
        );

    } catch (err) {

        console.log(err);

        await replyWithStyle(
            sock,
            remoteJid,
            '❌ Ping failed.',
            m
        );
    }
}
break;

// ================================
// DEFINE COMMAND
// ================================
case 'define': {
    try {

        await react('📚');

        const term = args.join(' ');

        if (!term) {

            return await replyWithStyle(
                sock,
                remoteJid,
                `📖 Example:\n${prefix}define hello`,
                m
            );
        }

        const response = await axios.get(
            `https://api.giftedtech.my.id/api/tools/define?apikey=gifted&term=${encodeURIComponent(term)}`
        );

        const results =
            response.data?.result;

        if (
            !results ||
            !Array.isArray(results) ||
            results.length === 0
        ) {

            return await replyWithStyle(
                sock,
                remoteJid,
                `❌ No definition found for: ${term}`,
                m
            );
        }

        let replyText =
`───〔 📚 DEFINITION 〕───

📌 Term: ${term.toUpperCase()}

`;

        results
            .slice(0, 2)
            .forEach((def, index) => {

                replyText +=
`🧠 Meaning ${index + 1}:
${def.definition || 'No definition'}

`;

                if (def.example) {

                    replyText +=
`💡 Example:
${def.example}

`;
                }
            });

        replyText +=
`━━━━━━━━━━━━━━
🤖 Generated by JAMPAN-XMD`;

        await replyWithStyle(
            sock,
            remoteJid,
            replyText,
            m
        );

    } catch (err) {

        console.log(err);

        await replyWithStyle(
            sock,
            remoteJid,
            '❌ Failed to fetch definition.',
            m
        );
    }
}
break;

// ================================
// COFFEE COMMAND
// ================================
case 'coffee': {
    try {

        await react('☕');

        const jampanFacts = [
            'JAMPAN-XMD is an advanced AI bot created by Kelvin Jampan 🤖',
            'Kelvin Jampan built this bot for WhatsApp automation 🚀',
            'JAMPAN-XMD receives continuous updates ⚡',
            'Kelvin Jampan is a developer, gamer and creator 👑'
        ];

        const randomFact =
            jampanFacts[
                Math.floor(Math.random() * jampanFacts.length)
            ];

        await sock.sendMessage(
            remoteJid,
            {
                image: {
                    url: 'https://coffee.alexflipnote.dev/random'
                },
                caption:
`☕ Enjoy your coffee!

💡 Did you know?
${randomFact}

🤖 Powered by JAMPAN-XMD`,
                contextInfo: {
                    externalAdReply: {
                        title: 'JAMPAN-XMD COFFEE',
                        body: 'Developed by Kelvin Jampan',
                        thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                        sourceUrl: 'https://jampanbot.vercel.app',
                        mediaType: 1
                    }
                }
            },
            { quoted: m }
        );

    } catch (err) {

        console.log(err);

        await replyWithStyle(
            sock,
            remoteJid,
            '❌ Failed to fetch coffee image.',
            m
        );
    }
}
break;

// ================================
// STICKER COMMAND
// ================================
case 'sticker':
case 's': {
    try {

        await react('✨');

        const {
            Sticker,
            StickerTypes
        } = require('wa-sticker-formatter');

        const quotedMsg =
            m.message?.extendedTextMessage
            ?.contextInfo?.quotedMessage;

        const isImage =
            messageType === 'imageMessage' ||
            quotedMsg?.imageMessage;

        const isVideo =
            messageType === 'videoMessage' ||
            quotedMsg?.videoMessage;

        if (!isImage && !isVideo) {

            return await replyWithStyle(
                sock,
                remoteJid,
                '❌ Reply to image or video.',
                m
            );
        }

        const mediaMessage =
            quotedMsg?.imageMessage ||
            quotedMsg?.videoMessage ||
            m.message.imageMessage ||
            m.message.videoMessage;

        const mediaPath =
            await sock.downloadAndSaveMediaMessage(
                mediaMessage
            );

        const sticker = new Sticker(
            mediaPath,
            {
                pack: 'JAMPAN-XMD',
                author: 'Kelvin Jampan',
                type: args.includes('-c')
                    ? StickerTypes.CROPPED
                    : StickerTypes.FULL,
                quality: 70
            }
        );

        await sock.sendMessage(
            remoteJid,
            {
                sticker: await sticker.toBuffer(),
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true
                }
            },
            { quoted: m }
        );

        if (fs.existsSync(mediaPath)) {
            fs.unlinkSync(mediaPath);
        }

    } catch (err) {

        console.log(err);

        await replyWithStyle(
            sock,
            remoteJid,
            '❌ Failed to create sticker.',
            m
        );
    }
}
break;

// ================================
// TAKE / STEAL STICKER
// ================================
case 'take':
case 'steal': {
    try {

        await react('📸');

        const quotedMsg =
            m.message?.extendedTextMessage
            ?.contextInfo?.quotedMessage;

        if (!quotedMsg?.stickerMessage) {

            return await replyWithStyle(
                sock,
                remoteJid,
                '❌ Reply to a sticker.',
                m
            );
        }

        const {
            Sticker,
            StickerTypes
        } = require('wa-sticker-formatter');

        const mediaPath =
            await sock.downloadAndSaveMediaMessage(
                quotedMsg.stickerMessage
            );

        const packName =
            args.join(' ') || 'JAMPAN-XMD';

        const sticker = new Sticker(
            mediaPath,
            {
                pack: packName,
                author: 'Kelvin Jampan',
                type: StickerTypes.CROPPED,
                quality: 70
            }
        );

        await sock.sendMessage(
            remoteJid,
            {
                sticker: await sticker.toBuffer()
            },
            { quoted: m }
        );

        if (fs.existsSync(mediaPath)) {
            fs.unlinkSync(mediaPath);
        }

    } catch (err) {

        console.log(err);

        await replyWithStyle(
            sock,
            remoteJid,
            '❌ Failed to change sticker metadata.',
            m
        );
    }
}
break;

// ================================
// MEME COMMAND
// ================================
case 'write':
case 'meme': {
    try {

        await react('📝');

        const memeText = args.join(' ');

        if (!memeText) {

            return await replyWithStyle(
                sock,
                remoteJid,
                '❌ Example: .meme Hello',
                m
            );
        }

        const quotedMsg =
            m.message?.extendedTextMessage
            ?.contextInfo?.quotedMessage;

        if (!quotedMsg?.imageMessage) {

            return await replyWithStyle(
                sock,
                remoteJid,
                '❌ Reply to an image.',
                m
            );
        }

        await replyWithStyle(
            sock,
            remoteJid,
            '⚠️ Meme system setup required.\nAdd your image upload API first.',
            m
        );

    } catch (err) {

        console.log(err);

        await replyWithStyle(
            sock,
            remoteJid,
            '❌ Failed to create meme.',
            m
        );
    }
}
break;

// ================================
// URL / LINK
// ================================
case 'url':
case 'link': {
    try {

        await react('🔗');

        const quotedMsg =
            m.message?.extendedTextMessage
            ?.contextInfo?.quotedMessage;

        if (!quotedMsg) {

            return await replyWithStyle(
                sock,
                remoteJid,
                '❌ Reply to image or video.',
                m
            );
        }

        await replyWithStyle(
            sock,
            remoteJid,
            '⚠️ Upload API not connected yet.',
            m
        );

    } catch (err) {

        console.log(err);

        await replyWithStyle(
            sock,
            remoteJid,
            '❌ Upload failed.',
            m
        );
    }
}
break;

// ================================
// PHOTO COMMAND
// ================================
case 'photo': {
    try {

        await react('🖼️');

        const quotedMsg =
            m.message?.extendedTextMessage
            ?.contextInfo?.quotedMessage;

        if (!quotedMsg?.stickerMessage) {

            return await replyWithStyle(
                sock,
                remoteJid,
                '❌ Reply to a sticker.',
                m
            );
        }

        const stickerPath =
            await sock.downloadAndSaveMediaMessage(
                quotedMsg.stickerMessage
            );

        const outputPath =
            `${stickerPath}.png`;

        const { exec } =
            require('child_process');

        exec(
            `ffmpeg -i "${stickerPath}" "${outputPath}"`,
            async (err) => {

                if (err) {

                    return await replyWithStyle(
                        sock,
                        remoteJid,
                        '❌ Failed to convert sticker.',
                        m
                    );
                }

                await sock.sendMessage(
                    remoteJid,
                    {
                        image: fs.readFileSync(outputPath),
                        caption: '✅ Converted by JAMPAN-XMD'
                    },
                    { quoted: m }
                );

                if (fs.existsSync(stickerPath)) {
                    fs.unlinkSync(stickerPath);
                }

                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }
        );

    } catch (err) {

        console.log(err);

        await replyWithStyle(
            sock,
            remoteJid,
            '❌ Failed to convert sticker.',
            m
        );
    }
}
break;

// ================================
// GROUP EVENTS
// ================================
case 'welcome':
case 'goodbye':
case 'antipromote':
case 'antidemote': {
    try {

        const eventName =
            command.toLowerCase();

        if (!isGroup) {

            return await replyWithStyle(
                sock,
                remoteJid,
                '❌ Group only command.',
                m
            );
        }

        if (!isAdmin && !isOwner) {

            return await replyWithStyle(
                sock,
                remoteJid,
                '❌ Admin only command.',
                m
            );
        }

        const option =
            args[0]?.toLowerCase();

        if (
            option !== 'on' &&
            option !== 'off'
        ) {

            return await replyWithStyle(
                sock,
                remoteJid,
                `❌ Example:\n.${eventName} on`,
                m
            );
        }

        if (!settings.groupEvents) {
            settings.groupEvents = {};
        }

        if (!settings.groupEvents[remoteJid]) {
            settings.groupEvents[remoteJid] = {};
        }

        settings.groupEvents[remoteJid][eventName] =
            option === 'on';

        await react(
            option === 'on'
                ? '✅'
                : '❌'
        );

        await sock.sendMessage(
            remoteJid,
            {
                text:
`🚀 JAMPAN-XMD EVENT UPDATE

📢 Event:
${eventName.toUpperCase()}

⚙️ Status:
${option.toUpperCase()}

🤖 Powered by JAMPAN-XMD`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true
                }
            },
            { quoted: m }
        );

    } catch (err) {

        console.log(err);

        await replyWithStyle(
            sock,
            remoteJid,
            '❌ Failed to update event.',
            m
        );
    }
}
break;

  // AI COMMANDS
    // ==========================================

    case "ai":
    case "gpt":
    case "gemini":
    case "chatgpt": {
        await react("🧠");

        const text = args.join(" ");
        if (!text) {
            return await replyWithStyle(
                sock,
                remoteJid,
                `❌ Please provide a question!\n\nExample: ${prefix}ai Who is Kelvin Jampan?`,
                m
            );
        }

        try {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: "You are JAMPAN-XMD, a smart WhatsApp AI bot created by Kelvin Jampan."
                        },
                        {
                            role: "user",
                            content: text
                        }
                    ],
                    temperature: 0.7
                },
                {
                    headers: {
                        'Authorization': `Bearer YOUR_API_KEY`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const aiReply = response.data.choices[0].message.content;

            await replyWithStyle(sock, remoteJid, aiReply, m);

        } catch (error) {
            console.log(error);

            await replyWithStyle(
                sock,
                remoteJid,
                "❌ AI failed to respond. Check API key or internet connection.",
                m
            );
        }

        break;
    }

    // STICKER
    // ==========================================

    case "sticker":
    case "s": {
        await react("✨");

        const { Sticker, StickerTypes } = require('wa-sticker-formatter');

        const quotedMsg =
            m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        const mediaMessage =
            quotedMsg?.imageMessage ||
            quotedMsg?.videoMessage ||
            m.message?.imageMessage ||
            m.message?.videoMessage;

        if (!mediaMessage) {
            return await replyWithStyle(
                sock,
                remoteJid,
                "❌ Reply to image/video!",
                m
            );
        }

        const media = await sock.downloadMediaMessage(
            quotedMsg ? { message: quotedMsg } : m
        );

        const sticker = new Sticker(media, {
            pack: "JAMPAN-XMD",
            author: "Kelvin Jampan",
            type: StickerTypes.FULL,
            quality: 70
        });

        await sock.sendMessage(
            remoteJid,
            {
                sticker: await sticker.toBuffer()
            },
            { quoted: m }
        );

        break;
    }

    // ==========================================
    // GITHUB
    // ==========================================

    case "github":
    case "gh": {
        if (!args[0]) {
            return await replyWithStyle(
                sock,
                remoteJid,
                `❌ Example: ${prefix}github repo`,
                m
            );
        }

        await react("📃");

        try {
            const response = await axios.get(
                `https://api.github.com/users/${args[0]}`
            );

            const data = response.data;

            const githubText =
`╭━━〔 GITHUB INFO 〕━━⬣
┃ 👤 Name: ${data.name || "N/A"}
┃ 🔖 Username: ${data.login}
┃ 👥 Followers: ${data.followers}
┃ 📦 Repos: ${data.public_repos}
┃ 🌍 Location: ${data.location || "N/A"}
┃ 🔗 ${data.html_url}
╰━━━━━━━━━━━━━━━━━━⬣`;

            await sock.sendMessage(
                remoteJid,
                {
                    image: {
                        url: data.avatar_url
                    },
                    caption: githubText
                },
                { quoted: m }
            );

        } catch (e) {
            await replyWithStyle(
                sock,
                remoteJid,
                "❌ GitHub user not found!",
                m
            );
        }

        break;
    }

    // ==========================================
    // TAGALL
    // ==========================================

    case "tagall": {
        if (!isGroup) {
            return await replyWithStyle(
                sock,
                remoteJid,
                "❌ Group only command!",
                m
            );
        }

        await react("📢");

        const metadata = await sock.groupMetadata(remoteJid);

        const participants = metadata.participants;

        let teks = `📢 *TAG ALL*\n\n`;

        for (let mem of participants) {
            teks += `👤 @${mem.id.split("@")[0]}\n`;
        }

        await sock.sendMessage(
            remoteJid,
            {
                text: teks,
                mentions: participants.map(v => v.id)
            },
            { quoted: m }
        );

        break;
    }

    // ==========================================
    // GROUP LINK
    // ==========================================

    case "link": {
        if (!isGroup) {
            return await replyWithStyle(
                sock,
                remoteJid,
                "❌ Group only!",
                m
            );
        }

        await react("🔗");

        const code = await sock.groupInviteCode(remoteJid);

        await replyWithStyle(
            sock,
            remoteJid,
            `🔗 https://chat.whatsapp.com/${code}`,
            m
        );

        break;
    }









    // ================================
    // DEFAULT
    // ================================
    default:
        break;
}
    } catch (err) {
        console.log(chalk.red('Command Error:'), err);
    }
};

// ================================
// EXPORTS
// ================================
module.exports = {
    handleCommands,
    runtime,
    replyWithStyle,
    delay
};