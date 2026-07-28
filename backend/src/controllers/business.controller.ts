import { Request, Response, NextFunction } from "express";
import * as businessService from "../services/business.service";
import { businessProfileSchema, businessUpdateSchema } from "../validations/business.validation";

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
    const input = businessUpdateSchema.parse(req.body);
    const business = await businessService.update(req.user.businessId, req.user.role, input);
    res.status(200).json({
      success: true,
      message: "Business settings updated successfully.",
      data: business,
    });
  } catch (err) {
    next(err);
  }
};

export const updateBusinessProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const input = businessProfileSchema.parse(req.body);
    const business = await businessService.update(req.user.businessId, req.user.role, input);
    res.status(200).json({
      success: true,
      message: "Business profile updated successfully.",
      data: business,
    });
  } catch (err) {
    next(err);
  }
};
