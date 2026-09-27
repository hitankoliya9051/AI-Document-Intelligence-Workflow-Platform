import mongoose, { Schema, Document as MongooseDoc, Model } from 'mongoose';

export type NotificationType =
  | 'processing_completed'
  | 'processing_failed'
  | 'review_required'
  | 'document_approved'
  | 'document_rejected'
  | 'team_invitation'
  | 'workflow_assignment'
  | 'comment_added'
  | 'system';

export interface INotification extends MongooseDoc {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  documentId?: mongoose.Types.ObjectId;
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'processing_completed',
        'processing_failed',
        'review_required',
        'document_approved',
        'document_rejected',
        'team_invitation',
        'workflow_assignment',
        'comment_added',
        'system',
      ],
      required: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
    },
    link: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);
