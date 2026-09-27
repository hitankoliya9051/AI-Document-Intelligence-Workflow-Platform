import { Router } from 'express';
import { getAnalytics } from '../controllers/analyticsController';
import { authenticate, requireOrganization } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authenticate, asyncHandler(requireOrganization));

router.get('/', asyncHandler(getAnalytics));

export default router;
