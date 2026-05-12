// ... (Kodi zako za juu za connection zibaki vile vile)

sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        const m = chatUpdate.messages[0];
        if (!m.message) return;

        // TUNALIPAKUA FILE LA COMMANDS HAPA
        const plugin = require('./commands'); 
        
        // Tunazituma data zote muhimu kwenda kwenye commands.js
        await plugin.handleCommand(sock, m, settings);

    } catch (err) {
        // Kama kuna error kwenye commands.js, isizime bot nzima
        console.error("Error in commands.js:", err);
    }
});
