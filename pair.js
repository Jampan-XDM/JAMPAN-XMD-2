pair.js

const {
    default: makeWASocket,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason,
    fetchLatestBaileysVersion,
    delay
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const fs = require('fs');
const path = require('path');
const commands = require('./command');

const sessionPath = path.join(__dirname, 'session');

async function startBot(phoneNumber, res) {
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),

        browser: Browsers.macOS('Chrome'),

        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(
                state.keys,
                pino({ level: 'silent' })
            )
        },

        markOnlineOnConnect: false,
        syncFullHistory: false,
        shouldSyncHistoryMessage: () => false,
        defaultQueryTimeoutMs: 15000,
        connectTimeoutMs: 20000,
        keepAliveIntervalMs: 10000,
        emitOwnEvents: false,
        generateHighQualityLinkPreview: false,
        retryRequestDelayMs: 250
    });

    sock.ev.on('creds.update', saveCreds);

    // PAIR CODE FAST FIX
    if (!sock.authState.creds.registered) {
        await delay(1500);

        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

        try {
            const code = await sock.requestPairingCode(cleanNumber);

            if (!res.headersSent) {
                res.json({
                    status: true,
                    creator: 'Kelvin Jampan',
                    code: code.match(/.{1,4}/g).join('-')
                });
            }
        } catch (err) {
            console.log('PAIR ERROR:', err);

            if (!res.headersSent) {
                return res.status(500).json({
                    status: false,
                    error: 'Failed to generate pair code'
                });
            }
        }
    }

    // CONNECTION EVENTS
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'connecting') {
            console.log('🔄 JAMPAN-XMD connecting...');
        }

        if (connection === 'open') {
            console.log('✅ JAMPAN-XMD connected instantly');

            await sock.sendMessage(sock.user.id, {
                text:
                    '⚡ *JAMPAN-XMD CONNECTED*\n\n' +
                    '✅ Login successful\n' +
                    '🚀 Speed optimized\n' +
                    '💻 Browser: Chrome macOS\n' +
                    '📦 Commands loaded successfully'
            });
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;

            console.log('❌ Connection closed:', reason);

            if (reason !== DisconnectReason.loggedOut) {
                console.log('♻️ Reconnecting...');
                startBot(phoneNumber, res);
            }
        }
    });

    // COMMAND HANDLER
    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const msg = messages[0];

            if (!msg.message) return;
            if (msg.key.fromMe) return;

            const from = msg.key.remoteJid;

            const body =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                msg.message.imageMessage?.caption ||
                '';

            const prefix = '.';

            if (!body.startsWith(prefix)) return;

            const args = body.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();

            if (commands[command]) {
                await commands[command](sock, from, args, msg);
            }
        } catch (err) {
            console.log('MESSAGE ERROR:', err);
        }
    });
}

module.exports = {
    startBot
};


---

command.js

module.exports = {
    ping: async (sock, from) => {
        const start = Date.now();

        const sent = await sock.sendMessage(from, {
            text: '🚀 Testing speed...'
        });

        const speed = Date.now() - start;

        await sock.sendMessage(from, {
            text:
                '⚡ *JAMPAN-XMD STATUS*\n\n' +
                `🏓 Speed: ${speed}ms\n` +
                '✅ System: Online\n' +
                '🔥 Response: Fast'
        });
    },

    alive: async (sock, from) => {
        await sock.sendMessage(from, {
            text:
                '✅ *JAMPAN-XMD IS ACTIVE*\n\n' +
                '🚀 Bot running successfully\n' +
                '💻 Baileys connected\n' +
                '⚡ Stable mode enabled'
        });
    },

    menu: async (sock, from) => {
        await sock.sendMessage(from, {
            text:
                '╔═══〔 JAMPAN-XMD MENU 〕═══╗\n\n' +
                '➤ .ping\n' +
                '➤ .alive\n' +
                '➤ .menu\n\n' +
                '╚══════════════════════╝'
        });
    }
};


---

index.js

const express = require('express');
const cors = require('cors');
const { startBot } = require('./pair');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    res.send('⚡ JAMPAN-XMD SERVER ACTIVE');
});

app.get('/pair', async (req, res) => {
    const number = req.query.number;

    if (!number) {
        return res.status(400).json({
            status: false,
            error: 'Number required'
        });
    }

    try {
        await startBot(number, res);
    } catch (err) {
        console.log(err);

        if (!res.headersSent) {
            res.status(500).json({
                status: false,
                error: 'Server busy'
            });
        }
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on ${PORT}`);
});


---

package.json

{
  "name": "jampan-xmd",
  "version": "4.0.0",
  "description": "Fast WhatsApp Pair Bot",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.7.7",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "pino": "^9.0.0"
  },
  "engines": {
    "node": ">=18.x"
  }
}


---

FIXES ZILIZOFANYWA

✅ Login speed optimized ✅ Pair code faster ✅ Commands zimehamishwa command.js ✅ Auto reconnect added ✅ History sync disabled ✅ Loading kubwa imepunguzwa ✅ Stable Baileys settings ✅ Cleaner connection handling ✅ Better timeout settings


---

DEPLOY UPYA

1. Replace files zote


2. Upload GitHub


3. Deploy upya kwenye Heroku


4. Test:



https://YOUR-APP.herokuapp.com/pair?number=2557XXXXXXXX