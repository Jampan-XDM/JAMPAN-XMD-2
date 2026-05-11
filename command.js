module.exports = async (sock, m, prefix) => {
    const body = m.message.conversation || m.message.extendedTextMessage?.text;
    if (!body || !body.startsWith(prefix)) return;

    const command = body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();

    if (command === 'ping') {
        await sock.sendMessage(m.key.remoteJid, { text: 'Pong! 🏓 Bot is Active.' });
    }

    if (command === 'menu') {
        let menuText = `*--- ${require('./config').BOT_NAME} ---*\n\n`;
        menuText += `1. ${prefix}ping - I'm online huh\n`;
        menuText += `2. ${prefix}menu - Onyesha orodha hii\n\n_Powered by Jampani Tech_`;
        await sock.sendMessage(m.key.remoteJid, { text: menuText });
    }
};
