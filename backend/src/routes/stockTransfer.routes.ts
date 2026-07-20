import { Router } from "express";
import * as controller from "../controllers/stockTransfer.controller";
import { protect, requirePermission } from "../middleware/auth.middleware";
const router = Router();
router.get("/", protect, requirePermission("godowns:view"), controller.getAll);
router.post("/", protect, requirePermission("godowns:transfer"), controller.create);
router.post("/:id/post", protect, requirePermission("godowns:transfer"), controller.post);
router.post("/:id/cancel", protect, requirePermission("godowns:transfer"), controller.cancel);
export default router;
