import { Router } from "express";
import {
  loginController,
  logoutController,
  profileController,
  refreshController,
  registerController,
  updateProfileController,
} from "./auth.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { loginSchema, registerSchema, updateProfileSchema } from "./auth.validation.js";
import { getMe } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/register", validate(registerSchema), registerController);
router.post("/login", validate(loginSchema), loginController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);
router.get("/profile", getMe, profileController);
router.patch("/profile", getMe, validate(updateProfileSchema), updateProfileController);

export default router;
