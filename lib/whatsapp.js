import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys";

import P from "pino";
import fs from "fs";

const sessions = new Map();

export async function createSession(userId, phoneNumber) {
  const path = `sessions/${userId}`;

  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(path);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["JAMPAN-XMD", "Chrome", "1.0.0"]
  });

  sessions.set(userId, sock);

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log(`✅ ${userId} connected`);
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;

      if (reason !== DisconnectReason.loggedOut) {
        console.log("♻️ reconnecting...");
        createSession(userId, phoneNumber);
      } else {
        console.log("❌ logged out");
      }
    }
  });

  // 🔥 FIX: stable pairing request
  let code;
  if (!sock.authState.creds.registered) {
    code = await sock.requestPairingCode(phoneNumber);
  }

  return { sock, code };
}

export function getSession(userId) {
  return sessions.get(userId);
}