export type UserRole = 'owner' | 'admin' | 'reviewer' | 'member';

export type DocumentStatus =
  | 'uploaded'
  | 'processing'
  | 'completed'
  | 'review_required'
  | 'failed'
  | 'archived';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  settings?: {
    theme: 'dark' | 'light' | 'system';
    emailNotifications: boolean;
    inAppNotifications: boolean;
    autoProcessUploads: boolean;
  };
  currentOrganizationId?: string;
  createdAt: string;
}

export interface IOrganization {
  _id: string;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'enterprise';
  storageUsed: number;
  storageLimit: number;
  settings: {
    allowedDocTypes: string[];
    maxFileSizeMb: number;
    autoTriggerWorkflow: boolean;
    requireReviewForConfidenceBelow: number;
    defaultWorkflowId?: string;
  };
  currentUserRole?: UserRole;
  createdAt: string;
}

export interface ITag {
  _id: string;
  name: string;
  color: string;
  documentCount?: number;
}

export interface IFolder {
  _id: string;
  name: string;
  parentFolderId?: string | null;
  color?: string;
  documentCount?: number;
}

export interface IDocument {
  _id: string;
  title: string;
  originalName: string;
  description?: string;
  mimeType: string;
  fileExtension: string;
  fileSize: number;
  storagePath: string;
  storageKey: string;
  organizationId: string;
  folderId?: IFolder | string | null;
  tags?: ITag[];
  status: DocumentStatus;
  processingError?: string;
  documentType: string;
  extractedText?: string;
  wordCount: number;
  pageCount: number;
  summary?: string;
  confidenceScore: number;
  isArchived: boolean;
  archivedAt?: string;
  workflowId?: any;
  currentWorkflowStep?: number;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

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
    snippet?: string;
  };
}

export interface IExtractedTable {
  name: string;
  headers: string[];
  rows: any[][];
}

export interface IExtractedEntity {
  type: string;
  text: string;
  confidence: number;
}

export interface IExtractedData {
  _id: string;
  documentId: string;
  fields: IExtractedField[];
  tables: IExtractedTable[];
  entities: IExtractedEntity[];
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  reviewedAt?: string;
  reviewNotes?: string;
  isDemoMode: boolean;
}

export interface IWorkflowStep {
  stepNumber: number;
  name: string;
  description?: string;
  type: 'upload' | 'extraction' | 'ai_analysis' | 'review' | 'approval' | 'notification' | 'complete';
  assignedRole: UserRole | 'any';
  requiredApprovals: number;
  autoApproveConfidenceThreshold?: number;
}

export interface IWorkflow {
  _id: string;
  name: string;
  description: string;
  triggerType: 'on_upload' | 'manual' | 'by_doctype';
  triggerDocTypes?: string[];
  steps: IWorkflowStep[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface IWorkflowExecutionHistory {
  stepNumber: number;
  stepName: string;
  stepType: string;
  action: 'started' | 'passed' | 'approved' | 'rejected' | 'changes_requested' | 'skipped';
  actorId?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  timestamp: string;
  notes?: string;
}

export interface IWorkflowExecution {
  _id: string;
  documentId: string;
  workflowId: IWorkflow;
  currentStepNumber: number;
  currentStepName: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'changes_requested' | 'completed' | 'failed';
  history: IWorkflowExecutionHistory[];
  startedAt: string;
  completedAt?: string;
}

export interface IReview {
  _id: string;
  documentId: string;
  reviewerId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  action: 'approve' | 'reject' | 'request_changes';
  notes: string;
  fieldChanges: Array<{ fieldKey: string; oldValue: any; newValue: any }>;
  createdAt: string;
}

export interface IComment {
  _id: string;
  documentId: string;
  authorId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  parentCommentId?: string | null;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  documentId?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface IActivityLog {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  action: string;
  documentId?: {
    _id: string;
    title: string;
    originalName: string;
  };
  details: Record<string, any>;
  createdAt: string;
}
