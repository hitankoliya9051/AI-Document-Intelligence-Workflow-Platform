import mongoose, { Schema, Document as MongooseDoc, Model } from 'mongoose';

export interface ITag extends MongooseDoc {
  name: string;
  color: string;
  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

TagSchema.index({ organizationId: 1, name: 1 }, { unique: true });

export const Tag: Model<ITag> = mongoose.model<ITag>('Tag', TagSchema);
