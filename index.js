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

const state = {
  connected: false,
  connecting: false,
  lastPairRequest: 0
};

/* =========================
   CREATE SOCKET
========================= */
async function createSocket() {

  if (state.connecting) return;

  state.connecting = true;

  try {

    const {
      state: authState,
      saveCreds
    } = await useMultiFileAuthState("session");

    sock = makeWASocket({
      auth: authState,
      printQRInTerminal: false,
      browser: ["JAMPAN XMD", "Chrome", "1.0.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async(update) => {

      const {
        connection,
        lastDisconnect
      } = update;

      /* CONNECTED */
      if (connection === "open") {

        state.connected = true;
        state.connecting = false;

        console.log("✅ JAMPAN XMD CONNECTED");

      }

      /* CLOSED */
      if (connection === "close") {

        state.connected = false;
        state.connecting = false;

        const reason =
          lastDisconnect?.error?.output?.statusCode;

        console.log("❌ CONNECTION CLOSED:", reason);

        /* SAFE RECONNECT */
        if (
          reason !== DisconnectReason.loggedOut
        ) {

          console.log("🔄 Reconnecting safely...");

          setTimeout(() => {
            createSocket();
          }, 10000);

        }

      }

    });

  } catch(err) {

    state.connecting = false;

    console.log("BOT ERROR:", err);

    /* SAFE RETRY */
    setTimeout(() => {
      createSocket();
    }, 15000);

  }

}

/* START */
createSocket();

/* =========================
   HOME
========================= */
app.get("/", (req, res) => {

  res.send(`
    <h1>🚀 JAMPAN XMD PRO SERVER</h1>
    <p>Status: ${state.connected ? "ONLINE" : "STARTING"}</p>
  `);

});

/* =========================
   STATUS
========================= */
app.get("/status", (req, res) => {

  res.json({
    bot: state.connected ? "online" : "starting",
    owner: "Kelvin Jampan",
    version: "PRO"
  });

});

/* =========================
   PAIR SYSTEM
========================= */
app.get("/pair", async(req, res) => {

  const number = req.query.number;

  if (!number) {

    return res.json({
      error: "Number required"
    });

  }

  /* FORMAT CHECK */
  if (
    number.startsWith("+") ||
    number.startsWith("0")
  ) {

    return res.json({
      error: "Use international format 255xxxxxxxxx"
    });

  }

  /* CONNECTION CHECK */
  if (!state.connected || !sock) {

    return res.json({
      error: "Bot still starting"
    });

  }

  /* ANTI SPAM */
  if (
    Date.now() - state.lastPairRequest < 20000
  ) {

    return res.json({
      error: "Wait 20 seconds before requesting another code"
    });

  }

  state.lastPairRequest = Date.now();

  try {

    const code =
      await sock.requestPairingCode(number);

    res.json({
      status: "success",
      number,
      code
    });

  } catch(err) {

    console.log("PAIR ERROR:", err);

    res.json({
      error: "Pair generation failed"
    });

  }

});

/* =========================
   404
========================= */
app.use((req, res) => {

  res.status(404).json({
    error: "Route not found"
  });

});

/* =========================
   SERVER
========================= */
const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    "🚀 SERVER RUNNING ON PORT " + PORT
  );

});