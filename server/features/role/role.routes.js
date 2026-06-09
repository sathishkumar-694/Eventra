import express from "express";
import {
  checkRoleRequestController,
  createRoleRequestController,
} from "./role.controller.js";
import { getMe } from "../../middleware/auth.middleware.js";

const roleRouter = express.Router();
roleRouter.post("/request", getMe, createRoleRequestController);
roleRouter.get("/request/status", getMe, checkRoleRequestController);

export default roleRouter;