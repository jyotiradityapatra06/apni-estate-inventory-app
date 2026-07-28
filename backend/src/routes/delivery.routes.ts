import { Router } from "express";
import * as deliveryController from "../controllers/delivery.controller";
import { protect, restrictTo } from "../middleware/auth.middleware";

const router = Router();

// Protect all delivery routes
router.use(protect);

router.get("/", restrictTo("OWNER", "MANAGER"), deliveryController.getAll);
router.get("/:id", restrictTo("OWNER", "MANAGER"), deliveryController.getById);
router.post("/", restrictTo("OWNER", "MANAGER"), deliveryController.create);
router.put("/:id", restrictTo("OWNER", "MANAGER"), deliveryController.update);
router.delete("/:id", restrictTo("OWNER"), deliveryController.remove);

export default router;
