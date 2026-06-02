import express from "express"

import {getMe} from "../../middleware/auth.middleware.js"
import {authorize} from "../../middleware/authorize.middleware.js"
import { approveEventsController, getAllEventsController, getApprovedEventsController, getPendingEventsController, getRejectedEventsController, rejectEventsController } from "./admin.controller.js";


const adminRoutes = express.Router();

adminRoutes.get("/events" , getMe , authorize("ADMIN") , getAllEventsController);
adminRoutes.get("/events/approved"  , getMe , authorize("ADMIN") , getApprovedEventsController);
adminRoutes.get("/events/pending"  , getMe , authorize("ADMIN") , getPendingEventsController);
adminRoutes.get("/events/rejected" , getMe , authorize("ADMIN") , getRejectedEventsController  );

adminRoutes.patch("/events/:id/approve" , getMe , authorize("ADMIN") , approveEventsController)
adminRoutes.patch("/events/:id/reject" , getMe , authorize("ADMIN") , rejectEventsController)

export default adminRoutes;