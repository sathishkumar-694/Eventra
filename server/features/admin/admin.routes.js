import express from "express"

import {getMe} from "../../middleware/auth.middleware.js"
import {authorize} from "../../middleware/authorize.middleware.js"
import { getAllPendingEventsController, getRejectedEventsController } from "./admin.controller.js";


const adminRoutes = express.Router();
// adminRoutes.get("/events" , getMe , authorize("ADMIN") , getAll);
adminRoutes.get("/events/pending"  , getMe , authorize("ADMIN") , getAllPendingEventsController);
adminRoutes.get("/events/rejected" , getRejectedEventsController);

// adminRoutes.patch("/events/:id/approve")
// adminRoutes.patch("/events/:id/reject")

export default adminRoutes;