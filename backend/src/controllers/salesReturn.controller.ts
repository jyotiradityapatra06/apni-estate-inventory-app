import { Request, Response, NextFunction } from "express";
import * as service from "../services/salesReturn.service";

const bid = (req: Request) => req.user!.businessId;

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await service.getAll(bid(req), req.query) });
  } catch (e) {
    next(e);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await service.getById(bid(req), req.params.id) });
  } catch (e) {
    next(e);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json({
      success: true,
      message: "Sales return draft created successfully.",
      data: await service.create(bid(req), req.user!.userId, req.body),
    });
  } catch (e) {
    next(e);
  }
};

export const post = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      message: "Sales return completed successfully.",
      data: await service.post(bid(req), req.user!.userId, req.params.id),
    });
  } catch (e) {
    next(e);
  }
};

export const cancel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      message: "Sales return cancelled successfully.",
      data: await service.cancel(bid(req), req.user!.userId, req.params.id, req.body.reason),
    });
  } catch (e) {
    next(e);
  }
};
