import mongoose, { Schema, Document as MongooseDoc, Model } from 'mongoose';

export interface IFolder extends MongooseDoc {
  name: string;
  parentFolderId?: mongoose.Types.ObjectId | null;
  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    parentFolderId: {
      type: Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
      index: true,
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
    color: {
      type: String,
      default: '#6366f1',
    },
  },
  {
    timestamps: true,
  }
);

FolderSchema.index({ organizationId: 1, parentFolderId: 1, name: 1 });

export const Folder: Model<IFolder> = mongoose.model<IFolder>('Folder', FolderSchema);
