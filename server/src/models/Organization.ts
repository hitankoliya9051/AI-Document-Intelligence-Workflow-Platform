import mongoose, { Schema, Document as MongooseDoc, Model } from 'mongoose';

export interface IOrganization extends MongooseDoc {
  name: string;
  slug: string;
  ownerId: mongoose.Types.ObjectId;
  plan: 'free' | 'starter' | 'enterprise';
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes (e.g. 5GB = 5 * 1024 * 1024 * 1024)
  settings: {
    allowedDocTypes: string[];
    maxFileSizeMb: number;
    autoTriggerWorkflow: boolean;
    defaultWorkflowId?: mongoose.Types.ObjectId;
    requireReviewForConfidenceBelow: number; // e.g. 0.85
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['free', 'starter', 'enterprise'],
      default: 'enterprise',
    },
    storageUsed: {
      type: Number,
      default: 0,
    },
    storageLimit: {
      type: Number,
      default: 5 * 1024 * 1024 * 1024, // 5GB default
    },
    settings: {
      allowedDocTypes: {
        type: [String],
        default: ['pdf', 'docx', 'txt', 'csv', 'xlsx', 'png', 'jpg', 'jpeg'],
      },
      maxFileSizeMb: {
        type: Number,
        default: 25,
      },
      autoTriggerWorkflow: {
        type: Boolean,
        default: true,
      },
      defaultWorkflowId: {
        type: Schema.Types.ObjectId,
        ref: 'Workflow',
      },
      requireReviewForConfidenceBelow: {
        type: Number,
        default: 0.85,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Organization: Model<IOrganization> = mongoose.model<IOrganization>(
  'Organization',
  OrganizationSchema
);
