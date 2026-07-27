import { Router } from "express";
import { getPublicInvoice } from "../controllers/publicInvoice.controller";

const router = Router();

// Public route - unauthenticated
router.get("/:token", getPublicInvoice);

export default router;
