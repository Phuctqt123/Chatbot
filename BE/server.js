import express from "express";
import { processText } from "./API/AI.js";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors()); // Cho phép tất cả origin (dùng trong dev)

app.post("/api/ai", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });
    const reply = await processText(text);
    res.json({ reply });
  } catch (error) {
    console.error("Error processing text:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(3000, () => console.log("Server chạy ở http://localhost:3000"));