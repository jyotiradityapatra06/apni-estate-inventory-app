import { Request, Response, NextFunction } from "express";
import * as inventoryService from "../services/inventory.service";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const { search, category, location, stockStatus } = req.query;
    const items = await inventoryService.getAll(req.user.businessId, {
      search: search as string,
      category: category as string,
      location: location as string,
      stockStatus: stockStatus as string,
    });
    res.status(200).json({
      success: true,
      data: items,
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
    const item = await inventoryService.getById(req.user.businessId, req.params.id);
    res.status(200).json({
      success: true,
      data: item,
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
    const item = await inventoryService.create(req.user.businessId, req.body);
    res.status(201).json({
      success: true,
      message: "Inventory item created successfully.",
      data: item,
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
    const item = await inventoryService.update(req.user.businessId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "Inventory item updated successfully.",
      data: item,
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
    const result = await inventoryService.remove(req.user.businessId, req.params.id);
    res.status(200).json({
      success: true,
      message: "Inventory item deleted successfully.",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const adjustStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const item = await inventoryService.adjustStock(
      req.user.businessId,
      req.user.userId,
      req.params.id,
      req.body
    );
    res.status(200).json({
      success: true,
      message: "Stock adjustment recorded successfully.",
      data: item,
    });
  } catch (err) {
    next(err);
  }
};

export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const transactions = await inventoryService.getTransactions(req.user.businessId, req.params.id);
    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (err) {
    next(err);
  }
};
