import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys";

import P from "pino";
import fs from "fs";

const sessions = new Map();

export async function startSession(userId, phone) {
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

  let isReady = false;

  sock.ev.on("connection.update", async (update) => {
    const { connection } = update;

    if (connection === "open") {
      isReady = true;
      console.log(`🟢 ${userId} connected`);
    }

    if (connection === "close") {
      const reason = update.lastDisconnect?.error?.output?.statusCode;

      if (reason !== DisconnectReason.loggedOut) {
        console.log("♻️ reconnecting...");
        startSession(userId, phone);
      }
    }
  });

  // 🔥 FIX: wait socket stability before pairing
  await new Promise(r => setTimeout(r, 2500));

  let code = null;

  try {
    if (!sock.authState.creds.registered) {
      code = await sock.requestPairingCode(phone);
    }
  } catch (e) {
    console.log("PAIR ERROR:", e);
  }

  return { sock, code, isReady };
}

export function getSession(userId) {
  return sessions.get(userId);
}