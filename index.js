const express = require("express");
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("JAMPAN XMD BOT ACTIVE 🚀");
});

app.listen(PORT, () => {
  console.log("Server running on " + PORT);
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      console.log("Reconnecting...", shouldReconnect);

      if (shouldReconnect) startBot();
    }

    if (connection === "open") {
      console.log("✅ Bot Connected");
    }
  });

  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(process.env.NUMBER);
        console.log("PAIR CODE =>", code);
      } catch (e) {
        console.log("Pair error:", e);
      }
    }, 4000);
  }
}

startBot();