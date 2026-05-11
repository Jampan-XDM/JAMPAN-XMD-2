const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys")

const P = require("pino")
const fs = require("fs")

let sock = null
let isConnecting = false
let pairingRequested = false

async function startJampan() {

  if (sock) return sock

  if (isConnecting) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (sock) {
          clearInterval(check)
          resolve(sock)
        }
      }, 1000)
    })
  }

  isConnecting = true

  const { state, saveCreds } =
    await useMultiFileAuthState("./session")

  const { version } =
    await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    logger: P({ level: "silent" }),

    auth: state,

    browser: ["JAMPAN-XMD", "Chrome", "1.0.0"],

    printQRInTerminal: false,

    connectTimeoutMs: 60000,

    keepAliveIntervalMs: 30000,

    retryRequestDelayMs: 250,

    markOnlineOnConnect: true,

    syncFullHistory: false
  })

  sock.ev.on("creds.update", async () => {
    await saveCreds()
    console.log("✅ Session Saved")
  })

  sock.ev.on("connection.update", async (update) => {

    const {
      connection,
      lastDisconnect
    } = update

    if (connection === "connecting") {
      console.log("🔄 Connecting...")
    }

    if (connection === "open") {
      console.log("✅ JAMPAN XMD CONNECTED")
      pairingRequested = true
      isConnecting = false
    }

    if (connection === "close") {

      const reason =
        lastDisconnect?.error?.output?.statusCode

      console.log("❌ Connection Closed:", reason)

      sock = null
      isConnecting = false

      if (reason !== DisconnectReason.loggedOut) {

        console.log("♻️ Reconnecting in 5 seconds...")

        setTimeout(() => {
          startJampan()
        }, 5000)

      } else {

        console.log("🚫 Session Logged Out")

        if (fs.existsSync("./session")) {
          fs.rmSync("./session", {
            recursive: true,
            force: true
          })
        }
      }
    }
  })

  return sock
}

async function getPairCode(number) {

  try {

    const bot = await startJampan()

    if (!number) {
      return {
        status: false,
        message: "Number is required"
      }
    }

    number = number.replace(/[^0-9]/g, "")

    if (pairingRequested) {
      return {
        status: true,
        message: "Bot already paired"
      }
    }

    await new Promise(resolve =>
      setTimeout(resolve, 3000)
    )

    const code =
      await bot.requestPairingCode(number)

    pairingRequested = true

    return {
      status: true,
      code
    }

  } catch (err) {

    console.log(err)

    return {
      status: false,
      message: "Failed to generate pair code"
    }
  }
}

module.exports = {
  startJampan,
  getPairCode
}