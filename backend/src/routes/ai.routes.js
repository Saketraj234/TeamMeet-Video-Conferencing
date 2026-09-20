import express from "express";
import { aiChat } from "../controllers/ai.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/chat", protect, aiChat);

export default router;
