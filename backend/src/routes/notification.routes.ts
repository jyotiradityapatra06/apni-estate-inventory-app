import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get(
    "/",
    notificationController.getAllNotifications
);

router.post(
    "/",
    notificationController.createNotification
);

router.delete(
    "/",
    notificationController.clearAllNotifications
);

export default router;