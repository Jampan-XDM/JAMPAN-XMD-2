const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    // TUMIA HII: Inasaidia kukubalika haraka na WhatsApp servers
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    
    // --- FIX YA LOGIN YA MUDA MREFU ---
    syncFullHistory: false,            // Zima kabisa kupakua meseji za zamani
    shouldSyncHistoryMessage: () => false, // Zuia sync ya aina yoyote
    linkPreviewHighQuality: false,     // Punguza mzigo wa data
    maxMsgRetryCount: 1,               // Usijaribu kurudia meseji ikifeli
    connectTimeoutMs: 60000,           // Ongeza muda wa kusubiri connection
    
    // Hii inasaidia kuzuia RAM isijae na kufanya bot i-hang
    maxMemoryUsageInMB: 100 
});
