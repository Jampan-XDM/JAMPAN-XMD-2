import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";

import P from "pino";
import fs from "fs";

const sessions = new Map();

export async function createSession(userId, phone) {

  // 🔥 sanitize number
  phone = phone.replace(/[^0-9]/g, "");

  const sessionPath = `sessions/${userId}`;

  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  const { state, saveCreds } =
    await useMultiFileAuthState(sessionPath);

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

  // 🔥 WAIT SOCKET STABILIZE
  await new Promise(resolve => setTimeout(resolve, 5000));

  let pairingCode = null;

  try {

    // 🔥 FIX REAL ISSUE
    if (!sock.authState.creds.registered) {

      pairingCode =
        await sock.requestPairingCode(phone);

    }

  } catch (err) {

    console.log("PAIRING ERROR:", err);

    return {
      success: false,
      error: err.message
    };
  }

  return {
    success: true,
    code: pairingCode
  };
}

export function getSession(userId) {
  return sessions.get(userId);
}