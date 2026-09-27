import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { ActivityLog } from '../models';

export const getActivities = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const { page = '1', limit = '30', action, documentId, userId } = req.query as Record<string, string>;

  const query: any = { organizationId: orgId };

  if (action) {
    query.action = action;
  }

  if (documentId) {
    query.documentId = new mongoose.Types.ObjectId(documentId);
  }

  if (userId) {
    query.userId = new mongoose.Types.ObjectId(userId);
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [activities, total] = await Promise.all([
    ActivityLog.find(query)
      .populate('userId', 'name email avatar')
      .populate('documentId', 'title originalName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    ActivityLog.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: activities,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
};
