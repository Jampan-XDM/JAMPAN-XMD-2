import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys";

import P from "pino";
import fs from "fs";

const sessions = new Map();

export async function startPair(userId, phone) {

  phone = phone.replace(/[^0-9]/g, "");

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

  // 🔥 WAIT FOR PROPER CONNECTION STATE
  await new Promise((resolve) => {

    let done = false;

    sock.ev.on("connection.update", (update) => {

      const { connection } = update;

      if (connection === "open" && !done) {
        done = true;
        resolve();
      }

    });

    // fallback (Heroku safety)
    setTimeout(() => {
      if (!done) resolve();
    }, 8000);

  });

  let code = null;

  try {

    if (!sock.authState.creds.registered) {
      code = await sock.requestPairingCode(phone);
    }

  } catch (e) {
    console.log("PAIR ERROR:", e);
  }

  return {
    success: true,
    code: code || null
  };
}

export function getSession(userId) {
  return sessions.get(userId);
}