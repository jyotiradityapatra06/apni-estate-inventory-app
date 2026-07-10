import { Router } from "express";
import * as inventoryController from "../controllers/inventory.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/", protect, inventoryController.getAll);
router.get("/:id", protect, inventoryController.getById);
router.post("/", protect, inventoryController.create);
router.put("/:id", protect, inventoryController.update);
router.delete("/:id", protect, inventoryController.remove);
router.patch("/:id/stock", protect, inventoryController.adjustStock);
router.get("/:id/transactions", protect, inventoryController.getTransactions);

export default router;
