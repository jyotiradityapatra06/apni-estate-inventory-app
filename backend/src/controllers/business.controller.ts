import { Request, Response, NextFunction } from "express";
import * as businessService from "../services/business.service";

export const getBusiness = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const business = await businessService.getById(req.user.businessId);
    res.status(200).json({
      success: true,
      data: business,
    });
  } catch (err) {
    next(err);
  }
};

export const updateBusiness = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const business = await businessService.update(req.user.businessId, req.user.role, req.body);
    res.status(200).json({
      success: true,
      message: "Business settings updated successfully.",
      data: business,
    });
  } catch (err) {
    next(err);
  }
};
