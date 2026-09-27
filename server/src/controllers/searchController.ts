import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { DocumentModel, ExtractedData, Tag } from '../models';

export const globalSearch = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const {
    q,
    documentType,
    status,
    tagId,
    folderId,
    dateFrom,
    dateTo,
    minConfidence,
    page = '1',
    limit = '20',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query as Record<string, string>;

  const query: any = {
    organizationId: orgId,
    isArchived: false,
  };

  if (documentType) {
    query.documentType = documentType;
  }

  if (status) {
    query.status = status;
  }

  if (folderId) {
    query.folderId = folderId === 'root' ? null : new mongoose.Types.ObjectId(folderId);
  }

  if (tagId) {
    query.tags = new mongoose.Types.ObjectId(tagId);
  }

  if (minConfidence) {
    query.confidenceScore = { $gte: parseFloat(minConfidence) };
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  // Text / keyword match
  if (q && q.trim()) {
    const trimmed = q.trim();
    // Also search extracted fields from ExtractedData
    const matchingExtractions = await ExtractedData.find({
      organizationId: orgId,
      $or: [
        { 'fields.label': { $regex: trimmed, $options: 'i' } },
        { 'fields.value': { $regex: trimmed, $options: 'i' } },
        { 'entities.text': { $regex: trimmed, $options: 'i' } },
      ],
    }).select('documentId');

    const extractionDocIds = matchingExtractions.map((e) => e.documentId);

    query.$or = [
      { title: { $regex: trimmed, $options: 'i' } },
      { originalName: { $regex: trimmed, $options: 'i' } },
      { description: { $regex: trimmed, $options: 'i' } },
      { extractedText: { $regex: trimmed, $options: 'i' } },
      { summary: { $regex: trimmed, $options: 'i' } },
      ...(extractionDocIds.length > 0 ? [{ _id: { $in: extractionDocIds } }] : []),
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
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

  // Generate highlight snippets for matches
  const resultsWithHighlights = documents.map((doc) => {
    let snippet = '';
    if (q && q.trim()) {
      const needle = q.trim().toLowerCase();
      const text = doc.extractedText || doc.summary || '';
      const idx = text.toLowerCase().indexOf(needle);
      if (idx !== -1) {
        const start = Math.max(0, idx - 40);
        const end = Math.min(text.length, idx + needle.length + 60);
        snippet = (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');
      } else {
        snippet = (doc.summary || doc.description || '').slice(0, 140);
      }
    } else {
      snippet = (doc.summary || doc.description || '').slice(0, 140);
    }

    return {
      document: doc,
      snippet,
    };
  });

  res.status(200).json({
    success: true,
    data: resultsWithHighlights,
    query: {
      q,
      documentType,
      status,
    },
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
};
