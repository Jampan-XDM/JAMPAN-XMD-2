const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    DisconnectReason,
    Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");

async function getPairCode(phoneNumber, res) {
    const { state, saveCreds } = await useMultiFileAuthState('./session');

    const logger = pino({ level: "silent" });

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger,
        browser: Browsers.macOS("Chrome"),
        markOnlineOnConnect: true
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
            console.log("CONNECTED");

            if (!sock.authState.creds.registered) {
                await delay(2000);

                const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");

                try {
                    const code = await sock.requestPairingCode(cleanNumber);

                    // 🔥 IMPORTANT: rudisha code kwa frontend
                    return res.json({
                        success: true,
                        code: code
                    });

                } catch (e) {
                    return res.json({
                        success: false,
                        error: e.message
                    });
                }
            }
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log("Disconnected:", reason);
        }
    });
}

module.exports = { getPairCode };