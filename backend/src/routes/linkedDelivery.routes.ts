import { Router } from "express";
import * as controller from "../controllers/linkedDelivery.controller";
import { protect, requirePermission, restrictTo } from "../middleware/auth.middleware";

const router = Router();
// Protect all routes with JWT authentication
router.use(protect);

// Allowed for OWNER, MANAGER, DRIVER with deliveries:view permission (STAFF denied)
router.get("/", restrictTo("OWNER", "MANAGER", "DRIVER"), requirePermission("deliveries:view"), controller.getAll);
router.get("/:id", restrictTo("OWNER", "MANAGER", "DRIVER"), requirePermission("deliveries:view"), controller.getById);

// Restricted to OWNER & MANAGER only
router.post("/", restrictTo("OWNER", "MANAGER"), requirePermission("deliveries:create"), controller.create);
router.post("/:id/ready", restrictTo("OWNER", "MANAGER"), requirePermission("deliveries:create"), controller.markReady);
router.post("/:id/dispatch", restrictTo("OWNER", "MANAGER"), requirePermission("deliveries:dispatch"), controller.dispatch);

// Allowed for OWNER, MANAGER, DRIVER to record site confirmation
router.post("/:id/complete", restrictTo("OWNER", "MANAGER", "DRIVER"), requirePermission("deliveries:complete"), controller.complete);

// Restricted to OWNER & MANAGER only
router.post("/:id/cancel", restrictTo("OWNER", "MANAGER"), requirePermission("deliveries:cancel"), controller.cancel);
router.post("/:id/reverse-dispatch", restrictTo("OWNER", "MANAGER"), requirePermission("deliveries:reverse"), controller.reverseDispatch);

export default router;
