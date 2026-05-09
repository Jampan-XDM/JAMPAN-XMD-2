const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
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

    const { version } =
        await fetchLatestBaileysVersion();

    const sock = makeWASocket({

        version,

        logger: pino({
            level: 'silent'
        }),

        browser: Browsers.macOS(
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
                'open'
            ) {

                console.log(
                    '✅ Connected'
                );

            }

            if (
                connection ===
                'connecting'
            ) {

                console.log(
                    '🔄 Connecting...'
                );

            }
        }
    );

    return code;
}

module.exports = {
    startBot
};