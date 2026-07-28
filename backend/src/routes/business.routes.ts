import { Router } from "express";
import * as businessController from "../controllers/business.controller";
import { protect, requirePermission } from "../middleware/auth.middleware";

const router = Router();

router.get("/profile", protect, requirePermission("business:view"), businessController.getBusiness);
router.put("/profile", protect, requirePermission("business:manage"), businessController.updateBusinessProfile);
router.get("/", protect, requirePermission("business:view"), businessController.getBusiness);
router.patch("/", protect, requirePermission("business:manage"), businessController.updateBusiness);

export default router;
