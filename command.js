const config = require("./config")

async function commands(sock, msg) {

    try {

        const from = msg.key.remoteJid

        const body =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            ""

        // PING
        if (body === `${config.PREFIX}ping`) {

            await sock.sendMessage(from, {
                text: "🏓 Pong!\n✅ JAMPAN XMD ACTIVE"
            })

        }

        // MENU
        if (body === `${config.PREFIX}menu`) {

            const menu = `
╭━━━〔 ${config.BOT_NAME} 〕━━━⬣

👑 Owner : ${config.OWNER_NAME}
⚡ Prefix : ${config.PREFIX}
🤖 Mode   : Multi Device

┣━━━〔 COMMANDS 〕━━━⬣

🏓 .ping
📜 .menu

╰━━━━━━━━━━━━━━⬣
`

            await sock.sendMessage(from, {
                text: menu
            })

        }

    } catch (e) {

        console.log("COMMAND ERROR:", e)

    }

}

module.exports = commands