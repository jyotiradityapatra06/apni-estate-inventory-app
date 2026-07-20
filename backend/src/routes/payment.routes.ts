import { Router } from "express";
import * as controller from "../controllers/payment.controller";
import { protect, requirePermission } from "../middleware/auth.middleware";
const router = Router();
router.get("/", protect, requirePermission("financials:view"), controller.getAll);
router.get("/:id", protect, requirePermission("financials:view"), controller.getById);
router.post("/", protect, requirePermission("financials:manage"), controller.create);
router.post("/:id/reverse", protect, requirePermission("financials:manage"), controller.reverse);
export default router;
