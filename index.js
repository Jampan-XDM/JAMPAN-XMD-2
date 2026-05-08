const express = require("express");
const cors = require("cors");
const fs = require("fs");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

/* =========================
   🔥 SESSION SAFETY FIX
========================= */
const sessionPath = "./session";

// kama session ni file → delete
if (
  fs.existsSync(sessionPath) &&
  !fs.lstatSync(sessionPath).isDirectory()
) {
  fs.unlinkSync(sessionPath);
}

// hakikisha ni folder
if (!fs.existsSync(sessionPath)) {
  fs.mkdirSync(sessionPath, { recursive: true });
}

/* =========================
   EXPRESS SETUP
========================= */
const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   BOT STATE
========================= */
let sock;
let botReady = false;
let connecting = false;
let lastPair = 0;

/* =========================
   START BOT
========================= */
async function startBot() {

  if (connecting) return;
  connecting = true;

  try {

    const { state, saveCreds } =
      await useMultiFileAuthState("./session");

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {

      const { connection, lastDisconnect } = update;

      if (connection === "open") {
        botReady = true;
        connecting = false;
        console.log("✅ BOT ONLINE");
      }

      if (connection === "close") {
        botReady = false;
        connecting = false;

        const code =
          lastDisconnect?.error?.output?.statusCode;

        console.log("❌ CLOSED:", code);

        if (code !== DisconnectReason.loggedOut) {
          setTimeout(startBot, 8000);
        }
      }

    });

  } catch (err) {
    console.log("BOT ERROR:", err);
    connecting = false;

    setTimeout(startBot, 10000);
  }

}

/* START BOT */
startBot();

/* =========================
   HOME
========================= */
app.get("/", (req, res) => {
  res.send("🚀 JAMPAN XMD PRO RUNNING");
});

/* =========================
   STATUS
========================= */
app.get("/status", (req, res) => {
  res.json({
    bot: botReady ? "online" : "starting"
  });
});

/* =========================
   PAIR ROUTE
========================= */
app.get("/pair", async (req, res) => {

  const number = req.query.number;

  if (!number) {
    return res.json({ error: "Number required" });
  }

  if (!botReady || !sock) {
    return res.json({ error: "Bot still starting" });
  }

  if (Date.now() - lastPair < 20000) {
    return res.json({ error: "Wait 20 seconds" });
  }

  lastPair = Date.now();

  try {

    const code =
      await sock.requestPairingCode(number);

    res.json({
      number,
      code,
      status: "success"
    });

  } catch (err) {
    console.log("PAIR ERROR:", err);
    res.json({ error: "Pair failed" });
  }

});

/* =========================
   404
========================= */
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

/* =========================
   SERVER START
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 SERVER RUNNING ON PORT " + PORT);
});