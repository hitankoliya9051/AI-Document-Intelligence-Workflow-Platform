import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { User, Organization } from '../models';
import { config } from '../config';
import { getAIService } from '../services/ai';
import { logActivity } from '../services/activityLogger';

export const getSettings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const user = req.user!;
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const org = await Organization.findById(orgId);
  const aiService = getAIService();

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        settings: user.settings,
      },
      organization: org,
      aiProvider: {
        currentProvider: aiService.providerName,
        isDemoMode: aiService.isDemoMode,
        configuredProvider: config.ai.provider,
        hasGeminiKey: !!config.ai.geminiApiKey,
        hasOpenaiKey: !!config.ai.openaiApiKey,
      },
      storage: {
        provider: config.storage.provider,
        maxFileSizeMb: config.storage.maxFileSizeMb,
        storageUsed: org?.storageUsed || 0,
        storageLimit: org?.storageLimit || 0,
      },
    },
  });
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const user = req.user!;
  const { name, avatar, settings } = req.body;

  if (name) user.name = name.trim();
  if (avatar !== undefined) user.avatar = avatar;
  if (settings) {
    user.settings = { ...user.settings, ...settings };
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile settings updated successfully',
    data: user.toJSON(),
  });
};

export const updateOrganizationSettings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const { name, allowedDocTypes, maxFileSizeMb, autoTriggerWorkflow, requireReviewForConfidenceBelow } =
    req.body;

  const org = await Organization.findById(orgId);
  if (!org) {
    res.status(404).json({ success: false, error: 'Organization not found' });
    return;
  }

  if (name) org.name = name.trim();
  if (allowedDocTypes && Array.isArray(allowedDocTypes)) {
    org.settings.allowedDocTypes = allowedDocTypes;
  }
  if (maxFileSizeMb !== undefined) {
    org.settings.maxFileSizeMb = Number(maxFileSizeMb);
  }
  if (autoTriggerWorkflow !== undefined) {
    org.settings.autoTriggerWorkflow = !!autoTriggerWorkflow;
  }
  if (requireReviewForConfidenceBelow !== undefined) {
    org.settings.requireReviewForConfidenceBelow = Number(requireReviewForConfidenceBelow);
  }

  await org.save();

  await logActivity({
    organizationId: orgId,
    userId: req.userId!,
    action: 'settings_update',
    details: { event: 'organization_settings_updated' },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Organization settings updated successfully',
    data: org,
  });
};

export const getAIStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const aiService = getAIService();

  res.status(200).json({
    success: true,
    data: {
      provider: aiService.providerName,
      isDemoMode: aiService.isDemoMode,
      notice: aiService.isDemoMode
        ? 'Running in safe Development & Demo mode. Offline regex/heuristic analyzer is active.'
        : `Connected to ${aiService.providerName.toUpperCase()} live models.`,
      supportedOperations: [
        'Multi-format Parsing (PDF, DOCX, XLSX, CSV, Images, TXT)',
        'Key-Value Field & Entity Extraction',
        'Document Classification & Automatic Tagging',
        'Executive Summarization & Bullet Highlighting',
        'Interactive In-Document Q&A Chat with Citations',
      ],
    },
  });
};
