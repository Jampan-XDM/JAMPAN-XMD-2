const {
    default: makeWASocket,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
    Browsers
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const path = require('path');

const sessionPath =
    path.join(__dirname, 'session');

async function startBot(number) {

    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(
        sessionPath
    );

    // FIXED BAILEYS VERSION
    const version = [2, 2413, 1];

    const sock = makeWASocket({

        version,

        logger: pino({
            level: 'silent'
        }),

        browser: Browsers.macOS(
            'Desktop'
        ),

        printQRInTerminal: false,

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
        markOnlineOnConnect: false,
        fireInitQueries: true,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        defaultQueryTimeoutMs: 0
    });

    sock.ev.on(
        'creds.update',
        saveCreds
    );

    // WAIT SMALL TIME
    await new Promise(resolve =>
        setTimeout(resolve, 5000)
    );

    // GENERATE PAIR
    const code =
        await sock.requestPairingCode(
            number
        );

    console.log(
        'PAIR CODE:',
        code
    );

    sock.ev.on(
        'connection.update',
        ({ connection }) => {

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
                    '✅ Connected'
                );

            }

            if (
                connection ===
                'close'
            ) {

                console.log(
                    '❌ Connection Closed'
                );

            }
        }
    );

    return code;
}

module.exports = {
    startBot
};