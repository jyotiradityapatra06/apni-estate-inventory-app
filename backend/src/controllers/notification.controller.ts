import { Request, Response, NextFunction } from "express";
import * as notificationService from "../services/notification.service";

export const getAllNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const notifications = await notificationService.getAll(req.user.businessId);
    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (err) {
    next(err);
  }
};

export const createNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required." });
    }
    const notification = await notificationService.create(req.user.businessId, title, message);
    res.status(201).json({
      success: true,
      message: "Notification generated successfully.",
      data: notification,
    });
  } catch (err) {
    next(err);
  }
};
