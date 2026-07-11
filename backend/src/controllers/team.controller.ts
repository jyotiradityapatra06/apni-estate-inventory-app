import { Request, Response, NextFunction } from "express";
import * as teamService from "../services/team.service";

export const getTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const { search, role, status } = req.query;
    const workers = await teamService.getAllWorkers(req.user.businessId, {
      search: search as string,
      role: role as string,
      status: status as string,
    });
    const activeCount = await teamService.countActiveWorkers(req.user.businessId);

    res.status(200).json({
      success: true,
      data: {
        workers,
        activeCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getWorkerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const worker = await teamService.getWorkerById(req.user.businessId, req.params.id);
    res.status(200).json({
      success: true,
      data: worker,
    });
  } catch (err) {
    next(err);
  }
};

export const createWorker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const worker = await teamService.createWorker(req.user.businessId, req.body);
    res.status(201).json({
      success: true,
      message: "Worker created successfully.",
      data: worker,
    });
  } catch (err) {
    next(err);
  }
};

export const updateWorker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const worker = await teamService.updateWorker(req.user.businessId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "Worker details updated successfully.",
      data: worker,
    });
  } catch (err) {
    next(err);
  }
};

export const updateWorkerStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive state must be a boolean." });
    }
    const worker = await teamService.updateWorkerStatus(req.user.businessId, req.params.id, isActive);
    res.status(200).json({
      success: true,
      message: `Worker account ${isActive ? "activated" : "deactivated"} successfully.`,
      data: worker,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteWorker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    await teamService.deleteWorker(req.user.businessId, req.params.id);
    res.status(200).json({
      success: true,
      message: "Worker account deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};
