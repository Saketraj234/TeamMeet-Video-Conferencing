import { Router } from "express";
import { addToHistory, getUserHistory, login, register, updateProfile, getUserData } from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);

router.route("/add_to_activity").post(protect, addToHistory);
router.route("/get_all_activity").get(protect, getUserHistory);
router.route("/update_profile").post(protect, updateProfile);
router.route("/get_user_data").get(protect, getUserData);

export default router;
