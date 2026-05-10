const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    Browsers, 
    delay, 
    fetchLatestBaileysVersion 
} = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startPairing(phoneNumber) {
    // 1. Tumia state na saveCreds
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: Browsers.ubuntu("Chrome"),
        // 2. Ongeza hizi mbili kuzuia kupoteza muda (Fast Auth)
        syncFullHistory: false,
        markOnlineOnConnect: true 
    });

    // 3. LAZIMA uweke hii hapa juu kurekodi credentials
    sock.ev.on('creds.update', saveCreds);

    // 4. LINDENI MUUNGANISHO (Connection Fix)
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log("✅ JAMPAN XMD Connected Successfully!");
        }
    });

    await delay(3000);

    if (!sock.authState.creds.registered) {
        try {
            let cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
            // 5. Baadhi ya matoleo ya Baileys yanahitaji delay kidogo hapa
            await delay(1500);
            let code = await sock.requestPairingCode(cleanedNumber);
            return code;
        } catch (error) {
            console.error("Pairing Error:", error);
            throw error;
        }
    }
}

module.exports = { startPairing };
