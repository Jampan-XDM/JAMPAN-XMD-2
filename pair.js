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

    const { state, saveCreds } =
        await useMultiFileAuthState(sessionPath);

    const { version } =
        await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        printQRInTerminal: false,

        logger: pino({
            level: 'silent'
        }),

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

    // FAST PAIR CODE
    if (!sock.authState.creds.registered) {

        await delay(1500);

        const cleanNumber =
            phoneNumber.replace(/[^0-9]/g, '');

        try {

            const code =
                await sock.requestPairingCode(cleanNumber);

            if (!res.headersSent) {

                res.json({
                    status: true,
                    creator: 'Kelvin Jampan',
                    code: code.match(/.{1,4}/g).join('-')
                });

            }

        } catch (err) {

            console.log(err);

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

        const {
            connection,
            lastDisconnect
        } = update;

        if (connection === 'connecting') {
            console.log('🔄 Connecting...');
        }

        if (connection === 'open') {

            console.log('✅ Connected Successfully');

            await sock.sendMessage(sock.user.id, {
                text:
                    '⚡ *JAMPAN-XMD CONNECTED*\n\n' +
                    '✅ Login successful\n' +
                    '🚀 Fast Mode Enabled\n' +
                    '💻 Chrome macOS\n' +
                    '🔥 Commands Loaded'
            });

        }

        if (connection === 'close') {

            const reason =
                lastDisconnect?.error?.output?.statusCode;

            console.log('❌ Connection Closed:', reason);

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

            const args =
                body.slice(prefix.length)
                .trim()
                .split(/ +/);

            const command =
                args.shift().toLowerCase();

            if (commands[command]) {

                await commands[command](
                    sock,
                    from,
                    args,
                    msg
                );

            }

        } catch (err) {

            console.log('MESSAGE ERROR:', err);

        }
    });
}

module.exports = {
    startBot
};