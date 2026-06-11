import express from "express";

import { getMe } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import {
  approveEventsController,
  approveRoleRequestController,
  getAllEventsController,
  getAllRoleRequestsController,
  getApprovedEventsController,
  getPendingEventsController,
  getRejectedEventsController,
  rejectEventsController,
  rejectRoleRequestController,
  revokeRoleRequestController,
} from "./admin.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { rejectEventSchema } from "./admin.validate.js";

const adminRoutes = express.Router();

adminRoutes.get("/events", getMe, authorize("ADMIN"), getAllEventsController);
adminRoutes.get(
  "/events/approved",
  getMe,
  authorize("ADMIN"),
  getApprovedEventsController,
);
adminRoutes.get(
  "/events/pending",
  getMe,
  authorize("ADMIN"),
  getPendingEventsController,
);
adminRoutes.get(
  "/events/rejected",
  getMe,
  authorize("ADMIN"),
  getRejectedEventsController,
);

adminRoutes.patch(
  "/events/:id/approve",
  getMe,
  authorize("ADMIN"),
  approveEventsController,
);
adminRoutes.patch(
  "/events/:id/reject",
  getMe,
  authorize("ADMIN"),
  validate(rejectEventSchema),
  rejectEventsController,
);

adminRoutes.get(
  "/role-requests",
  getMe,
  authorize("ADMIN"),
  getAllRoleRequestsController,
);
adminRoutes.patch(
  "/role-requests/:id/approve",
  getMe,
  authorize("ADMIN"),
  approveRoleRequestController,
);
adminRoutes.patch(
  "/role-requests/:id/reject",
  getMe,
  authorize("ADMIN"),
  validate(rejectEventSchema),
  rejectRoleRequestController,
);
adminRoutes.patch(
  "/role-requests/:id/revoke",
  getMe,
  authorize("ADMIN"),
  revokeRoleRequestController,
);

export default adminRoutes;
