const { sms } = require('./msg'); // Ilete file la msg.js

// Ndani ya connection function...
sock.ev.on('messages.upsert', async ({ messages }) => {
    let msg = messages[0];
    if (!msg.message) return;

    // "Safi" ujumbe kwa kutumia msg.js
    const m = sms(sock, msg);

    // Mfano wa amri:
    const prefix = ".";
    const isCmd = m.body.startsWith(prefix);
    const command = isCmd ? m.body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : "";

    if (command === 'ping') {
        await m.reply("JAMPAN XMD Is Active! 🚀");
        await m.react("✅");
    }

    if (command === 'menu') {
        let menu = `*JAMPAN XMD MENU*\n\n` +
                   `🔹 ${prefix}ping - Angalia kama ipo hewani\n` +
                   `🔹 ${prefix}owner - Wasiliana na admin\n\n` +
                   `_Status: Online_`;
        await m.reply(menu);
    }
});
