import express from "express";
import { getOptionalMe } from "../../middleware/optional-auth.middleware.js";
import { chatAssistantController } from "./assistant.controller.js";

const assistantRoutes = express.Router();

assistantRoutes.post("/chat", getOptionalMe, chatAssistantController);

export default assistantRoutes;
