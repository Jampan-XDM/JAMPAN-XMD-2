import express from "express";
import cors from "cors";
import { createSession, getSession } from "./lib/pair.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "JAMPAN-XMD ONLINE 🚀" });
});

// 🔥 PAIR ENDPOINT (FIXED)
app.post("/pair", async (req, res) => {
  try {
    const { userId, phone } = req.body;

    if (!userId || !phone) {
      return res.status(400).json({ error: "Missing data" });
    }

    const result = await createSession(userId, phone);

    if (!result || result.error || !result.code) {
      return res.status(500).json({
        error: "Cannot get pair (try again in 5s)"
      });
    }

    return res.json({
      success: true,
      pairingCode: result.code
    });

  } catch (err) {
    console.log("PAIR ERROR:", err);

    return res.status(500).json({
      error: "Server error"
    });
  }
});

// 🔥 STATUS FIXED (no fake "no session")
app.get("/status/:userId", (req, res) => {
  const session = getSession(req.params.userId);

  return res.json({
    connected: session ? true : false
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 JAMPAN-XMD running on", PORT);
});