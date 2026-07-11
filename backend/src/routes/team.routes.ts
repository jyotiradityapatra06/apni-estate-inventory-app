import { Router } from "express";
import * as teamController from "../controllers/team.controller";
import { protect, requirePermission } from "../middleware/auth.middleware";

const router = Router();

// Protect all routes under team management using the team:manage permission
router.use(protect, requirePermission("team:manage"));

router.get("/", teamController.getTeam);
router.get("/:id", teamController.getWorkerById);
router.post("/", teamController.createWorker);
router.patch("/:id", teamController.updateWorker);
router.patch("/:id/status", teamController.updateWorkerStatus);
router.delete("/:id", teamController.deleteWorker);

export default router;
