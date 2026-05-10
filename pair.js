const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    Browsers, 
    delay, 
    fetchLatestBaileysVersion 
} = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startPairing(phoneNumber) {
    // Tunatumia folder la 'session' kuhifadhi funguo za siri
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: Browsers.ubuntu("Chrome"), // Browser thabiti zaidi kuzuia kigingi cha loading
        syncFullHistory: false, // Inapunguza muda wa ku-load chat za zamani
        mobile: false
    });

    // --- HIKI NDICHO KIPENGELE MUHIMU ---
    // Inaiambia WhatsApp: "Tayari nimepokea funguo, sasa fungua mlango!"
    sock.ev.on('creds.update', saveCreds);
    // ------------------------------------

    // Inasubiri socket iunganishwe vizuri
    await delay(3000);

    if (!sock.authState.creds.registered) {
        try {
            // Safisha namba (Ondoa alama yoyote isiyo namba)
            let cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
            
            // Omba code ya pairing
            let code = await sock.requestPairingCode(cleanedNumber);
            return code;
        } catch (error) {
            console.error("Pairing Error:", error);
            throw error;
        }
    }
}

module.exports = { startPairing };
