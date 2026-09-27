import mongoose, { Schema, Document as MongooseDoc, Model } from 'mongoose';

export type ReviewAction = 'approve' | 'reject' | 'request_changes';

export interface IFieldChange {
  fieldKey: string;
  oldValue: any;
  newValue: any;
}

export interface IReview extends MongooseDoc {
  documentId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  action: ReviewAction;
  notes: string;
  fieldChanges: IFieldChange[];
  createdAt: Date;
  updatedAt: Date;
}

const FieldChangeSchema = new Schema<IFieldChange>(
  {
    fieldKey: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const ReviewSchema = new Schema<IReview>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['approve', 'reject', 'request_changes'],
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    fieldChanges: [FieldChangeSchema],
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index({ organizationId: 1, createdAt: -1 });

export const Review: Model<IReview> = mongoose.model<IReview>('Review', ReviewSchema);
