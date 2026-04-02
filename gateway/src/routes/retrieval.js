import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import axios from "axios";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { query, topK } = req.body;
    const userId = req.user.userId;

    if (!query || typeof query !== "string" || query.trim() === "") {
      return res.status(400).json({ error: "Query is required" });
    }

    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/retrieve`,
      {
        query,
        userId,
        topK: topK || 5,
      },
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("[Gateway] Retrieval error:", error.message);
    return res.status(500).json({ error: "Retrieval failed" });
  }
});

export default router;
