import { Router } from "express";
import * as inventoryController from "../controllers/inventory.controller";
import { protect, requirePermission } from "../middleware/auth.middleware";

const router = Router();

router.get("/", protect, requirePermission("inventory:view"), inventoryController.getAll);
router.get("/transactions", protect, requirePermission("inventory:view"), inventoryController.getAllTransactions);
router.get("/:id", protect, requirePermission("inventory:view"), inventoryController.getById);
router.post("/", protect, requirePermission("inventory:create"), inventoryController.create);
router.put("/:id", protect, requirePermission("inventory:update"), inventoryController.update);
router.delete("/:id", protect, requirePermission("inventory:delete"), inventoryController.remove);

router.patch("/:id/stock", protect, (req, res, next) => {
  const type = req.body.type;
  const permission = type === "IN" ? "stock:in" : "stock:out";
  return requirePermission(permission)(req, res, next);
}, inventoryController.adjustStock);

router.get("/:id/transactions", protect, requirePermission("ledger:view"), inventoryController.getTransactions);

export default router;
