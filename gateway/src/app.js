import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

app.get("/", (req, res) => {
  res.json({ message: "gateway running" });
});

app.post("/chat", async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/chat`, req.body);
    res.json(response.data);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "AI service error" });
  }
});

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});
