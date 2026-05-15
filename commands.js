const { proto, getContentType } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const axios = require('axios');

const { smsg, getGroupAdmins, formatp, taggz } = require('./lib/myfunc');
const config = require('./config');

const prefix = config.PREFIX || '.';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ================================
// KEEP ALIVE
// ================================
setInterval(async () => {
    try {
        await axios.get('https://jampan-5d4e46bde7ae.herokuapp.com/');
        console.log('📡 JAMPAN-XMD: Keep-alive success');
    } catch (err) {
        console.log('Keep-alive failed:', err.message);
    }
}, 1200000);

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
// STYLED REPLY
// ================================
const replyWithStyle = async (sock, jid, text, m) => {
    try {
        await sock.sendMessage(
            jid,
            {
                text,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    externalAdReply: {
                        title: 'JAMPAN-XMD',
                        body: 'Kelvin Jampan',
                        thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                        sourceUrl: 'https://whatsapp.com/channel/120363409292513352',
                        mediaType: 1
                    }
                }
            },
            { quoted: m }
        );

        await sock.sendMessage(
            jid,
            {
                audio: {
                    url: 'https://files.catbox.moe/vmc7k3.mp3'
                },
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

        const isOwner =
            sender.includes(settings.ownerNumber) ||
            m.key.fromMe;

        // ================================
        // MESSAGE TYPE
        // ================================
        const messageType = m.message
            ? Object.keys(m.message)[0]
            : '';

        // ================================
        // MESSAGE BODY
        // ================================
        let body = '';

        if (messageType === 'conversation') {
            body = m.message.conversation || '';
        } else if (messageType === 'extendedTextMessage') {
            body = m.message.extendedTextMessage.text || '';
        } else if (messageType === 'imageMessage') {
            body = m.message.imageMessage.caption || '';
        } else if (messageType === 'videoMessage') {
            body = m.message.videoMessage.caption || '';
        } else {
            body = '';
        }

        if (!body) return;

        // ================================
        // PRESENCE
        // ================================
        if (settings.autoTyping) {
            await sock.sendPresenceUpdate('composing', remoteJid);
        }

        if (settings.autoRecord) {
            await sock.sendPresenceUpdate('recording', remoteJid);
        }

        // ================================
        // CHATBOT LOGIC
        // ================================
        if (!body.startsWith(prefix) && !m.key.fromMe) {

            const shouldChat =
                (settings.chatbotMode === 'inbox' && !isGroup) ||
                (settings.chatbotMode === 'group' && isGroup) ||
                (settings.chatbotMode === 'all');

            if (shouldChat && body.length > 1) {

                try {

                    const response = await axios.post(
                        'https://api.openai.com/v1/chat/completions',
                        {
                            model: 'gpt-4o-mini',
                            messages: [
                                {
                                    role: 'user',
                                    content: body
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

                    await sock.sendMessage(
                        remoteJid,
                        {
                            text: aiReply
                        },
                        { quoted: m }
                    );

                } catch (e) {
                    console.log('AI Error:', e.message);
                }

                return;
            }

            return;
        }

        // ================================
        // COMMAND PREPARATION
        // ================================
        const command = body
            .slice(prefix.length)
            .trim()
            .split(/ +/)[0]
            .toLowerCase();

        const args = body
            .slice(prefix.length)
            .trim()
            .split(/ +/)
            .slice(1);

        const text = args.join(' ');

        const react = async (emoji) => {
            try {
                await sock.sendMessage(remoteJid, {
                    react: {
                        text: emoji,
                        key: m.key
                    }
                });
            } catch (err) {
                console.log('Reaction Error:', err.message);
            }
        };

        // ================================
        // PRIVATE MODE
        // ================================
        if (settings.mode === 'private' && !isOwner) {
            return;
        }

        // ================================
        // START COMMANDS
        // ================================
        switch (command) {

 
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