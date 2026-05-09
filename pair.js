const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function getPairCode(phoneNumber, res) {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    
    const socket = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }).child({ level: "fatal" }),
        browser: ["Chrome (Linux)", "", ""]
    });

    if (!socket.authState.creds.registered) {
        await delay(1500);
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        
        try {
            let code = await socket.requestPairingCode(phoneNumber);
            if (!res.headersSent) {
                res.send({ code: code });
            }
        } catch (error) {
            console.error(error);
            res.status(500).send({ error: "Fail to get code" });
        }
    }

    socket.ev.on('creds.update', saveCreds);
}

module.exports = { getPairCode };
