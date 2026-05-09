const {
    default: makeWASocket,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
    Browsers,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const fs = require('fs');
const path = require('path');

const commands = require('./command');

const sessionPath =
    path.join(__dirname, 'session');

async function startBot(number) {

    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, {
            recursive: true
        });
    }

    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(
        sessionPath
    );

    const { version } =
        await fetchLatestBaileysVersion();

    const sock = makeWASocket({

        version,

        logger: pino({
            level: 'silent'
        }),

        browser: Browsers.windows('Chrome'),

        printQRInTerminal: false,

        auth: {
            creds: state.creds,

            keys:
                makeCacheableSignalKeyStore(
                    state.keys,
                    pino({ level: 'silent' })
                )
        },

        markOnlineOnConnect: true,
        syncFullHistory: false,
        defaultQueryTimeoutMs: 0,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        retryRequestDelayMs: 2000,
        fireInitQueries: false,
        emitOwnEvents: false,
        generateHighQualityLinkPreview: false
    });

    sock.ev.on(
        'creds.update',
        saveCreds
    );

    // FAST PAIR
    let code;

    if (!sock.authState.creds.registered) {

        code =
            await sock.requestPairingCode(
                number
            );

        console.log(
            'PAIR CODE:',
            code
        );
    }

    sock.ev.on(
        'connection.update',
        async (update) => {

            const {
                connection,
                lastDisconnect
            } = update;

            if (connection === 'connecting') {

                console.log(
                    '🔄 Connecting...'
                );

            }

            if (connection === 'open') {

                console.log(
                    '✅ Connected'
                );

                await sock.sendMessage(
                    sock.user.id,
                    {
                        text:
                            '⚡ JAMPAN-XMD CONNECTED\n\n' +
                            '✅ Stable Login Success'
                    }
                );

            }

            if (connection === 'close') {

                const reason =
                    lastDisconnect?.error
                    ?.output?.statusCode;

                console.log(
                    '❌ Closed:',
                    reason
                );

                // SESSION EXPIRED
                if (
                    reason ===
                    DisconnectReason.loggedOut
                ) {

                    fs.rmSync(
                        sessionPath,
                        {
                            recursive: true,
                            force: true
                        }
                    );

                    console.log(
                        '🗑 Session Deleted'
                    );

                } else {

                    console.log(
                        '♻️ Reconnecting...'
                    );

                    startBot(number);

                }
            }
        }
    );

    // COMMANDS
    sock.ev.on(
        'messages.upsert',
        async ({ messages }) => {

            const msg = messages[0];

            if (!msg.message) return;
            if (msg.key.fromMe) return;

            const from =
                msg.key.remoteJid;

            const body =
                msg.message.conversation ||
                msg.message
                .extendedTextMessage?.text ||
                '';

            const prefix = '.';

            if (
                !body.startsWith(prefix)
            ) return;

            const args =
                body.slice(1)
                .trim()
                .split(/ +/);

            const command =
                args.shift()
                .toLowerCase();

            if (commands[command]) {

                commands[command](
                    sock,
                    from,
                    args,
                    msg
                );

            }
        }
    );

    return code;
}

module.exports = {
    startBot
};