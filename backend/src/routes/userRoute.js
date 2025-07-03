import { Router } from "express";
import {
  addToHistory,
  getUserHistory,
  login,
  register,
  googleAuth,
  verifyToken
} from "../controllers/userController.js";

const router = Router();

// User login
router.post("/login", login);

// User registration
router.post("/register", register);

// Google authentication
router.post("/google-auth", googleAuth);

// Add meeting to user's activity history
router.post("/add_to_activity", addToHistory);

// Get all activity for user
router.get("/get_all_activity", getUserHistory);

router.get("/verify-token", verifyToken);

export default router;
