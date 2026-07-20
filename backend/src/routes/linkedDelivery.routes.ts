import { Router } from "express";
import * as controller from "../controllers/linkedDelivery.controller";
import { protect, requirePermission, restrictTo } from "../middleware/auth.middleware";

const router = Router();
router.use(protect, restrictTo("OWNER", "MANAGER"));
router.get("/", requirePermission("deliveries:view"), controller.getAll);
router.get("/:id", requirePermission("deliveries:view"), controller.getById);
router.post("/", requirePermission("deliveries:create"), controller.create);
router.post("/:id/ready", requirePermission("deliveries:create"), controller.markReady);
router.post("/:id/dispatch", requirePermission("deliveries:dispatch"), controller.dispatch);
router.post("/:id/complete", requirePermission("deliveries:complete"), controller.complete);
router.post("/:id/cancel", requirePermission("deliveries:cancel"), controller.cancel);
router.post("/:id/reverse-dispatch", requirePermission("deliveries:reverse"), controller.reverseDispatch);

export default router;
