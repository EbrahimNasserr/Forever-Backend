import { Router } from "express";
import { adminLogin, loginUser, registerUser } from "./auth.service.js";

const router = Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/admin-login", adminLogin);

export default router;