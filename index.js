import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { createSession, getSession } from "./lib/whatsapp.js";

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 HEALTH CHECK
app.get("/", (req, res) => {
  res.json({ status: "JAMPAN-XMD Backend Running 🚀" });
});


// 🔥 CREATE PAIR CODE
app.post("/pair", async (req, res) => {
  try {
    const { userId, phone } = req.body;

    if (!userId || !phone) {
      return res.json({ error: "Missing userId or phone" });
    }

    const { code } = await createSession(userId, phone);

    res.json({
      success: true,
      pairingCode: code
    });

  } catch (err) {
    console.log(err);
    res.json({ error: "Failed to create pair code" });
  }
});


// 🔥 CHECK STATUS
app.get("/status/:userId", (req, res) => {
  const session = getSession(req.params.userId);

  res.json({
    connected: !!session
  });
});

app.listen(config.port, () => {
  console.log(`🚀 JAMPAN-XMD running on port ${config.port}`);
});