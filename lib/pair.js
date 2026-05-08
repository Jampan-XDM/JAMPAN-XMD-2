import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";

import P from "pino";
import fs from "fs";

const sessions = new Map();

export async function createPairSession(userId, phone) {
  const path = `sessions/${userId}`;

  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(path);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    browser: ["JAMPAN-XMD", "Chrome", "1.0"]
  });

  sessions.set(userId, sock);

  sock.ev.on("creds.update", saveCreds);

  // ⏳ IMPORTANT FIX: wait socket stabilize
  await new Promise(r => setTimeout(r, 3000));

  let code = null;

  try {
    if (!sock.authState.creds.registered) {
      code = await sock.requestPairingCode(phone);
    }
  } catch (err) {
    console.log("PAIR ERROR:", err);
    return { error: true };
  }

  return {
    sock,
    code
  };
}

export function getSession(userId) {
  return sessions.get(userId);
}