const config = require("./config")

async function commands(sock, msg) {

    try {

        const from = msg.key.remoteJid

        const message =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            ""

        const body = message.trim()

        // PING
        if (body === `${config.PREFIX}ping`) {

            await sock.sendMessage(from, {
                text: "🏓 Pong!\n✅ JAMPAN XMD ACTIVE"
            })

        }

        // MENU
        if (body === `${config.PREFIX}menu`) {

            let menu = `
╭━━━〔 ${config.BOT_NAME} 〕━━━⬣
┃
┃ 👑 Owner : ${config.OWNER_NAME}
┃ 🤖 Mode  : Multi Device
┃ ⚡ Prefix: ${config.PREFIX}
┃
┣━━━〔 COMMANDS 〕━━━⬣
┃
┃ 🏓 .ping
┃ 📜 .menu
┃
╰━━━━━━━━━━━━━━⬣
`

            await sock.sendMessage(from, {
                text: menu
            })

        }

    } catch (err) {
        console.log("COMMAND ERROR:", err)
    }
}

module.exports = commands