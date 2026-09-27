import mongoose, { Schema, Document as MongooseDoc, Model } from 'mongoose';

export type WorkflowExecutionStatus =
  | 'pending'
  | 'in_progress'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'completed'
  | 'failed';

export interface IWorkflowExecutionHistory {
  stepNumber: number;
  stepName: string;
  stepType: string;
  action: 'started' | 'passed' | 'approved' | 'rejected' | 'changes_requested' | 'skipped';
  actorId?: mongoose.Types.ObjectId;
  timestamp: Date;
  notes?: string;
}

export interface IWorkflowExecution extends MongooseDoc {
  documentId: mongoose.Types.ObjectId;
  workflowId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  currentStepNumber: number;
  currentStepName: string;
  status: WorkflowExecutionStatus;
  history: IWorkflowExecutionHistory[];
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowExecutionHistorySchema = new Schema<IWorkflowExecutionHistory>(
  {
    stepNumber: { type: Number, required: true },
    stepName: { type: String, required: true },
    stepType: { type: String, required: true },
    action: {
      type: String,
      enum: ['started', 'passed', 'approved', 'rejected', 'changes_requested', 'skipped'],
      required: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const WorkflowExecutionSchema = new Schema<IWorkflowExecution>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    currentStepNumber: {
      type: Number,
      default: 1,
    },
    currentStepName: {
      type: String,
      default: 'Document Upload',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'approved', 'rejected', 'changes_requested', 'completed', 'failed'],
      default: 'in_progress',
      index: true,
    },
    history: [WorkflowExecutionHistorySchema],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

WorkflowExecutionSchema.index({ organizationId: 1, status: 1 });
WorkflowExecutionSchema.index({ documentId: 1, workflowId: 1 });

export const WorkflowExecution: Model<IWorkflowExecution> =
  mongoose.model<IWorkflowExecution>('WorkflowExecution', WorkflowExecutionSchema);
