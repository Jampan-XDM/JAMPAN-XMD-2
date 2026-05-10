const fs = require('fs');
const path = require('path');

async function startPairing(phoneNumber) {
    // 1. FUTA SESSION YA ZAMANI ILI KUEPUKA "Precondition Required"
    const sessionPath = path.join(__dirname, 'session');
    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState('session');
    // ... endelea na kodi zako zingine kama zilivyo
