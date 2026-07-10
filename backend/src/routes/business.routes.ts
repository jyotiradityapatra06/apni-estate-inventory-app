import { Router } from "express";
import * as businessController from "../controllers/business.controller";
import { protect, restrictTo } from "../middleware/auth.middleware";

const router = Router();

router.get("/", protect, businessController.getBusiness);
router.patch("/", protect, restrictTo("ADMIN"), businessController.updateBusiness);

export default router;
