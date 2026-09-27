import mongoose, { Schema, Document as MongooseDoc, Model } from 'mongoose';

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

export interface IExtractedField {
  key: string;
  label: string;
  value: any;
  type: 'string' | 'number' | 'date' | 'currency' | 'email' | 'phone' | 'boolean' | 'address';
  confidence: number;
  isEdited: boolean;
  editedValue?: any;
  status: 'pending' | 'approved' | 'rejected';
  sourceLocation?: {
    page?: number;
    snippet?: string;
  };
}

export interface IExtractedTable {
  name: string;
  headers: string[];
  rows: any[][];
}

export interface IExtractedEntity {
  type: string; // e.g. 'ORGANIZATION', 'PERSON', 'LOCATION', 'MONEY', 'DATE'
  text: string;
  confidence: number;
}

export interface IExtractedData extends MongooseDoc {
  documentId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  fields: IExtractedField[];
  tables: IExtractedTable[];
  entities: IExtractedEntity[];
  reviewStatus: ReviewStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  isDemoMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExtractedFieldSchema = new Schema<IExtractedField>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: Schema.Types.Mixed },
    type: {
      type: String,
      enum: ['string', 'number', 'date', 'currency', 'email', 'phone', 'boolean', 'address'],
      default: 'string',
    },
    confidence: { type: Number, default: 0.9, min: 0, max: 1 },
    isEdited: { type: Boolean, default: false },
    editedValue: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    sourceLocation: {
      page: { type: Number },
      snippet: { type: String },
    },
  },
  { _id: false }
);

const ExtractedTableSchema = new Schema<IExtractedTable>(
  {
    name: { type: String, default: 'Table 1' },
    headers: { type: [String], default: [] },
    rows: { type: [[Schema.Types.Mixed]], default: [] },
  },
  { _id: false }
);

const ExtractedEntitySchema = new Schema<IExtractedEntity>(
  {
    type: { type: String, required: true },
    text: { type: String, required: true },
    confidence: { type: Number, default: 0.9 },
  },
  { _id: false }
);

const ExtractedDataSchema = new Schema<IExtractedData>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      unique: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    fields: [ExtractedFieldSchema],
    tables: [ExtractedTableSchema],
    entities: [ExtractedEntitySchema],
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'changes_requested'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      default: '',
    },
    isDemoMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

ExtractedDataSchema.index({ organizationId: 1, reviewStatus: 1 });

export const ExtractedData: Model<IExtractedData> = mongoose.model<IExtractedData>(
  'ExtractedData',
  ExtractedDataSchema
);
