import { Router } from 'express';
import {
  getSettings,
  updateProfile,
  updateOrganizationSettings,
  getAIStatus,
} from '../controllers/settingsController';
import { authenticate, requireOrganization, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authenticate);

router.get('/', requireOrganization, asyncHandler(getSettings));
router.patch('/profile', asyncHandler(updateProfile));
router.patch('/organization', requireOrganization, requireRole(['owner', 'admin']), asyncHandler(updateOrganizationSettings));
router.get('/ai-status', asyncHandler(getAIStatus));

export default router;
