import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { Notification } from '../models';

export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const { limit = '30' } = req.query as Record<string, string>;
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({
      userId,
      organizationId: orgId,
    })
      .sort({ createdAt: -1 })
      .limit(limitNum),
    Notification.countDocuments({
      userId,
      organizationId: orgId,
      isRead: false,
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount,
    },
  });
};

export const markAsRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = new mongoose.Types.ObjectId(req.userId);

  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    res.status(404).json({ success: false, error: 'Notification not found' });
    return;
  }

  res.status(200).json({
    success: true,
    data: notification,
  });
};

export const markAllAsRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  await Notification.updateMany(
    { userId, organizationId: orgId, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
};
