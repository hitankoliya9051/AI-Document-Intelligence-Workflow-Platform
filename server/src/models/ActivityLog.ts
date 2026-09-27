import mongoose, { Schema, Document as MongooseDoc, Model } from 'mongoose';

export type ActivityAction =
  | 'login'
  | 'logout'
  | 'upload'
  | 'download'
  | 'rename'
  | 'delete'
  | 'move'
  | 'archive'
  | 'restore'
  | 'processing_started'
  | 'processing_completed'
  | 'processing_failed'
  | 'extraction'
  | 'review'
  | 'approval'
  | 'rejection'
  | 'comment'
  | 'workflow_change'
  | 'permission_change'
  | 'settings_update';

export interface IActivityLog extends MongooseDoc {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: ActivityAction;
  documentId?: mongoose.Types.ObjectId;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ActivityLogSchema.index({ organizationId: 1, createdAt: -1 });

export const ActivityLog: Model<IActivityLog> = mongoose.model<IActivityLog>(
  'ActivityLog',
  ActivityLogSchema
);
