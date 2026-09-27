import mongoose, { Schema, Document as MongooseDoc, Model } from 'mongoose';

export type WorkflowStepType =
  | 'upload'
  | 'extraction'
  | 'ai_analysis'
  | 'review'
  | 'approval'
  | 'notification'
  | 'complete';

export interface IWorkflowStep {
  stepNumber: number;
  name: string;
  description?: string;
  type: WorkflowStepType;
  assignedRole: 'owner' | 'admin' | 'reviewer' | 'member' | 'any';
  requiredApprovals: number;
  autoApproveConfidenceThreshold?: number; // e.g. 0.95 auto advances
}

export interface IWorkflow extends MongooseDoc {
  name: string;
  description: string;
  organizationId: mongoose.Types.ObjectId;
  triggerType: 'on_upload' | 'manual' | 'by_doctype';
  triggerDocTypes?: string[];
  steps: IWorkflowStep[];
  isActive: boolean;
  isDefault: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowStepSchema = new Schema<IWorkflowStep>(
  {
    stepNumber: { type: Number, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['upload', 'extraction', 'ai_analysis', 'review', 'approval', 'notification', 'complete'],
      required: true,
    },
    assignedRole: {
      type: String,
      enum: ['owner', 'admin', 'reviewer', 'member', 'any'],
      default: 'reviewer',
    },
    requiredApprovals: { type: Number, default: 1 },
    autoApproveConfidenceThreshold: { type: Number, default: 0.95 },
  },
  { _id: false }
);

const WorkflowSchema = new Schema<IWorkflow>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    triggerType: {
      type: String,
      enum: ['on_upload', 'manual', 'by_doctype'],
      default: 'on_upload',
    },
    triggerDocTypes: {
      type: [String],
      default: [],
    },
    steps: [WorkflowStepSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
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

WorkflowSchema.index({ organizationId: 1, isDefault: 1 });

export const Workflow: Model<IWorkflow> = mongoose.model<IWorkflow>(
  'Workflow',
  WorkflowSchema
);
