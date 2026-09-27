import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  DocumentModel,
  ExtractedData,
  Review,
  WorkflowExecution,
} from '../models';
import { WorkflowEngine } from '../services/workflowEngine';
import { logActivity } from '../services/activityLogger';

export const getReviewQueue = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const { page = '1', limit = '20', documentType } = req.query as Record<string, string>;

  const query: any = {
    organizationId: orgId,
    status: 'review_required',
    isArchived: false,
  };

  if (documentType) {
    query.documentType = documentType;
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [documents, total] = await Promise.all([
    DocumentModel.find(query)
      .populate('uploadedBy', 'name email avatar')
      .populate('tags', 'name color')
      .populate('folderId', 'name')
      .sort({ createdAt: 1 }) // oldest review required first
      .skip(skip)
      .limit(limitNum),
    DocumentModel.countDocuments(query),
  ]);

  // Attach extracted data summaries
  const docIds = documents.map((d) => d._id);
  const extractions = await ExtractedData.find({ documentId: { $in: docIds } });

  const extractionsMap = new Map(extractions.map((e) => [e.documentId.toString(), e]));

  const queueItems = documents.map((doc) => {
    const ext = extractionsMap.get(doc._id.toString());
    const lowConfidenceFields = (ext?.fields || []).filter((f) => f.confidence < 0.85);

    return {
      document: doc,
      extractedData: ext,
      lowConfidenceFieldCount: lowConfidenceFields.length,
      fieldCount: ext?.fields.length || 0,
      urgency: lowConfidenceFields.length > 3 ? 'high' : 'normal',
    };
  });

  res.status(200).json({
    success: true,
    data: queueItems,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
};

export const submitReviewDecision = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { documentId } = req.params;

  if (!documentId || !mongoose.Types.ObjectId.isValid(documentId as string)) {
    res.status(400).json({ success: false, error: 'Valid document ID is required' });
    return;
  }

  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const userId = new mongoose.Types.ObjectId(req.userId);
  const { action, notes, fieldCorrections } = req.body;

  if (!['approve', 'reject', 'request_changes'].includes(action)) {
    res.status(400).json({ success: false, error: 'Invalid review action' });
    return;
  }

  const document = await DocumentModel.findOne({ _id: documentId, organizationId: orgId });
  if (!document) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }

  // If field corrections are supplied with the review, save them
  if (fieldCorrections && Array.isArray(fieldCorrections)) {
    const extractedData = await ExtractedData.findOne({ documentId: document._id });
    if (extractedData) {
      fieldCorrections.forEach((c: { key: string; value: any }) => {
        const field = extractedData.fields.find((f) => f.key === c.key);
        if (field) {
          field.editedValue = c.value;
          field.value = c.value;
          field.isEdited = true;
          field.status = 'approved';
        }
      });
      await extractedData.save();
    }
  }

  // Create Review entry
  await Review.create({
    documentId: document._id,
    organizationId: orgId,
    reviewerId: userId,
    action,
    notes: notes || '',
    fieldChanges: (fieldCorrections || []).map((c: any) => ({
      fieldKey: c.key,
      oldValue: c.oldValue,
      newValue: c.value,
    })),
  });

  // Advance workflow
  const updatedExecution = await WorkflowEngine.submitReviewDecision({
    documentId: document._id,
    organizationId: orgId,
    userId,
    action,
    notes,
  });

  await logActivity({
    organizationId: orgId,
    userId,
    action: action === 'approve' ? 'approval' : action === 'reject' ? 'rejection' : 'review',
    documentId: document._id,
    details: { action, notes, fieldsCorrectedCount: fieldCorrections?.length || 0 },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: `Review decision "${action}" applied successfully.`,
    data: {
      documentId: document._id,
      action,
      workflowExecution: updatedExecution,
    },
  });
};
