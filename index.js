const express = require("express");
const cors = require("cors");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const app = express();

app.use(cors());
app.use(express.json());

let sock = null;
let botReady = false;

async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState("session");

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === "open") {
        console.log("✅ JAMPAN XMD CONNECTED");
        botReady = true;
      }

      if (connection === "close") {
        botReady = false;

        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

        if (shouldReconnect) {
          console.log("🔄 Reconnecting...");
          startBot();
        }
      }
    });

  } catch (err) {
    console.log("BOT ERROR:", err);
  }
}

startBot();

/* HOME */
app.get("/", (req, res) => {
  res.send("🚀 JAMPAN XMD ROG SERVER ONLINE");
});

/* STATUS */
app.get("/status", (req, res) => {
  res.json({
    bot: botReady ? "online" : "starting",
    owner: "Kelvin Jampan",
    botName: "JAMPAN XMD"
  });
});

/* PAIR */
app.get("/pair", async (req, res) => {
  const number = req.query.number;

  if (!number) {
    return res.json({ error: "Number required" });
  }

  if (!sock || !sock.user) {
    return res.json({
      error: "Bot not ready yet"
    });
  }

  try {
    const code = await sock.requestPairingCode(number);

    res.json({
      number,
      code,
      status: "Pair code generated"
    });

  } catch (err) {
    console.log(err);

    res.json({
      error: "Failed to generate code"
    });
  }
});

/* SERVER */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 SERVER RUNNING ON PORT " + PORT);
});