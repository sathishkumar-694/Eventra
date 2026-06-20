import express from "express";
import {
  createReviewController,
  getReviewsByEventController,
  deleteReviewController,
} from "./review.controller.js";
import { getMe } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createReviewSchema } from "./review.validate.js";

const reviewRoutes = express.Router();

reviewRoutes.post("/", getMe, validate(createReviewSchema), createReviewController);
reviewRoutes.get("/event/:id", getMe, getReviewsByEventController);
reviewRoutes.delete("/:id", getMe, deleteReviewController);

export default reviewRoutes;
