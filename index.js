import express from "express";
import cors from "cors";
import { startPair, getSession } from "./lib/pair.js";

const app = express();

app.use(cors());
app.use(express.json());

global.owner = "Kelvin Jampan";
global.number = "255674229015";
global.channel = "https://whatsapp.com/channel/0029Vb7fTNf3QxS8A6rbBB3S";
global.thumb = "https://files.catbox.moe/fzjhed.png";

// ================= HOME
app.get("/", (req, res) => {
  res.json({ status: "JAMPAN-XMD ONLINE 🚀" });
});

// ================= FIXED PAIR (POST ONLY)
app.post("/pair", async (req, res) => {

  try {

    const { userId, phone } = req.body;

    if (!userId || !phone) {
      return res.json({
        success: false,
        message: "Missing userId or phone"
      });
    }

    const result = await startPair(userId, phone);

    if (!result.code) {
      return res.json({
        success: false,
        message: "Pair not ready, retry in 5s"
      });
    }

    return res.json({
      success: true,
      pairingCode: result.code
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Server error"
    });
  }

});

// ================= STATUS
app.get("/status/:id", (req, res) => {

  const session = getSession(req.params.id);

  res.json({
    connected: !!session
  });

});

// ================= OWNER TEST
app.get("/owner", (req, res) => {
  res.json({
    owner: global.owner,
    number: global.number
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("JAMPAN-XMD RUNNING ON", PORT);
});