import express from "express";
import pino from "pino";
import {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("JAMPAN XMD BOT IS RUNNING 🚀");
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

// BOT START
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: false,
    browser: ["JAMPAN-XMD", "Chrome", "1.0.0"]
  });

  // SAVE SESSION
  sock.ev.on("creds.update", saveCreds);

  // CONNECTION UPDATE
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      console.log("Connection closed. Reconnecting...", shouldReconnect);

      if (shouldReconnect) {
        startBot();
      }
    }

    if (connection === "open") {
      console.log("✅ WhatsApp Connected Successfully");
    }
  });

  // 👇 PAIR CODE SYSTEM FIXED
  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      let code = await sock.requestPairingCode(process.env.NUMBER);
      console.log("PAIR CODE 👉 " + code);
    }, 3000);
  }
}

startBot().catch(console.error);