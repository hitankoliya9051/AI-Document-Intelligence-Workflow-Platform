import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { Tag, DocumentModel } from '../models';

export const getTags = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const tags = await Tag.find({ organizationId: orgId }).sort({ name: 1 });

  // Get document count for each tag
  const tagCounts = await DocumentModel.aggregate([
    { $match: { organizationId: orgId, isArchived: false } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
  ]);

  const countMap = new Map(tagCounts.map((tc) => [tc._id.toString(), tc.count]));

  const tagsWithCounts = tags.map((t) => ({
    ...t.toObject(),
    documentCount: countMap.get(t._id.toString()) || 0,
  }));

  res.status(200).json({
    success: true,
    data: tagsWithCounts,
  });
};

export const createTag = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const userId = new mongoose.Types.ObjectId(req.userId);
  const { name, color } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ success: false, error: 'Tag name is required' });
    return;
  }

  const existing = await Tag.findOne({ organizationId: orgId, name: name.trim() });
  if (existing) {
    res.status(400).json({ success: false, error: 'A tag with this name already exists' });
    return;
  }

  const tag = await Tag.create({
    name: name.trim(),
    color: color || '#3b82f6',
    organizationId: orgId,
    createdBy: userId,
  });

  res.status(201).json({
    success: true,
    message: 'Tag created successfully',
    data: tag,
  });
};

export const deleteTag = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const tag = await Tag.findOne({ _id: id, organizationId: orgId });
  if (!tag) {
    res.status(404).json({ success: false, error: 'Tag not found' });
    return;
  }

  // Remove tag reference from documents
  await DocumentModel.updateMany(
    { organizationId: orgId, tags: tag._id },
    { $pull: { tags: tag._id } }
  );

  await Tag.deleteOne({ _id: tag._id });

  res.status(200).json({
    success: true,
    message: 'Tag deleted successfully',
  });
};
