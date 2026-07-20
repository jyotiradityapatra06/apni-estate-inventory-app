import { Request, Response, NextFunction } from "express";
import * as notificationService from "../services/notification.service";

export const getAllNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    const notifications = await notificationService.getAll(
      req.user.businessId
    );

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const createNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    const { title, message } = req.body;

    if (
      typeof title !== "string" ||
      typeof message !== "string" ||
      !title.trim() ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required.",
      });
    }

    const notification = await notificationService.create(
      req.user.businessId,
      title.trim(),
      message.trim()
    );

    return res.status(201).json({
      success: true,
      message: "Notification created successfully.",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export const clearAllNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    const result = await notificationService.clearAll(
      req.user.businessId
    );

    return res.status(200).json({
      success: true,
      message:
        result.count > 0
          ? "Notifications cleared successfully."
          : "No notifications to clear.",
      data: {
        deletedCount: result.count,
      },
    });
  } catch (error) {
    next(error);
  }
};