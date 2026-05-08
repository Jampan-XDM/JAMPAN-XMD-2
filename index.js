import express from "express";
import cors from "cors";
import { startSession, getSession } from "./lib/wa.js";

const app = express();

app.use(cors());
app.use(express.json());

// 🟢 HEALTH
app.get("/", (req, res) => {
  res.json({ status: "JAMPAN-XMD RUNNING 🚀" });
});


// 🔥 PAIR CODE ROUTE (FIXED)
app.post("/pair", async (req, res) => {
  try {
    const { userId, phone } = req.body;

    if (!userId || !phone) {
      return res.status(400).json({ error: "Missing data" });
    }

    const { code } = await startSession(userId, phone);

    if (!code) {
      return res.status(500).json({
        error: "Cannot get pair (try again in few seconds)"
      });
    }

    return res.json({
      success: true,
      pairingCode: code
    });

  } catch (err) {
    console.log("PAIR ERROR:", err);
    return res.status(500).json({
      error: "Cannot get pair"
    });
  }
});


// 🔥 STATUS ROUTE (FRONTEND LIVE CHECK)
app.get("/status/:userId", (req, res) => {
  const session = getSession(req.params.userId);

  return res.json({
    connected: !!session
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 JAMPAN-XMD Backend running on port", PORT);
});