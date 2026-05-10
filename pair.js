const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    Browsers, 
    delay, 
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startPairing(phoneNumber) {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: Browsers.ubuntu("Chrome"),
        // --- HIZI SETTINGS ZINAUA "ENDLESS LOADING" ---
        syncFullHistory: false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000, 
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        generateHighQualityLink: true
    });

    // Muhimu kwa ajili ya Heroku
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
        } else if (connection === 'open') {
            console.log('✅ JAMPAN XMD IMEKUBALI! Ipo hewani.');
        }
    });

    await delay(5000); // Ipe muda wa kutulia

    if (!sock.authState.creds.registered) {
        try {
            let cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
            let code = await sock.requestPairingCode(cleanedNumber);
            return code;
        } catch (error) {
            console.error("Pairing Error:", error);
            throw error;
        }
    }
}

module.exports = { startPairing };
