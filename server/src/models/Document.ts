import mongoose, { Schema, Document as MongooseDoc, Model } from 'mongoose';

export type DocumentStatus =
  | 'uploaded'
  | 'processing'
  | 'completed'
  | 'review_required'
  | 'failed'
  | 'archived';

export interface IDocument extends MongooseDoc {
  title: string;
  originalName: string;
  description?: string;
  mimeType: string;
  fileExtension: string;
  fileSize: number;
  storagePath: string;
  storageKey: string;
  storageProvider: 'local' | 's3';
  organizationId: mongoose.Types.ObjectId;
  folderId?: mongoose.Types.ObjectId | null;
  tags: mongoose.Types.ObjectId[];
  status: DocumentStatus;
  processingError?: string;
  documentType: string;
  extractedText?: string;
  wordCount: number;
  pageCount: number;
  summary?: string;
  confidenceScore: number;
  language: string;
  isArchived: boolean;
  archivedAt?: Date;
  workflowId?: mongoose.Types.ObjectId | null;
  currentWorkflowStep?: number;
  uploadedBy: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileExtension: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    storageProvider: {
      type: String,
      enum: ['local', 's3'],
      default: 'local',
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    folderId: {
      type: Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
      index: true,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'completed', 'review_required', 'failed', 'archived'],
      default: 'uploaded',
      index: true,
    },
    processingError: {
      type: String,
    },
    documentType: {
      type: String,
      default: 'general',
      index: true,
    },
    extractedText: {
      type: String,
      default: '',
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    pageCount: {
      type: Number,
      default: 1,
    },
    summary: {
      type: String,
      default: '',
    },
    confidenceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    language: {
      type: String,
      default: 'en',
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
    },
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'Workflow',
      default: null,
      index: true,
    },
    currentWorkflowStep: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performant querying
DocumentSchema.index({ organizationId: 1, isArchived: 1, status: 1 });
DocumentSchema.index({ organizationId: 1, folderId: 1, isArchived: 1 });
DocumentSchema.index({ organizationId: 1, documentType: 1 });
DocumentSchema.index({ organizationId: 1, createdAt: -1 });

// Full text search index
DocumentSchema.index(
  {
    title: 'text',
    extractedText: 'text',
    summary: 'text',
    description: 'text',
  },
  {
    weights: {
      title: 10,
      summary: 5,
      description: 3,
      extractedText: 1,
    },
    name: 'document_text_search',
  }
);

export const DocumentModel: Model<IDocument> = mongoose.model<IDocument>(
  'Document',
  DocumentSchema
);
