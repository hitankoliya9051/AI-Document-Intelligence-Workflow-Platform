import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { Comment, DocumentModel } from '../models';
import { logActivity } from '../services/activityLogger';
import { createNotification } from '../services/notificationService';

export const getComments = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const documentId = req.params.documentId as string;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const comments = await Comment.find({
    documentId: new mongoose.Types.ObjectId(documentId),
    organizationId: orgId,
  })
    .populate('authorId', 'name email avatar')
    .sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    data: comments,
  });
};

export const createComment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { documentId } = req.params;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const userId = new mongoose.Types.ObjectId(req.userId);
  const { content, text, parentCommentId } = req.body;
  const commentContent = (content || text || '').trim();

  if (!commentContent) {
    res.status(400).json({ success: false, error: 'Comment content is required' });
    return;
  }

  const document = await DocumentModel.findOne({
    _id: documentId,
    organizationId: orgId,
  });

  if (!document) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }

  const comment = await Comment.create({
    documentId: document._id,
    organizationId: orgId,
    authorId: userId,
    content: commentContent,
    parentCommentId: parentCommentId ? new mongoose.Types.ObjectId(parentCommentId) : null,
  });

  await comment.populate('authorId', 'name email avatar');

  // Notify document uploader if commenter is someone else
  if (document.uploadedBy.toString() !== userId.toString()) {
    await createNotification({
      userId: document.uploadedBy,
      organizationId: orgId,
      title: 'New Comment on Document',
      message: `${req.user!.name} commented on "${document.title}": "${content.slice(0, 80)}"`,
      type: 'comment_added',
      documentId: document._id,
      link: `/documents/${document._id}`,
    });
  }

  await logActivity({
    organizationId: orgId,
    userId,
    action: 'comment',
    documentId: document._id,
    details: { commentId: comment._id },
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: 'Comment posted successfully',
    data: comment,
  });
};

export const updateComment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const userId = new mongoose.Types.ObjectId(req.userId);
  const { content } = req.body;

  if (!content || !content.trim()) {
    res.status(400).json({ success: false, error: 'Comment content is required' });
    return;
  }

  const comment = await Comment.findOne({
    _id: id,
    organizationId: orgId,
  });

  if (!comment) {
    res.status(404).json({ success: false, error: 'Comment not found' });
    return;
  }

  // Only author or admin/owner can edit
  if (comment.authorId.toString() !== userId.toString() && !['owner', 'admin'].includes(req.membershipRole || '')) {
    res.status(403).json({ success: false, error: 'You can only edit your own comments' });
    return;
  }

  comment.content = content.trim();
  comment.isEdited = true;
  await comment.save();
  await comment.populate('authorId', 'name email avatar');

  res.status(200).json({
    success: true,
    message: 'Comment updated successfully',
    data: comment,
  });
};

export const deleteComment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const userId = new mongoose.Types.ObjectId(req.userId);

  const comment = await Comment.findOne({
    _id: id,
    organizationId: orgId,
  });

  if (!comment) {
    res.status(404).json({ success: false, error: 'Comment not found' });
    return;
  }

  if (comment.authorId.toString() !== userId.toString() && !['owner', 'admin'].includes(req.membershipRole || '')) {
    res.status(403).json({ success: false, error: 'You can only delete your own comments' });
    return;
  }

  await Comment.deleteOne({ _id: comment._id });

  res.status(200).json({
    success: true,
    message: 'Comment deleted successfully',
  });
};
