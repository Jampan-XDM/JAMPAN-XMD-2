const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore, 
    DisconnectReason 
} = require("@whiskeysockets/baileys");
const pino = require("pino");

async function getPairCode(phoneNumber, res) {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    
    const socket = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        browser: ["Chrome (Linux)", "", ""] // Hii ni muhimu kwa pairing
    });

    // Kama haijasajiliwa, omba kodi
    if (!socket.authState.creds.registered) {
        await delay(1500);
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
        
        try {
            let code = await socket.requestPairingCode(cleanNumber);
            if (!res.headersSent) {
                res.send({ code: code });
            }
        } catch (error) {
            console.error(error);
            if (!res.headersSent) res.status(500).send({ error: "Imeshindwa kupata kodi" });
        }
    }

    // HII NDIYO SEHEMU MUHIMU: Inasubiri muunganisho
    socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log("✅ JAMPAN-XMD IMESHAUNGANISHWA!");
            // Hapa unaweza kutuma ujumbe wa kwanza wa uthibitisho
            await socket.sendMessage(socket.user.id, { text: "⚡ *JAMPAN-XMD IMEUNGANISHWA!* \n\nSasa bot iko active. Karibu kwenye ulimwengu wa JAMPAN." });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                // Usizime server, jaribu tena kama sio logout ya makusudi
                getPairCode(phoneNumber, res);
            }
        }
    });

    socket.ev.on('creds.update', saveCreds);
}

module.exports = { getPairCode };

// Ndani ya pair.js
try {
    let code = await socket.requestPairingCode(cleanNumber);
    if (!res.headersSent) {
        res.send({ code: code });
    }
} catch (error) {
    console.error("PAIRS REQUEST ERROR:", error);
    if (!res.headersSent) {
        res.status(500).json({ error: "WhatsApp Server is busy, try again." });
    }
}
