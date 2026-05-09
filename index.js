import express from "express";
import cors from "cors";
import { startBot, getSession } from "./lib/pair.js";

const app = express();

app.use(cors());
app.use(express.json());

global.ownerName = "Kelvin Jampan";
global.ownerNumber = "255674229015";
global.channel = "https://whatsapp.com/channel/0029Vb7fTNf3QxS8A6rbBB3S";
global.thumb = "https://files.catbox.moe/fzjhed.png";

// ---------------- HOME
app.get("/", (req, res) => {
  res.json({ status: "JAMPAN-XMD RUNNING 🚀" });
});

// ---------------- PAIR
app.post("/pair", async (req, res) => {
  try {
    const { userId, phone } = req.body;

    const result = await startBot(userId, phone);

    if (!result.code) {
      return res.json({
        success: false,
        message: "Try again in few seconds"
      });
    }

    return res.json({
      success: true,
      pairingCode: result.code
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "server error" });
  }
});

// ---------------- STATUS
app.get("/status/:id", (req, res) => {
  const s = getSession(req.params.id);

  res.json({ connected: !!s });
});

// ---------------- SIMPLE BOT LOGIC (1 SESSION ONLY)
app.post("/message", async (req, res) => {

  const { command } = req.body;

  if (command === "owner") {
    return res.json({
      text: `
👑 OWNER: ${global.ownerName}
📞 ${global.ownerNumber}
      `,
      contextInfo: {
        forwardedNewsletterMessageInfo: {
          newsletterName: "JAMPAN XMD",
          newsletterJid: "120363409292513352@newsletter"
        },
        externalAdReply: {
          title: "JAMPAN XMD",
          body: "Owner Info",
          thumbnailUrl: global.thumb,
          sourceUrl: global.channel,
          renderLargerThumbnail: true
        }
      }
    });
  }

  if (command === "channel") {
    return res.json({
      text: `📢 CHANNEL\n${global.channel}`
    });
  }

  if (command === "menu") {
    return res.json({
      text: `
╔═══〔 JAMPAN XMD 〕═══╗
👑 Owner: ${global.ownerName}
🤖 Bot Online
⚡ Stable Mode
╚════════════════════╝
      `
    });
  }

  res.json({ text: "Unknown command" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("JAMPAN-XMD running on", PORT);
});