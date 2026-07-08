import {
  getUserNotificationsService,
  markNotificationReadService,
  markAllNotificationsReadService,
} from "./notification.service.js";

export const getUserNotificationsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await getUserNotificationsService(userId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const markNotificationReadController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    await markNotificationReadService(notificationId, userId);
    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsReadController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await markAllNotificationsReadService(userId);
    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (err) {
    next(err);
  }
};
