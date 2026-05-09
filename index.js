import express from "express";
import cors from "cors";
import { startPair, getSession } from "./lib/pair.js";

const app = express();

app.use(cors());
app.use(express.json());

global.owner = "Kelvin Jampan";
global.number = "255674229015";

// ================= HOME
app.get("/", (req, res) => {
  res.json({ status: "JAMPAN-XMD PRO RUNNING 🚀" });
});

// ================= PRO PAIR ENDPOINT
app.post("/pair", async (req, res) => {

  const { userId, phone } = req.body;

  if (!userId || !phone) {
    return res.json({
      success: false,
      message: "Missing userId or phone"
    });
  }

  const result = await startPair(userId, phone);

  if (!result.success) {
    return res.json({
      success: false,
      message: result.message || result.error
    });
  }

  if (!result.code) {
    return res.json({
      success: false,
      message: "Retrying... please wait 5 seconds"
    });
  }

  return res.json({
    success: true,
    pairingCode: result.code
  });

});

// ================= STATUS
app.get("/status/:id", (req, res) => {

  const s = getSession(req.params.id);

  res.json({
    connected: !!s
  });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("JAMPAN-XMD PRO RUNNING ON", PORT);
});