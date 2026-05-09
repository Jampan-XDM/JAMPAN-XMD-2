    socket.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const mText = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
            const from = msg.key.remoteJid;
            
            // Hapa tunaweka prefix yetu kuwa nukta (.)
            const prefix = ".";
            const isCmd = mText.startsWith(prefix);
            const command = isCmd ? mText.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : null;

            if (command === 'ping') {
                const start = Date.now();
                await socket.sendMessage(from, { text: "⚡ *JAMPAN-XMD:* Pinging..." });
                const end = Date.now();
                await socket.sendMessage(from, { 
                    text: `🚀 *Pong!*\nSpeed: *${end - start}ms*\n👑 *JAMPAN-XMD Status: Active*` 
                });
            }
            
            // Unaweza kuongeza amri nyingine hapa chini kirahisi
            if (command === 'menu') {
                await socket.sendMessage(from, { 
                    text: "🎮 *JAMPAN-XMD MENU*\n\n.ping - Check Speed\n.info - Bot Info\n\n📢 Join Channel: https://whatsapp.com/channel/0029Vb7fTNf3QxS8A6rbBB3S" 
                });
            }

        } catch (err) {
            console.log("Error handling message:", err);
        }
    });
