import { Request, Response, NextFunction } from "express";
import * as deliveryService from "../services/delivery.service";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const statusFilter = req.query.status as string;
    const deliveries = await deliveryService.getAll(req.user.businessId, statusFilter);
    res.status(200).json({
      success: true,
      data: deliveries,
    });
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const delivery = await deliveryService.getById(req.user.businessId, req.params.id);
    res.status(200).json({
      success: true,
      data: delivery,
    });
  } catch (err) {
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const delivery = await deliveryService.create(req.user.businessId, req.user.userId, req.body);
    res.status(201).json({
      success: true,
      message: "Delivery scheduled successfully.",
      data: delivery,
    });
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const delivery = await deliveryService.update(req.user.businessId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "Delivery updated successfully.",
      data: delivery,
    });
  } catch (err) {
    next(err);
  }
};

export const assign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const delivery = await deliveryService.assignDriver(req.user.businessId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "Driver and vehicle assigned successfully.",
      data: delivery,
    });
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const { status } = req.body;
    const delivery = await deliveryService.updateStatus(
      req.user.businessId,
      req.params.id,
      req.user.role,
      req.user.userId,
      status
    );
    res.status(200).json({
      success: true,
      message: "Delivery status updated successfully.",
      data: delivery,
    });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const result = await deliveryService.remove(req.user.businessId, req.params.id);
    res.status(200).json({
      success: true,
      message: "Delivery deleted successfully.",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getDriverDeliveries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const deliveries = await deliveryService.getDriverDeliveries(req.user.businessId, req.user.userId);
    res.status(200).json({
      success: true,
      data: deliveries,
    });
  } catch (err) {
    next(err);
  }
};
