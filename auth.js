const { useMultiFileAuthState } = require('@whiskeysockets/baileys')
const fs = require('fs')

async function getAuthState() {
    const { state, saveCreds } = await useMultiFileAuthState('./session')

    return { state, saveCreds }
}

module.exports = { getAuthState }