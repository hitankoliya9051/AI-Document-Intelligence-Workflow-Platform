import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  DocumentModel,
  ExtractedData,
  Review,
  Organization,
  ActivityLog,
  WorkflowExecution,
} from '../models';

export const getAnalytics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  // 1. Overall counts
  const [
    totalDocs,
    completedDocs,
    reviewRequiredDocs,
    failedDocs,
    processingDocs,
    org,
  ] = await Promise.all([
    DocumentModel.countDocuments({ organizationId: orgId, isArchived: false }),
    DocumentModel.countDocuments({ organizationId: orgId, status: 'completed', isArchived: false }),
    DocumentModel.countDocuments({ organizationId: orgId, status: 'review_required', isArchived: false }),
    DocumentModel.countDocuments({ organizationId: orgId, status: 'failed', isArchived: false }),
    DocumentModel.countDocuments({ organizationId: orgId, status: 'processing', isArchived: false }),
    Organization.findById(orgId),
  ]);

  // 2. Status distribution
  const statusAggregation = await DocumentModel.aggregate([
    { $match: { organizationId: orgId, isArchived: false } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusDistribution: Record<string, number> = {
    uploaded: 0,
    processing: 0,
    completed: 0,
    review_required: 0,
    failed: 0,
  };
  statusAggregation.forEach((s) => {
    if (s._id) statusDistribution[s._id] = s.count;
  });

  // 3. Document types distribution
  const typeAggregation = await DocumentModel.aggregate([
    { $match: { organizationId: orgId, isArchived: false } },
    { $group: { _id: '$documentType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const documentTypeDistribution = typeAggregation.map((t) => ({
    type: t._id || 'general',
    count: t.count,
  }));

  // 4. Uploads trend over last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const uploadsTrend = await DocumentModel.aggregate([
    {
      $match: {
        organizationId: orgId,
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // 5. Extraction accuracy & average confidence score
  const confidenceAgg = await DocumentModel.aggregate([
    {
      $match: {
        organizationId: orgId,
        confidenceScore: { $gt: 0 },
        isArchived: false,
      },
    },
    {
      $group: {
        _id: null,
        avgConfidence: { $avg: '$confidenceScore' },
        totalConfidenceScored: { $sum: 1 },
      },
    },
  ]);

  const avgConfidence = confidenceAgg[0]?.avgConfidence
    ? parseFloat(confidenceAgg[0].avgConfidence.toFixed(2))
    : 0.91;

  // 6. Review & Approval metrics
  const [totalReviews, approvedReviews, rejectedReviews] = await Promise.all([
    Review.countDocuments({ organizationId: orgId }),
    Review.countDocuments({ organizationId: orgId, action: 'approve' }),
    Review.countDocuments({ organizationId: orgId, action: 'reject' }),
  ]);

  const reviewApprovalRate = totalReviews > 0
    ? parseFloat(((approvedReviews / totalReviews) * 100).toFixed(1))
    : 100;

  // 7. Recent uploads
  const recentUploads = await DocumentModel.find({
    organizationId: orgId,
    isArchived: false,
  })
    .populate('uploadedBy', 'name email avatar')
    .sort({ createdAt: -1 })
    .limit(6);

  // 8. Recent activity
  const recentActivity = await ActivityLog.find({ organizationId: orgId })
    .populate('userId', 'name email avatar')
    .populate('documentId', 'title originalName')
    .sort({ createdAt: -1 })
    .limit(8);

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalDocuments: totalDocs,
        completedDocuments: completedDocs,
        reviewRequiredDocuments: reviewRequiredDocs,
        failedDocuments: failedDocs,
        processingDocuments: processingDocs,
        storageUsed: org?.storageUsed || 0,
        storageLimit: org?.storageLimit || 5 * 1024 * 1024 * 1024,
        storagePercentage: org
          ? parseFloat(((org.storageUsed / org.storageLimit) * 100).toFixed(2))
          : 0,
        avgConfidenceScore: avgConfidence,
        totalReviews,
        reviewApprovalRate,
      },
      statusDistribution,
      documentTypeDistribution,
      uploadsTrend: uploadsTrend.map((u) => ({ date: u._id, count: u.count })),
      recentUploads,
      recentActivity,
    },
  });
};
