import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import { hashPassword, comparePassword } from "./utils/hash.js";
import { generateToken } from "./utils/jwt.js";
import { ROLES, ROLE_VALUES } from "./roles.js";
import { authorizeRoles } from "./middleware/role.js";
import { authMiddleware } from "./middleware/auth.js";
import cookieParser from "cookie-parser";
import documentRoutes from "./routes/documents.js";
import retrievalRoutes from "./routes/retrieval.js";

dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/documents", documentRoutes);
app.use("/retrieve", retrievalRoutes);

app.get("/", (req, res) => {
  res.json({ message: "gateway running" });
});

app.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { query, topK, sessionId } = req.body;
    const userId = req.user.userId;

    if (!query || typeof query !== "string" || query.trim() === "") {
      return res.status(400).json({ error: "Query is required" });
    }

    const response = await axios.post(`${AI_SERVICE_URL}/chat`, {
      query,
      userId,
      topK: topK || 5,
      sessionId: sessionId || `user-${userId}`,
    });

    return res.json(response.data);
  } catch (error) {
    console.error("[Gateway] Chat error:", error.message);
    return res.status(500).json({ error: "Chat failed" });
  }
});
app.post("/chat/stream", authMiddleware, async (req, res) => {
  try {
    const { query, topK, sessionId } = req.body;
    const userId = req.user.userId;

    if (!query || typeof query !== "string" || query.trim() === "") {
      return res.status(400).json({ error: "Query is required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/chat/stream`,
      {
        query,
        userId,
        topK: topK || 5,
        sessionId: sessionId || `user-${userId}`,
      },
      { responseType: "stream" },
    );

    aiResponse.data.pipe(res);

    req.on("close", () => {
      aiResponse.data.destroy();
    });
  } catch (error) {
    console.error("[Gateway] Stream chat error:", error.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Stream chat failed" });
    }
  }
});
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!ROLE_VALUES.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const hashedPassword = await hashPassword(password);

    await axios.post(`${AI_SERVICE_URL}/users`, {
      email,
      name,
      role,
      password: hashedPassword,
    });

    res.json({ message: "User registered successfully" });
  } catch (error) {
    if (error.response?.status === 400) {
      return res.status(400).json({ error: "User already exists" });
    }
    console.log(error);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const response = await axios.get(
      `${AI_SERVICE_URL}/users/by-email?email=${encodeURIComponent(email)}`,
    );
    const user = response.data;

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = generateToken({
      userId: user.userId,
      role: user.role,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.json({ message: "Login successful" });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    console.log(error);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/auth/me", authMiddleware, (req, res) => {
  res.json({
    userId: req.user.userId,
    role: req.user.role,
  });
});

app.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You are authenticated",
    user: req.user,
  });
});
app.get(
  "/doctor-only",
  authMiddleware,
  authorizeRoles("doctor"),
  (req, res) => {
    res.json({
      message: "Welcome Doctor",
      user: req.user,
    });
  },
);
app.get("/chat/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const sessionId = req.query.sessionId || `user-${userId}`;
    const response = await axios.get(
      `${AI_SERVICE_URL}/chat/history?sessionId=${encodeURIComponent(sessionId)}`,
    );
    return res.json(response.data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.post("/chat/clear", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const sessionId = req.body.sessionId || `user-${userId}`;
    const response = await axios.post(
      `${AI_SERVICE_URL}/chat/clear?sessionId=${encodeURIComponent(sessionId)}`,
    );
    return res.json(response.data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to clear history" });
  }
});

const PORT = process.env.GATEWAY_PORT || 3000;

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});
