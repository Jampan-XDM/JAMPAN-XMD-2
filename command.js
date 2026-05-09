module.exports = {

    ping: async (sock, from) => {

        const start = Date.now();

        await sock.sendMessage(from, {
            text: '🚀 Testing speed...'
        });

        const speed =
            Date.now() - start;

        await sock.sendMessage(from, {
            text:
                '⚡ *JAMPAN-XMD STATUS*\n\n' +
                `🏓 Speed: ${speed}ms\n` +
                '✅ System Online\n' +
                '🔥 Fast Response'
        });

    },

    alive: async (sock, from) => {

        await sock.sendMessage(from, {
            text:
                '✅ *JAMPAN-XMD ACTIVE*\n\n' +
                '🚀 Bot running successfully\n' +
                '💻 Baileys Connected\n' +
                '⚡ Stable Mode Enabled'
        });

    },

    menu: async (sock, from) => {

        await sock.sendMessage(from, {
            text:
                '╔═══〔 JAMPAN-XMD MENU 〕═══╗\n\n' +
                '➤ .ping\n' +
                '➤ .alive\n' +
                '➤ .menu\n\n' +
                '╚══════════════════════╝'
        });

    }

};