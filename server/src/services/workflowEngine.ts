import mongoose from 'mongoose';
import {
  Workflow,
  WorkflowExecution,
  IWorkflow,
  IWorkflowExecution,
  DocumentModel,
  ExtractedData,
  Organization,
} from '../models';
import { createNotification, notifyOrganizationRoles } from './notificationService';
import { logActivity } from './activityLogger';

export class WorkflowEngine {
  /**
   * Initializes and starts a workflow for a newly uploaded document
   */
  static async startWorkflow(
    documentId: string | mongoose.Types.ObjectId,
    organizationId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId,
    workflowId?: string | mongoose.Types.ObjectId
  ): Promise<IWorkflowExecution | null> {
    const docId = new mongoose.Types.ObjectId(documentId);
    const orgId = new mongoose.Types.ObjectId(organizationId);

    // Find default or specified workflow
    let workflow: IWorkflow | null = null;
    if (workflowId) {
      workflow = await Workflow.findOne({ _id: workflowId, organizationId: orgId, isActive: true });
    } else {
      workflow = await Workflow.findOne({ organizationId: orgId, isDefault: true, isActive: true });
      if (!workflow) {
        workflow = await Workflow.findOne({ organizationId: orgId, isActive: true });
      }
    }

    if (!workflow || workflow.steps.length === 0) {
      // Create a default standard workflow if none exists
      workflow = await this.createDefaultWorkflow(orgId, userId);
    }

    const firstStep = workflow.steps[0];

    const execution = await WorkflowExecution.create({
      documentId: docId,
      workflowId: workflow._id,
      organizationId: orgId,
      currentStepNumber: firstStep.stepNumber,
      currentStepName: firstStep.name,
      status: 'in_progress',
      history: [
        {
          stepNumber: firstStep.stepNumber,
          stepName: firstStep.name,
          stepType: firstStep.type,
          action: 'started',
          actorId: new mongoose.Types.ObjectId(userId),
          timestamp: new Date(),
          notes: `Workflow '${workflow.name}' initialized.`,
        },
      ],
      startedAt: new Date(),
    });

    await DocumentModel.findByIdAndUpdate(docId, {
      workflowId: workflow._id,
      currentWorkflowStep: firstStep.stepNumber,
    });

    return execution;
  }

  /**
   * Advances the workflow to the next step after automated processing
   */
  static async advanceAfterProcessing(
    documentId: string | mongoose.Types.ObjectId,
    confidenceScore: number
  ): Promise<void> {
    const execution = await WorkflowExecution.findOne({
      documentId,
      status: 'in_progress',
    });

    if (!execution) return;

    const workflow = await Workflow.findById(execution.workflowId);
    if (!workflow) return;

    const org = await Organization.findById(execution.organizationId);
    const reviewThreshold = org?.settings?.requireReviewForConfidenceBelow ?? 0.85;

    // Record automated extraction step completed
    const currentStepIndex = workflow.steps.findIndex(
      (s) => s.stepNumber === execution.currentStepNumber
    );

    // Look for next step
    const nextStep = workflow.steps[currentStepIndex + 1];

    if (!nextStep) {
      // Completed all steps
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.history.push({
        stepNumber: execution.currentStepNumber,
        stepName: execution.currentStepName,
        stepType: 'complete',
        action: 'passed',
        timestamp: new Date(),
        notes: 'All workflow steps completed successfully.',
      });
      await execution.save();
      await DocumentModel.findByIdAndUpdate(documentId, { status: 'completed' });
      return;
    }

    // Advance to next step
    execution.currentStepNumber = nextStep.stepNumber;
    execution.currentStepName = nextStep.name;

    const requiresReview =
      nextStep.type === 'review' ||
      nextStep.type === 'approval' ||
      confidenceScore < reviewThreshold;

    if (requiresReview) {
      execution.status = 'pending'; // Waiting for human review
      execution.history.push({
        stepNumber: nextStep.stepNumber,
        stepName: nextStep.name,
        stepType: nextStep.type,
        action: 'started',
        timestamp: new Date(),
        notes: `Awaiting human review (confidence: ${(confidenceScore * 100).toFixed(0)}%, threshold: ${(reviewThreshold * 100).toFixed(0)}%).`,
      });

      await execution.save();
      await DocumentModel.findByIdAndUpdate(documentId, {
        status: 'review_required',
        currentWorkflowStep: nextStep.stepNumber,
      });

      // Notify reviewers & admins
      await notifyOrganizationRoles({
        organizationId: execution.organizationId,
        roles: ['owner', 'admin', 'reviewer'],
        title: 'Review Required',
        message: `Document requires review in step '${nextStep.name}'`,
        type: 'review_required',
        documentId: documentId.toString(),
        link: `/documents/${documentId}`,
      });
    } else {
      // Auto-approved / complete
      execution.history.push({
        stepNumber: nextStep.stepNumber,
        stepName: nextStep.name,
        stepType: nextStep.type,
        action: 'approved',
        timestamp: new Date(),
        notes: `High confidence score (${(confidenceScore * 100).toFixed(0)}%) met auto-approval criteria.`,
      });

      // Check if subsequent steps exist
      const finalStep = workflow.steps[currentStepIndex + 2];
      if (!finalStep) {
        execution.status = 'completed';
        execution.completedAt = new Date();
        await DocumentModel.findByIdAndUpdate(documentId, { status: 'completed' });
      }

      await execution.save();
    }
  }

  /**
   * Applies human review action (approve, reject, request_changes)
   */
  static async submitReviewDecision(params: {
    documentId: string | mongoose.Types.ObjectId;
    userId: string | mongoose.Types.ObjectId;
    organizationId: string | mongoose.Types.ObjectId;
    action: 'approve' | 'reject' | 'request_changes';
    notes?: string;
  }): Promise<IWorkflowExecution | null> {
    const docId = new mongoose.Types.ObjectId(params.documentId);
    const userId = new mongoose.Types.ObjectId(params.userId);

    const execution = await WorkflowExecution.findOne({
      documentId: docId,
    });

    if (!execution) return null;

    const actionText =
      params.action === 'approve'
        ? 'approved'
        : params.action === 'reject'
        ? 'rejected'
        : 'changes_requested';

    execution.history.push({
      stepNumber: execution.currentStepNumber,
      stepName: execution.currentStepName,
      stepType: 'review',
      action: actionText,
      actorId: userId,
      timestamp: new Date(),
      notes: params.notes || `Reviewer ${params.action}ed document.`,
    });

    if (params.action === 'approve') {
      execution.status = 'completed';
      execution.completedAt = new Date();
      await DocumentModel.findByIdAndUpdate(docId, { status: 'completed' });
      await ExtractedData.findOneAndUpdate(
        { documentId: docId },
        {
          reviewStatus: 'approved',
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewNotes: params.notes || '',
        }
      );

      await createNotification({
        userId,
        organizationId: params.organizationId,
        title: 'Document Approved',
        message: `Document has been approved in workflow review.`,
        type: 'document_approved',
        documentId: docId.toString(),
        link: `/documents/${docId}`,
      });
    } else if (params.action === 'reject') {
      execution.status = 'rejected';
      await DocumentModel.findByIdAndUpdate(docId, { status: 'failed' });
      await ExtractedData.findOneAndUpdate(
        { documentId: docId },
        {
          reviewStatus: 'rejected',
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewNotes: params.notes || '',
        }
      );

      await createNotification({
        userId,
        organizationId: params.organizationId,
        title: 'Document Rejected',
        message: `Document was rejected during workflow review: ${params.notes || 'No reason provided'}`,
        type: 'document_rejected',
        documentId: docId.toString(),
        link: `/documents/${docId}`,
      });
    } else {
      // request changes
      execution.status = 'changes_requested';
      await DocumentModel.findByIdAndUpdate(docId, { status: 'review_required' });
      await ExtractedData.findOneAndUpdate(
        { documentId: docId },
        {
          reviewStatus: 'changes_requested',
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewNotes: params.notes || '',
        }
      );
    }

    await execution.save();
    return execution;
  }

  /**
   * Helper to initialize standard default enterprise workflow
   */
  static async createDefaultWorkflow(
    organizationId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId | string
  ): Promise<IWorkflow> {
    return await Workflow.create({
      name: 'Standard Document Intelligence & Approval',
      description: 'End-to-end ingestion, text parsing, AI entity extraction, review gate, and final completion.',
      organizationId,
      triggerType: 'on_upload',
      isDefault: true,
      isActive: true,
      createdBy: new mongoose.Types.ObjectId(userId),
      steps: [
        {
          stepNumber: 1,
          name: 'Document Upload & Ingestion',
          description: 'Secure file validation, virus scan, and metadata persistence.',
          type: 'upload',
          assignedRole: 'any',
          requiredApprovals: 1,
        },
        {
          stepNumber: 2,
          name: 'AI Extraction & Parsing',
          description: 'Document text parsing, summarization, entity recognition, and structured data generation.',
          type: 'extraction',
          assignedRole: 'any',
          requiredApprovals: 1,
          autoApproveConfidenceThreshold: 0.95,
        },
        {
          stepNumber: 3,
          name: 'Human Verification & Review',
          description: 'Domain expert or reviewer verifies low confidence fields, tags, and amounts.',
          type: 'review',
          assignedRole: 'reviewer',
          requiredApprovals: 1,
        },
        {
          stepNumber: 4,
          name: 'Final Approval & Archive',
          description: 'Executive sign-off and indexing for global semantic search.',
          type: 'complete',
          assignedRole: 'admin',
          requiredApprovals: 1,
        },
      ],
    });
  }
}
