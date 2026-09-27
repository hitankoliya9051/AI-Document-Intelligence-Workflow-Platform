import { Router } from 'express';
import { getTags, createTag, deleteTag } from '../controllers/tagController';
import { authenticate, requireOrganization } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authenticate, asyncHandler(requireOrganization));

router.get('/', asyncHandler(getTags));
router.post('/', asyncHandler(createTag));
router.delete('/:id', asyncHandler(deleteTag));

export default router;
