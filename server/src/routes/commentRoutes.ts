import { Router } from 'express';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/commentController';
import { authenticate, requireOrganization } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authenticate, asyncHandler(requireOrganization));

router.get('/:documentId', asyncHandler(getComments));
router.post('/:documentId', asyncHandler(createComment));
router.patch('/:id', asyncHandler(updateComment));
router.delete('/:id', asyncHandler(deleteComment));

export default router;
