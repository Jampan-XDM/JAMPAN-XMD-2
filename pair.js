const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers,
    makeCacheableSignalKeyStore
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

        printQRInTerminal: false,

        browser: Browsers.windows(
            'Chrome'
        ),

        auth: {
            creds: state.creds,

            keys:
                makeCacheableSignalKeyStore(
                    state.keys,
                    pino({
                        level: 'silent'
                    })
                )
        },

        syncFullHistory: false,
        markOnlineOnConnect: true,
        defaultQueryTimeoutMs: undefined,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        emitOwnEvents: false,
        fireInitQueries: true,
        generateHighQualityLinkPreview: false
    });

    sock.ev.on(
        'creds.update',
        saveCreds
    );

    // WAIT SOCKET READY
    await new Promise((resolve) => {

        sock.ev.on(
            'connection.update',
            (update) => {

                const {
                    connection
                } = update;

                if (
                    connection ===
                    'connecting'
                ) {

                    console.log(
                        '🔄 Connecting...'
                    );

                }

                if (
                    connection ===
                    'open'
                ) {

                    console.log(
                        '✅ Socket Ready'
                    );

                    resolve();

                }
            }
        );
    });

    // REQUEST PAIR
    let code;

    if (
        !sock.authState.creds
        .registered
    ) {

        code =
            await sock.requestPairingCode(
                number
            );

        console.log(
            'PAIR:',
            code
        );

    }

    // CONNECTION EVENTS
    sock.ev.on(
        'connection.update',
        async (update) => {

            const {
                connection,
                lastDisconnect
            } = update;

            if (
                connection ===
                'open'
            ) {

                console.log(
                    '✅ Connected'
                );

            }

            if (
                connection ===
                'close'
            ) {

                const reason =
                    lastDisconnect
                    ?.error?.output
                    ?.statusCode;

                console.log(
                    '❌ Closed:',
                    reason
                );

                // LOGOUT
                if (
                    reason ===
                    DisconnectReason
                    .loggedOut
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

            try {

                const msg =
                    messages[0];

                if (!msg.message)
                    return;

                if (
                    msg.key.fromMe
                ) return;

                const from =
                    msg.key.remoteJid;

                const body =
                    msg.message
                    .conversation ||

                    msg.message
                    .extendedTextMessage
                    ?.text ||

                    '';

                const prefix = '.';

                if (
                    !body.startsWith(
                        prefix
                    )
                ) return;

                const args =
                    body.slice(1)
                    .trim()
                    .split(/ +/);

                const command =
                    args.shift()
                    .toLowerCase();

                if (
                    commands[
                        command
                    ]
                ) {

                    await commands[
                        command
                    ](
                        sock,
                        from,
                        args,
                        msg
                    );

                }

            } catch (err) {

                console.log(err);

            }
        }
    );

    return code;
}

module.exports = {
    startBot
};