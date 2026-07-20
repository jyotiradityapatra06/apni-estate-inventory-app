import { Router } from "express";
import * as controller from "../controllers/customer.controller";
import { protect, requirePermission } from "../middleware/auth.middleware";

const router = Router();
router.get("/", protect, requirePermission("customers:view"), controller.getAll);
router.get("/:id", protect, requirePermission("customers:view"), controller.getById);
router.post("/", protect, requirePermission("customers:create"), controller.create);
router.patch("/:id", protect, requirePermission("customers:update"), controller.update);
router.delete("/:id", protect, requirePermission("customers:delete"), controller.remove);
export default router;
