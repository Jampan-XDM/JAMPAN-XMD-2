import express from "express";
import cors from "cors";

import {
  createSession,
  getSession
} from "./lib/pair.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "JAMPAN-XMD ONLINE 🚀"
  });
});


// 🔥 PAIR ROUTE
app.post("/pair", async (req, res) => {

  try {

    const {
      userId,
      phone
    } = req.body;

    if (!userId || !phone) {

      return res.status(400).json({
        success: false,
        error: "Missing phone"
      });

    }

    const result =
      await createSession(userId, phone);

    // 🔥 IMPORTANT FIX
    if (!result.success || !result.code) {

      return res.status(500).json({
        success: false,
        error: "Cannot get pair code"
      });

    }

    return res.json({
      success: true,
      pairingCode: result.code
    });

  } catch (err) {

    console.log("SERVER ERROR:", err);

    return res.status(500).json({
      success: false,
      error: "Server error"
    });

  }

});


// 🔥 STATUS ROUTE
app.get("/status/:userId", (req, res) => {

  const session =
    getSession(req.params.userId);

  return res.json({
    connected: !!session
  });

});

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `🚀 JAMPAN-XMD running on ${PORT}`
  );

});