import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { Workflow, WorkflowExecution } from '../models';
import { logActivity } from '../services/activityLogger';

export const getWorkflows = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const workflows = await Workflow.find({ organizationId: orgId }).sort({ isDefault: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    data: workflows,
  });
};

export const getWorkflowById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const workflow = await Workflow.findOne({ _id: id, organizationId: orgId });
  if (!workflow) {
    res.status(404).json({ success: false, error: 'Workflow not found' });
    return;
  }

  res.status(200).json({
    success: true,
    data: workflow,
  });
};

export const createWorkflow = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const userId = new mongoose.Types.ObjectId(req.userId);
  const { name, description, triggerType, triggerDocTypes, steps, isDefault } = req.body;

  if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
    res.status(400).json({ success: false, error: 'Name and steps are required' });
    return;
  }

  if (isDefault) {
    // Unset other defaults
    await Workflow.updateMany({ organizationId: orgId }, { isDefault: false });
  }

  const workflow = await Workflow.create({
    name,
    description: description || '',
    organizationId: orgId,
    triggerType: triggerType || 'on_upload',
    triggerDocTypes: triggerDocTypes || [],
    steps: steps.map((s, idx) => ({
      stepNumber: idx + 1,
      name: s.name,
      description: s.description || '',
      type: s.type,
      assignedRole: s.assignedRole || 'reviewer',
      requiredApprovals: s.requiredApprovals || 1,
      autoApproveConfidenceThreshold: s.autoApproveConfidenceThreshold || 0.95,
    })),
    isDefault: !!isDefault,
    isActive: true,
    createdBy: userId,
  });

  await logActivity({
    organizationId: orgId,
    userId,
    action: 'workflow_change',
    details: { event: 'workflow_created', workflowName: workflow.name },
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: 'Workflow created successfully',
    data: workflow,
  });
};

export const updateWorkflow = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const userId = new mongoose.Types.ObjectId(req.userId);
  const { name, description, steps, isActive, isDefault } = req.body;

  const workflow = await Workflow.findOne({ _id: id, organizationId: orgId });
  if (!workflow) {
    res.status(404).json({ success: false, error: 'Workflow not found' });
    return;
  }

  if (isDefault) {
    await Workflow.updateMany({ organizationId: orgId, _id: { $ne: workflow._id } }, { isDefault: false });
    workflow.isDefault = true;
  }

  if (name) workflow.name = name;
  if (description !== undefined) workflow.description = description;
  if (isActive !== undefined) workflow.isActive = isActive;
  if (steps && Array.isArray(steps)) {
    workflow.steps = steps.map((s, idx) => ({
      stepNumber: idx + 1,
      name: s.name,
      description: s.description || '',
      type: s.type,
      assignedRole: s.assignedRole || 'reviewer',
      requiredApprovals: s.requiredApprovals || 1,
      autoApproveConfidenceThreshold: s.autoApproveConfidenceThreshold || 0.95,
    }));
  }

  await workflow.save();

  await logActivity({
    organizationId: orgId,
    userId,
    action: 'workflow_change',
    details: { event: 'workflow_updated', workflowName: workflow.name },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Workflow updated successfully',
    data: workflow,
  });
};

export const deleteWorkflow = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const workflow = await Workflow.findOne({ _id: id, organizationId: orgId });
  if (!workflow) {
    res.status(404).json({ success: false, error: 'Workflow not found' });
    return;
  }

  if (workflow.isDefault) {
    res.status(400).json({
      success: false,
      error: 'Cannot delete the default organization workflow. Set another default first.',
    });
    return;
  }

  await Workflow.deleteOne({ _id: workflow._id });

  res.status(200).json({
    success: true,
    message: 'Workflow deleted successfully',
  });
};

export const getWorkflowExecution = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const documentId = req.params.documentId as string;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const execution = await WorkflowExecution.findOne({
    documentId: new mongoose.Types.ObjectId(documentId),
    organizationId: orgId,
  })
    .populate('workflowId')
    .populate('history.actorId', 'name email avatar');

  if (!execution) {
    res.status(404).json({ success: false, error: 'No workflow execution found for this document' });
    return;
  }

  res.status(200).json({
    success: true,
    data: execution,
  });
};
