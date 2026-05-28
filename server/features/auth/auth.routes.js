import { Router } from "express";
import { loginController, profileController, registerController } from "./auth.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "./auth.validation.js";
import { getMe } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/register" , validate(registerSchema) ,registerController);
router.post("/login" ,validate(loginSchema) , loginController);
router.get("/profile" , getMe , profileController)
export default router;