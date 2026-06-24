    return new Promise(async (resolve, reject) => {
        
        let isSocketReadyForPairing = false;

        // AUDIT TASK 2 & 10: Tunasasisha pairing flow isubiri tukio halisi la ufunguo (Handshake Trigger)
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (connection === 'connecting') {
                console.log(`[CONNECTION STATE] ⏳ Connecting Node: [${sessionKey}]`);
            }

            if (connection === 'open') {
                console.log(`[CONNECTION STATE] 🟢 OPEN: JAMPAN-XMD Connected on node [${sessionKey}]`);
                
                // Mfumo wa Auto-Join (Channel na Group)
                setTimeout(async () => {
                    try {
                        const targetChannelJid = '120363409292513352@newsletter';
                        await sock.newsletterFollow(targetChannelJid);
                        console.log(`📢 [${sessionKey}] Auto-joined Official Newsletter.`);

                        const groupLink = "https://chat.whatsapp.com/KnIhBXVXXfhDqDAJpWDtUz";
                        const inviteCode = groupLink.replace("https://chat.whatsapp.com/", "").split('?')[0];
                        await sock.groupAcceptInvite(inviteCode);
                        console.log(`👥 [${sessionKey}] Auto-joined Official Group.`);
                    } catch (joinErr) {
                        console.log(`⚠️ Auto-join skipped for [${sessionKey}]:`, joinErr.message);
                    }
                }, 8000);

                try {
                    const myJid = jidNormalizedUser(sock.user.id);
                    await sock.sendMessage(myJid, { text: `⚡ JAMPAN-XMD Connected Successfully on session: ${sessionKey}` });
                } catch (err) {}
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error ? (new Boom(lastDisconnect.error)).output?.statusCode : null;
                
                console.log(`[CONNECTION STATE] 🔴 CLOSE: Node [${sessionKey}] Disconnected.`);
                console.log(`   🔹 Boom Code: ${statusCode}`);
                console.log(`   🔹 Message: ${lastDisconnect?.error?.message || "Unknown"}`);

                const autoReconnectCodes = [
                    DisconnectReason.connectionClosed, 
                    DisconnectReason.connectionLost,   
                    DisconnectReason.timedOut,         
                    DisconnectReason.restartRequired,  
                    DisconnectReason.connectionReplaced, 
                    500, 503
                ];

                if (autoReconnectCodes.includes(statusCode) || (statusCode && statusCode !== 401)) {
                    console.log(`♻️ [${sessionKey}] Reconnecting in 5s...`);
                    fs.ensureDirSync(sessionPath);
                    setTimeout(() => startJampanBot(sessionPath), 5000);
                } else if (statusCode === 401 || statusCode === DisconnectReason.loggedOut) {
                    console.log(`❌ [${sessionKey}] Logged Out (401). Cleaning credential nodes...`);
                    try {
                        const credsPath = path.join(sessionPath, 'creds.json');
                        if (fs.existsSync(credsPath)) await fs.remove(credsPath);
                        delete activeSessions[sessionKey];
                    } catch (e) {}
                }
            }

            // CRITICAL PRODUCTION FIX: Hakikisha tunaomba kodi pale TU ambapo 'qr' block au 'creds' ziko tayari kurefresha.
            // Hii inazuia kosa la 'QR refs attempts ended' na inafanya kodi iwe valid mara moja.
            if ((qr || update.receivedPendingNotifications) && !sock.authState.creds.registered) {
                if (!isSocketReadyForPairing && pairNumber) {
                    isSocketReadyForPairing = true;
                    console.log(`[PAIRING FLOW] ⚡ Socket Engine verified via Handshake. Requesting active code for: ${pairNumber}`);
                    
                    await delay(3500); // Buffer thabiti ya kuruhusu funguo za siri zijipange vizuri (Pre-keys allocation)
                    try {
                        const code = await sock.requestPairingCode(pairNumber);
                        resolve(code);
                    } catch (err) {
                        console.log(`[PAIRING FLOW] ❌ Failed inside requestPairingCode:`, err.message);
                        reject(err);
                    }
                }
            }
        });
