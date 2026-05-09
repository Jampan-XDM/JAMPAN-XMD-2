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

let sock;

async function connectBot() {

    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(
        sessionPath
    );

    sock = makeWASocket({

        version: [2, 2413, 1],

        logger: pino({
            level: 'silent'
        }),

        browser: Browsers.windows(
            'Chrome'
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

        syncFullHistory: false
    });

    sock.ev.on(
        'creds.update',
        saveCreds
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

    return sock;
}

async function getPair(number) {

    if (!sock) {

        await connectBot();

        // WAIT SOCKET
        await new Promise(resolve =>
            setTimeout(resolve, 8000)
        );
    }

    const code =
        await sock.requestPairingCode(
            number
        );

    return code;
}

module.exports = {
    connectBot,
    getPair
};