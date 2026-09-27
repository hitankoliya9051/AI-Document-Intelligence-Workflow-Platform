import { Router } from 'express';
import { getActivities } from '../controllers/activityController';
import { authenticate, requireOrganization } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authenticate, asyncHandler(requireOrganization));

router.get('/', asyncHandler(getActivities));

export default router;
