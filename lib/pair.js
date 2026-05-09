import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";

import P from "pino";
import fs from "fs";

const sessions = new Map();
const queue = new Map(); // 🔥 prevents spam requests

export async function startPair(userId, phone) {

  phone = phone.replace(/[^0-9]/g, "");

  // 🔥 prevent spam / duplicate requests
  if (queue.has(userId)) {
    return {
      success: false,
      message: "Pair already in progress, wait..."
    };
  }

  queue.set(userId, true);

  try {

    const path = `sessions/${userId}`;

    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }

    const { state, saveCreds } =
      await useMultiFileAuthState(path);

    const { version } =
      await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger: P({ level: "silent" }),
      printQRInTerminal: false,
      browser: ["JAMPAN-XMD", "Chrome", "1.0"]
    });

    sessions.set(userId, sock);

    sock.ev.on("creds.update", saveCreds);

    // 🔥 WAIT STABLE CONNECTION (CRITICAL FIX)
    await new Promise((resolve) => {

      let done = false;

      sock.ev.on("connection.update", (u) => {

        if (u.connection === "open" && !done) {
          done = true;
          resolve();
        }

      });

      setTimeout(() => {
        if (!done) resolve();
      }, 10000); // Heroku-safe delay

    });

    let code = null;

    // 🔥 retry loop (VERY IMPORTANT FIX)
    for (let i = 0; i < 3; i++) {

      try {

        if (!sock.authState.creds.registered) {

          code = await sock.requestPairingCode(phone);

          if (code) break;

        }

      } catch (e) {
        console.log("PAIR TRY FAILED:", i + 1);
      }

      await new Promise(r => setTimeout(r, 2000));

    }

    queue.delete(userId);

    return {
      success: true,
      code: code || null
    };

  } catch (err) {

    queue.delete(userId);

    return {
      success: false,
      error: err.message
    };

  }
}

export function getSession(userId) {
  return sessions.get(userId);
}