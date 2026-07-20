import { Router } from "express";
import * as controller from "../controllers/purchaseReturn.controller";
import { protect, requirePermission } from "../middleware/auth.middleware";

const router = Router();

router.get("/", protect, requirePermission("purchase-returns:view"), controller.getAll);
router.get("/:id", protect, requirePermission("purchase-returns:view"), controller.getById);
router.post("/", protect, requirePermission("purchase-returns:create"), controller.create);
router.post("/:id/post", protect, requirePermission("purchase-returns:update"), controller.post);
router.post("/:id/cancel", protect, requirePermission("purchase-returns:update"), controller.cancel);

export default router;
