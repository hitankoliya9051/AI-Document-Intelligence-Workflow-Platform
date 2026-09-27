import { Router } from 'express';
import {
  getExtractedData,
  updateExtractedFields,
  submitExtractionReview,
} from '../controllers/extractionController';
import { authenticate, requireOrganization } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authenticate, asyncHandler(requireOrganization));

router.get('/:documentId', asyncHandler(getExtractedData));
router.patch('/:documentId/fields', asyncHandler(updateExtractedFields));
router.post('/:documentId/review', asyncHandler(submitExtractionReview));

export default router;
