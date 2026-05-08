import express from "express";
import cors from "cors";
import { createPairSession, getSession } from "./lib/pair.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "JAMPAN-XMD ONLINE 🚀" });
});

// 🔥 PAIR ROUTE (CLEAN NOW)
app.post("/pair", async (req, res) => {
  try {
    const { userId, phone } = req.body;

    if (!userId || !phone) {
      return res.status(400).json({ error: "Missing data" });
    }

    const result = await createPairSession(userId, phone);

    if (!result || result.error || !result.code) {
      return res.status(500).json({
        error: "Cannot generate pair code"
      });
    }

    return res.json({
      success: true,
      pairingCode: result.code
    });

  } catch (err) {
    console.log("SERVER ERROR:", err);

    return res.status(500).json({
      error: "Server error"
    });
  }
});

// 🔥 STATUS CHECK
app.get("/status/:userId", (req, res) => {
  const session = getSession(req.params.userId);

  res.json({
    connected: !!session
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 JAMPAN-XMD running on", PORT);
});