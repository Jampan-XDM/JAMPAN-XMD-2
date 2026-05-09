import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";

import P from "pino";
import fs from "fs";

const sessions = new Map();

export async function startPair(userId, phone) {

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

  // 🔥 IMPORTANT: allow socket settle
  await new Promise(r => setTimeout(r, 5000));

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
    code
  };
}

export function getSession(userId) {
  return sessions.get(userId);
}