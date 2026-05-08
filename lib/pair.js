import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys";

import P from "pino";
import fs from "fs";

const sessions = new Map();

export async function createSession(userId, phone) {
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

  let connected = false;

  sock.ev.on("connection.update", (update) => {
    const { connection } = update;

    if (connection === "open") {
      connected = true;
      console.log("🟢 Connected:", userId);
    }

    if (connection === "close") {
      const reason = update.lastDisconnect?.error?.output?.statusCode;

      if (reason !== DisconnectReason.loggedOut) {
        createSession(userId, phone);
      }
    }
  });

  // 🔥 FIX: wait stable connection BEFORE pairing
  await new Promise(r => setTimeout(r, 3500));

  let code = null;

  try {
    if (!sock.authState.creds.registered) {
      code = await sock.requestPairingCode(phone);
    }
  } catch (e) {
    console.log("PAIR ERROR:", e);
    return { error: true };
  }

  return { sock, code, connected };
}

export function getSession(userId) {
  return sessions.get(userId);
}