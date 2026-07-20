import { Router } from "express";
import * as controller from "../controllers/salesReturn.controller";
import { protect, requirePermission } from "../middleware/auth.middleware";

const router = Router();

router.get("/", protect, requirePermission("sales-returns:view"), controller.getAll);
router.get("/:id", protect, requirePermission("sales-returns:view"), controller.getById);
router.post("/", protect, requirePermission("sales-returns:create"), controller.create);
router.post("/:id/post", protect, requirePermission("sales-returns:update"), controller.post);
router.post("/:id/cancel", protect, requirePermission("sales-returns:update"), controller.cancel);

export default router;
