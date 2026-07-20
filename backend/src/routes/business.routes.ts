import { Router } from "express";
import * as businessController from "../controllers/business.controller";
import { protect, requirePermission } from "../middleware/auth.middleware";

const router = Router();

router.get("/", protect, businessController.getBusiness);
router.patch("/", protect, requirePermission("business:manage"), businessController.updateBusiness);

export default router;
