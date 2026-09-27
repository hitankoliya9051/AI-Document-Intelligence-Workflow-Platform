import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { Folder, DocumentModel } from '../models';

export const getFolders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const folders = await Folder.find({ organizationId: orgId }).sort({ name: 1 });

  // Compute document count for each folder
  const folderCounts = await DocumentModel.aggregate([
    { $match: { organizationId: orgId, isArchived: false, folderId: { $ne: null } } },
    { $group: { _id: '$folderId', count: { $sum: 1 } } },
  ]);

  const countMap = new Map(folderCounts.map((fc) => [fc._id.toString(), fc.count]));

  // Also count root documents
  const rootCount = await DocumentModel.countDocuments({
    organizationId: orgId,
    folderId: null,
    isArchived: false,
  });

  const foldersWithCounts = folders.map((f) => ({
    ...f.toObject(),
    documentCount: countMap.get(f._id.toString()) || 0,
  }));

  res.status(200).json({
    success: true,
    data: {
      folders: foldersWithCounts,
      rootDocumentCount: rootCount,
    },
  });
};

export const createFolder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const userId = new mongoose.Types.ObjectId(req.userId);
  const { name, parentFolderId, color } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ success: false, error: 'Folder name is required' });
    return;
  }

  const folder = await Folder.create({
    name: name.trim(),
    parentFolderId: parentFolderId ? new mongoose.Types.ObjectId(parentFolderId) : null,
    organizationId: orgId,
    createdBy: userId,
    color: color || '#6366f1',
  });

  res.status(201).json({
    success: true,
    message: 'Folder created successfully',
    data: folder,
  });
};

export const updateFolder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const { name, color, parentFolderId } = req.body;

  const folder = await Folder.findOne({ _id: id, organizationId: orgId });
  if (!folder) {
    res.status(404).json({ success: false, error: 'Folder not found' });
    return;
  }

  if (name) folder.name = name.trim();
  if (color) folder.color = color;
  if (parentFolderId !== undefined) {
    folder.parentFolderId = parentFolderId ? new mongoose.Types.ObjectId(parentFolderId) : null;
  }

  await folder.save();

  res.status(200).json({
    success: true,
    message: 'Folder updated successfully',
    data: folder,
  });
};

export const deleteFolder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const folder = await Folder.findOne({ _id: id, organizationId: orgId });
  if (!folder) {
    res.status(404).json({ success: false, error: 'Folder not found' });
    return;
  }

  // Move child documents to parent folder or root
  await DocumentModel.updateMany(
    { folderId: folder._id, organizationId: orgId },
    { folderId: folder.parentFolderId || null }
  );

  // Move child folders up
  await Folder.updateMany(
    { parentFolderId: folder._id, organizationId: orgId },
    { parentFolderId: folder.parentFolderId || null }
  );

  await Folder.deleteOne({ _id: folder._id });

  res.status(200).json({
    success: true,
    message: 'Folder deleted and contents moved up successfully',
  });
};
