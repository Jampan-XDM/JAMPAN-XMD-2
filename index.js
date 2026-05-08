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

/* =========================
   GLOBAL STATE
========================= */
let sock = null;
let botReady = false;
let isConnecting = false;
let lastPairTime = 0;

/* =========================
   START BOT (SAFE)
========================= */
async function startBot() {

  if (isConnecting) return;
  isConnecting = true;

  try {

    const { state, saveCreds } =
      await useMultiFileAuthState("session");

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {

      const { connection, lastDisconnect } = update;

      if (connection === "open") {
        console.log("✅ BOT ONLINE");
        botReady = true;
        isConnecting = false;
      }

      if (connection === "close") {

        botReady = false;
        isConnecting = false;

        const status =
          lastDisconnect?.error?.output?.statusCode;

        if (status === DisconnectReason.loggedOut) {
          console.log("⚠️ Logged out - session removed");
        } else {
          console.log("⚠️ Connection closed safely (no loop)");
        }

      }

    });

  } catch (err) {
    console.log("BOT ERROR:", err);
    isConnecting = false;
  }
}

/* START ONCE */
startBot();

/* =========================
   HOME ROUTE
========================= */
app.get("/", (req, res) => {
  res.send("🚀 JAMPAN XMD BOT RUNNING");
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
   PAIR SYSTEM (FIXED)
========================= */
app.get("/pair", async (req, res) => {

  const number = req.query.number;

  if (!number) {
    return res.json({
      error: "Number required"
    });
  }

  if (!botReady || !sock) {
    return res.json({
      error: "Bot not ready yet, wait few seconds"
    });
  }

  /* 🔥 ANTI-SPAM COOLDOWN */
  if (Date.now() - lastPairTime < 15000) {
    return res.json({
      error: "Wait 15 seconds before requesting again"
    });
  }

  lastPairTime = Date.now();

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

    res.json({
      error: "Pair failed (reset session if repeated)"
    });

  }

});

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

/* =========================
   SERVER START
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 SERVER RUNNING ON PORT " + PORT);
});