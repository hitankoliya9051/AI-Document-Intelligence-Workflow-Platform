import { Router } from 'express';
import {
  getUserOrganizations,
  createOrganization,
  getCurrentOrganization,
  inviteMember,
  updateMemberRole,
  removeMember,
} from '../controllers/organizationController';
import { authenticate, requireOrganization, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(getUserOrganizations));
router.post('/', asyncHandler(createOrganization));
router.get('/current', requireOrganization, asyncHandler(getCurrentOrganization));
router.post('/invite', requireOrganization, requireRole(['owner', 'admin']), asyncHandler(inviteMember));
router.patch('/members/:memberId', requireOrganization, requireRole(['owner', 'admin']), asyncHandler(updateMemberRole));
router.delete('/members/:memberId', requireOrganization, requireRole(['owner', 'admin']), asyncHandler(removeMember));

export default router;
