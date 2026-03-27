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

const app = express();
const users = [];

dotenv.config();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

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
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!ROLE_VALUES.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = {
      id: users.length + 1,
      email,
      name,
      role,
      password: hashedPassword,
    };

    users.push(newUser);

    res.json({
      message: "User registered successfully",
    });
  } catch (error) {
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

    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.json({
      message: "Login successful",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Login failed" });
  }
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

const PORT = process.env.PORT || 3000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});
