import { Router } from 'express';
import {
  getReviewQueue,
  submitReviewDecision,
} from '../controllers/reviewController';
import { authenticate, requireOrganization, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authenticate, asyncHandler(requireOrganization));

router.get('/queue', asyncHandler(getReviewQueue));
router.post('/:documentId', requireRole(['owner', 'admin', 'reviewer']), asyncHandler(submitReviewDecision));

export default router;
