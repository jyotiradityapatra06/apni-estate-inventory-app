import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// Protect all notification routes
router.use(protect);

router.get("/", notificationController.getAllNotifications);
router.post("/", notificationController.createNotification);

export default router;
