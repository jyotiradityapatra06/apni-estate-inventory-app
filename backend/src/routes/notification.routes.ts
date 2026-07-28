import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { authenticate, requirePermission } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get(
    "/",
    notificationController.getAllNotifications
);

router.post(
    "/",
    requirePermission("notifications:manage"),
    notificationController.createNotification
);

router.delete(
    "/",
    requirePermission("notifications:manage"),
    notificationController.clearAllNotifications
);

export default router;
