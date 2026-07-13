import { Router } from "express";
import * as deliveryController from "../controllers/delivery.controller";
import { protect, authorizeDeliveryAccess } from "../middleware/auth.middleware";

const router = Router();

// Protect all delivery routes
router.use(protect, authorizeDeliveryAccess);

router.get("/", deliveryController.getAll);
router.get("/:id", deliveryController.getById);
router.post("/", deliveryController.create);
router.put("/:id", deliveryController.update);
router.delete("/:id", deliveryController.remove);

export default router;
