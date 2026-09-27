import mongoose from 'mongoose';
import { ActivityLog, ActivityAction } from '../models';

export interface LogActivityParams {
  organizationId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  action: ActivityAction;
  documentId?: mongoose.Types.ObjectId | string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export const logActivity = async (params: LogActivityParams): Promise<void> => {
  try {
    await ActivityLog.create({
      organizationId: new mongoose.Types.ObjectId(params.organizationId),
      userId: new mongoose.Types.ObjectId(params.userId),
      action: params.action,
      documentId: params.documentId ? new mongoose.Types.ObjectId(params.documentId) : undefined,
      details: params.details || {},
      ipAddress: params.ipAddress || '',
      userAgent: params.userAgent || '',
    });
  } catch (error) {
    console.error('Error recording activity log:', error);
  }
};
