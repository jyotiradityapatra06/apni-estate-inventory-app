import { Request, Response, NextFunction } from "express";
import * as deliveryService from "../services/delivery.service";
import { ApiError } from "../utils/apiError";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const deliveries = await deliveryService.getAll(req.user.businessId);
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
    if (!delivery) {
      return next(new ApiError(404, "Delivery not found."));
    }
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

    const { customerName, deliveryAddress, materialName, quantity, unit, customerPhone, scheduledDate, notes, paymentStatus } = req.body;

    // Validate required fields
    if (!customerName || !customerName.trim()) {
      return next(new ApiError(400, "Customer Name is required."));
    }
    if (!deliveryAddress || !deliveryAddress.trim()) {
      return next(new ApiError(400, "Delivery Address is required."));
    }
    if (!materialName || !materialName.trim()) {
      return next(new ApiError(400, "Material Name is required."));
    }
    if (quantity === undefined || quantity === null) {
      return next(new ApiError(400, "Quantity is required."));
    }
    if (Number(quantity) <= 0) {
      return next(new ApiError(400, "Quantity must be greater than zero."));
    }
    if (!unit || !unit.trim()) {
      return next(new ApiError(400, "Unit is required."));
    }

    // Validate scheduledDate if present
    if (scheduledDate) {
      const parsedDate = new Date(scheduledDate);
      if (isNaN(parsedDate.getTime())) {
        return next(new ApiError(400, "Scheduled Date is invalid."));
      }
    }

    const delivery = await deliveryService.create(req.user.businessId, {
      customerName: customerName.trim(),
      customerPhone: customerPhone ? customerPhone.trim() : null,
      deliveryAddress: deliveryAddress.trim(),
      materialName: materialName.trim(),
      quantity: Number(quantity),
      unit: unit.trim(),
      scheduledDate,
      notes,
      paymentStatus,
    });

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

    const { customerName, deliveryAddress, materialName, quantity, unit, customerPhone, scheduledDate, notes, status, paymentStatus } = req.body;

    // Validation checks for updates if fields are specified
    if (customerName !== undefined && (!customerName || !customerName.trim())) {
      return next(new ApiError(400, "Customer Name cannot be empty."));
    }
    if (deliveryAddress !== undefined && (!deliveryAddress || !deliveryAddress.trim())) {
      return next(new ApiError(400, "Delivery Address cannot be empty."));
    }
    if (materialName !== undefined && (!materialName || !materialName.trim())) {
      return next(new ApiError(400, "Material Name cannot be empty."));
    }
    if (quantity !== undefined && Number(quantity) <= 0) {
      return next(new ApiError(400, "Quantity must be greater than zero."));
    }
    if (unit !== undefined && (!unit || !unit.trim())) {
      return next(new ApiError(400, "Unit cannot be empty."));
    }
    if (scheduledDate !== undefined && scheduledDate !== null && scheduledDate !== "") {
      const parsedDate = new Date(scheduledDate);
      if (isNaN(parsedDate.getTime())) {
        return next(new ApiError(400, "Scheduled Date is invalid."));
      }
    }

    const updatedDelivery = await deliveryService.update(
      req.user.businessId,
      req.params.id,
      req.body,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: "Delivery updated successfully.",
      data: updatedDelivery,
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

    // Double check Owner role for deletion
    if (req.user.role.toUpperCase() !== "OWNER") {
      return next(new ApiError(403, "Only the business OWNER is authorized to delete deliveries."));
    }

    const deleted = await deliveryService.remove(req.user.businessId, req.params.id);

    res.status(200).json({
      success: true,
      message: "Delivery deleted successfully.",
      data: { id: deleted.id },
    });
  } catch (err) {
    next(err);
  }
};
