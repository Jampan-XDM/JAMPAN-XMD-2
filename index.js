import express from "express";
import cors from "cors";
import { createSession, getSession } from "./lib/pair.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "JAMPAN-XMD ONLINE 🚀" });
});

// 🔥 PAIR ENDPOINT
app.post("/pair", async (req, res) => {
  try {
    const { userId, phone } = req.body;

    const result = await createSession(userId, phone);

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
    res.status(500).json({ error: "Server error" });
  }
});

// 🔥 STATUS ENDPOINT
app.get("/status/:userId", (req, res) => {
  const session = getSession(req.params.userId);

  res.json({
    connected: !!session
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Running on", PORT);
});