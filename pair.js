async function startPairing(phoneNumber) {
    const sessionPath = path.join(__dirname, 'session');
    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        // BADILISHA HAPA: Tumia MacOS Chrome ili ionekane kama PC ya kawaida
        browser: Browsers.macOS("Chrome"),
        syncFullHistory: false,
        markOnlineOnConnect: false, // Iwe false kuzuia kuji-connect mapema mno
    });

    sock.ev.on('creds.update', saveCreds);

    return new Promise(async (resolve, reject) => {
        // Timeout kuzuia server isizunguke milele kama imekwama
        const timeout = setTimeout(() => {
            sock.end();
            reject(new Error("Request Timed Out"));
        }, 30000); 

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'open') {
                const myNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                await sock.sendMessage(myNumber, { text: `*JAMPAN XMD CONNECTED!* ✅` });
                // MUHIMU: Baada ya ku-pair, usifunge hapa, acha bot iendelee
            }
            if (connection === 'close') {
                console.log("Connection closed, trying to fix...");
            }
        });

        try {
            await delay(5000); // Ipe sekunde 5 kamili iwe imetulia
            let cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
            
            if (!sock.authState.creds.registered) {
                const code = await sock.requestPairingCode(cleanedNumber);
                clearTimeout(timeout); // Ondoa timeout kwa sababu kodi imepatikana
                resolve(code);
            }
        } catch (error) {
            clearTimeout(timeout);
            sock.end();
            reject(error);
        }
    });
}
