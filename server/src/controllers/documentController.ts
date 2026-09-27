import { Response } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  DocumentModel,
  ExtractedData,
  WorkflowExecution,
  Review,
  Comment,
  Organization,
  Folder,
} from '../models';
import { getStorageService } from '../services/storage';
import { DocumentProcessor } from '../services/documentProcessor';
import { WorkflowEngine } from '../services/workflowEngine';
import { getAIService } from '../services/ai';
import { logActivity } from '../services/activityLogger';

export const uploadDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file provided for upload' });
    return;
  }

  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const userId = new mongoose.Types.ObjectId(req.userId);

  // Check storage quota
  const org = await Organization.findById(orgId);
  if (!org) {
    res.status(404).json({ success: false, error: 'Organization not found' });
    return;
  }

  if (org.storageUsed + req.file.size > org.storageLimit) {
    res.status(400).json({
      success: false,
      error: 'Organization storage quota exceeded. Please upgrade plan or delete files.',
    });
    return;
  }

  const { title, description, folderId, workflowId } = req.body;
  const originalName = req.file.originalname;
  const ext = path.extname(originalName).toLowerCase().replace('.', '');
  const docTitle = title || path.basename(originalName, path.extname(originalName));

  // Check duplicate in same folder
  const existingInFolder = await DocumentModel.findOne({
    organizationId: orgId,
    folderId: folderId ? new mongoose.Types.ObjectId(folderId) : null,
    originalName,
    isArchived: false,
  });

  const finalName = existingInFolder
    ? `${path.basename(originalName, path.extname(originalName))}-${Date.now()}.${ext}`
    : originalName;

  // Upload to storage provider
  const storage = getStorageService();
  const uploadRes = await storage.uploadFile(
    req.file.buffer,
    finalName,
    req.file.mimetype,
    `org-${orgId}`
  );

  // Create document in MongoDB
  const document = await DocumentModel.create({
    title: docTitle,
    originalName: finalName,
    description: description || '',
    mimeType: req.file.mimetype,
    fileExtension: ext,
    fileSize: req.file.size,
    storagePath: uploadRes.storagePath,
    storageKey: uploadRes.storageKey,
    storageProvider: 'local',
    organizationId: orgId,
    folderId: folderId ? new mongoose.Types.ObjectId(folderId) : null,
    status: 'uploaded',
    uploadedBy: userId,
  });

  // Increment org storage used
  org.storageUsed += req.file.size;
  await org.save();

  // Audit log
  await logActivity({
    organizationId: orgId,
    userId,
    action: 'upload',
    documentId: document._id,
    details: {
      fileName: finalName,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    },
    ipAddress: req.ip,
  });

  // Start workflow
  await WorkflowEngine.startWorkflow(document._id, orgId, userId, workflowId);

  // Trigger automated asynchronous document processing pipeline
  // Runs in background so response returns immediately
  setImmediate(async () => {
    try {
      await DocumentProcessor.processDocument(document._id);
    } catch (err) {
      console.error('Background processing error:', err);
    }
  });

  res.status(201).json({
    success: true,
    message: 'Document uploaded successfully and queued for AI intelligence processing.',
    data: document,
  });
};

export const getDocuments = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const {
    page = '1',
    limit = '20',
    status,
    folderId,
    documentType,
    tagId,
    isArchived = 'false',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
  } = req.query as Record<string, string>;

  const query: any = {
    organizationId: orgId,
    isArchived: isArchived === 'true',
  };

  if (status) {
    query.status = status;
  }

  if (folderId) {
    query.folderId = folderId === 'root' ? null : new mongoose.Types.ObjectId(folderId);
  }

  if (documentType) {
    query.documentType = documentType;
  }

  if (tagId) {
    query.tags = new mongoose.Types.ObjectId(tagId);
  }

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { title: { $regex: s, $options: 'i' } },
      { originalName: { $regex: s, $options: 'i' } },
      { description: { $regex: s, $options: 'i' } },
      { extractedText: { $regex: s, $options: 'i' } },
      { summary: { $regex: s, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [documents, total] = await Promise.all([
    DocumentModel.find(query)
      .populate('tags', 'name color')
      .populate('folderId', 'name color')
      .populate('uploadedBy', 'name email avatar')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum),
    DocumentModel.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: documents,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
};

export const getDocumentById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const document = await DocumentModel.findOne({
    _id: id,
    organizationId: orgId,
  })
    .populate('tags', 'name color')
    .populate('folderId', 'name color')
    .populate('uploadedBy', 'name email avatar')
    .populate('workflowId');

  if (!document) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }

  // Fetch linked extraction, workflow execution & reviews
  const [extractedData, workflowExecution, reviews] = await Promise.all([
    ExtractedData.findOne({ documentId: document._id }).populate('reviewedBy', 'name email'),
    WorkflowExecution.findOne({ documentId: document._id }),
    Review.find({ documentId: document._id }).populate('reviewerId', 'name email avatar').sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      document,
      extractedData,
      workflowExecution,
      reviews,
    },
  });
};

export const downloadDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const document = await DocumentModel.findOne({ _id: id, organizationId: orgId });
  if (!document) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }

  const storage = getStorageService();
  const fileStream = await storage.getFileStream(document.storageKey);

  res.setHeader('Content-Type', document.mimeType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(document.originalName)}"`
  );

  await logActivity({
    organizationId: orgId,
    userId: req.userId!,
    action: 'download',
    documentId: document._id,
    details: { fileName: document.originalName },
  });

  fileStream.pipe(res);
};

export const previewDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const document = await DocumentModel.findOne({ _id: id, organizationId: orgId });
  if (!document) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }

  const storage = getStorageService();
  const fileStream = await storage.getFileStream(document.storageKey);

  res.setHeader('Content-Type', document.mimeType);
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${encodeURIComponent(document.originalName)}"`
  );

  fileStream.pipe(res);
};

export const updateDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const { title, description, folderId, tags } = req.body;

  const document = await DocumentModel.findOne({ _id: id, organizationId: orgId });
  if (!document) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }

  if (title) {
    if (title !== document.title) {
      await logActivity({
        organizationId: orgId,
        userId: req.userId!,
        action: 'rename',
        documentId: document._id,
        details: { oldTitle: document.title, newTitle: title },
      });
    }
    document.title = title;
  }

  if (description !== undefined) {
    document.description = description;
  }

  if (folderId !== undefined) {
    const oldFolder = document.folderId;
    document.folderId = folderId ? new mongoose.Types.ObjectId(folderId) : null;
    await logActivity({
      organizationId: orgId,
      userId: req.userId!,
      action: 'move',
      documentId: document._id,
      details: { oldFolder, newFolder: document.folderId },
    });
  }

  if (tags && Array.isArray(tags)) {
    document.tags = tags.map((t: string) => new mongoose.Types.ObjectId(t));
  }

  await document.save();

  res.status(200).json({
    success: true,
    message: 'Document updated successfully',
    data: document,
  });
};

export const archiveDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const document = await DocumentModel.findOneAndUpdate(
    { _id: id, organizationId: orgId },
    { isArchived: true, archivedAt: new Date() },
    { new: true }
  );

  if (!document) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }

  await logActivity({
    organizationId: orgId,
    userId: req.userId!,
    action: 'archive',
    documentId: document._id,
    details: { title: document.title },
  });

  res.status(200).json({
    success: true,
    message: 'Document archived successfully',
    data: document,
  });
};

export const restoreDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const document = await DocumentModel.findOneAndUpdate(
    { _id: id, organizationId: orgId },
    { isArchived: false, archivedAt: null },
    { new: true }
  );

  if (!document) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }

  await logActivity({
    organizationId: orgId,
    userId: req.userId!,
    action: 'restore',
    documentId: document._id,
    details: { title: document.title },
  });

  res.status(200).json({
    success: true,
    message: 'Document restored successfully',
    data: document,
  });
};

export const deleteDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const document = await DocumentModel.findOne({ _id: id, organizationId: orgId });
  if (!document) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }

  // Delete physical file from storage
  const storage = getStorageService();
  await storage.deleteFile(document.storageKey);

  // Decrement storage
  await Organization.findByIdAndUpdate(orgId, {
    $inc: { storageUsed: -document.fileSize },
  });

  // Cascade delete metadata
  await Promise.all([
    DocumentModel.deleteOne({ _id: document._id }),
    ExtractedData.deleteMany({ documentId: document._id }),
    WorkflowExecution.deleteMany({ documentId: document._id }),
    Review.deleteMany({ documentId: document._id }),
    Comment.deleteMany({ documentId: document._id }),
  ]);

  await logActivity({
    organizationId: orgId,
    userId: req.userId!,
    action: 'delete',
    documentId: document._id,
    details: { title: document.title, fileName: document.originalName },
  });

  res.status(200).json({
    success: true,
    message: 'Document permanently deleted',
  });
};

export const reprocessDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const document = await DocumentModel.findOne({ _id: id, organizationId: orgId });
  if (!document) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }

  setImmediate(async () => {
    try {
      await DocumentProcessor.processDocument(document._id);
    } catch (err) {
      console.error('Reprocess error:', err);
    }
  });

  res.status(200).json({
    success: true,
    message: 'Document intelligence processing re-triggered.',
  });
};

export const chatWithDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const { query, question, history } = req.body;
  const userQuery = (query || question || '').trim();

  if (!userQuery) {
    res.status(400).json({ success: false, error: 'Query or question is required' });
    return;
  }

  const document = await DocumentModel.findOne({ _id: id, organizationId: orgId });
  if (!document) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }

  const aiService = getAIService();
  const context = document.extractedText || document.summary || document.title;

  const result = await aiService.chatWithDocument(context, userQuery, history || []);

  res.status(200).json({
    success: true,
    data: result,
  });
};
