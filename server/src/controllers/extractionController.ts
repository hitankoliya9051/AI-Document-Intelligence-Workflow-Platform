import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { ExtractedData, DocumentModel, Review } from '../models';
import { logActivity } from '../services/activityLogger';
import { WorkflowEngine } from '../services/workflowEngine';

export const getExtractedData = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const documentId = req.params.documentId as string;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const data = await ExtractedData.findOne({
    documentId: new mongoose.Types.ObjectId(documentId),
    organizationId: orgId,
  }).populate('reviewedBy', 'name email avatar');

  if (!data) {
    res.status(404).json({ success: false, error: 'Extracted data not found for document' });
    return;
  }

  res.status(200).json({
    success: true,
    data,
  });
};

export const updateExtractedFields = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const documentId = req.params.documentId as string;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const userId = new mongoose.Types.ObjectId(req.userId);
  const { fields } = req.body; // Array of { key: string, value: any, status?: string }

  if (!Array.isArray(fields)) {
    res.status(400).json({ success: false, error: 'Fields must be an array' });
    return;
  }

  const extractedData = await ExtractedData.findOne({
    documentId: new mongoose.Types.ObjectId(documentId),
    organizationId: orgId,
  });

  if (!extractedData) {
    res.status(404).json({ success: false, error: 'Extracted data record not found' });
    return;
  }

  const fieldChanges: Array<{ fieldKey: string; oldValue: any; newValue: any }> = [];

  fields.forEach((update) => {
    const existingField = extractedData.fields.find((f) => f.key === update.key);
    if (existingField) {
      if (existingField.value !== update.value) {
        fieldChanges.push({
          fieldKey: update.key,
          oldValue: existingField.value,
          newValue: update.value,
        });
        existingField.editedValue = update.value;
        existingField.isEdited = true;
        existingField.value = update.value;
      }
      if (update.status) {
        existingField.status = update.status;
      }
    }
  });

  await extractedData.save();

  await logActivity({
    organizationId: orgId,
    userId,
    action: 'extraction',
    documentId: new mongoose.Types.ObjectId(documentId),
    details: { changesCount: fieldChanges.length, fieldChanges },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Extracted fields updated successfully',
    data: extractedData,
  });
};

export const submitExtractionReview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const documentId = req.params.documentId as string;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const userId = new mongoose.Types.ObjectId(req.userId);
  const { action, notes } = req.body; // 'approve' | 'reject' | 'request_changes'

  if (!['approve', 'reject', 'request_changes'].includes(action)) {
    res.status(400).json({ success: false, error: 'Invalid review action' });
    return;
  }

  // Update Review model
  await Review.create({
    documentId: new mongoose.Types.ObjectId(documentId),
    organizationId: orgId,
    reviewerId: userId,
    action,
    notes: notes || '',
    fieldChanges: [],
  });

  // Advance or reject in workflow engine
  const execution = await WorkflowEngine.submitReviewDecision({
    documentId,
    organizationId: orgId,
    userId,
    action,
    notes,
  });

  await logActivity({
    organizationId: orgId,
    userId,
    action: action === 'approve' ? 'approval' : action === 'reject' ? 'rejection' : 'review',
    documentId: new mongoose.Types.ObjectId(documentId),
    details: { action, notes },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: `Document review decision '${action}' submitted successfully.`,
    data: execution,
  });
};
