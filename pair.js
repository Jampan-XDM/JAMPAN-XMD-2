const { state, saveCreds } = await useMultiFileAuthState('session');
const { version } = await fetchLatestBaileysVersion();

const sock = makeWASocket({
    version,
    auth: state, // Hakikisha hii state ipo
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    // TUMIA HII: Inazuia WhatsApp isikukatalie connection
    browser: Browsers.ubuntu('Chrome'),
    
    // --- HIZI LINE 2 NDIO ZINAZUIA FAIL TO LOGIN ---
    mobile: false, // Weka false kama unatumia pairing code
    markOnlineOnConnect: true,
    
    // Zuia sync ya historia inayoweza ku-crash server
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    
    // Ongeza muda wa kusubiri handshake
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
});

// LAZIMA: Update creds kila zinapobadilika
sock.ev.on('creds.update', async () => {
    await saveCreds();
});
