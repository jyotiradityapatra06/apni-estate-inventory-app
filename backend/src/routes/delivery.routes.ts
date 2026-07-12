import { Router } from "express";
import * as deliveryController from "../controllers/delivery.controller";
import { protect, requirePermission } from "../middleware/auth.middleware";

const router = Router();

router.get("/", protect, requirePermission("deliveries:view"), deliveryController.getAll);
router.get("/:id", protect, requirePermission("deliveries:view"), deliveryController.getById);
router.post("/", protect, requirePermission("deliveries:manage"), deliveryController.create);
router.patch("/:id", protect, requirePermission("deliveries:manage"), deliveryController.update);
router.patch("/:id/assign", protect, requirePermission("deliveries:manage"), deliveryController.assign);
router.patch("/:id/status", protect, deliveryController.updateStatus);
router.delete("/:id", protect, requirePermission("deliveries:manage"), deliveryController.remove);

export default router;
