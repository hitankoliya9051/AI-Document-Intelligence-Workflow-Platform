import { Router } from 'express';
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
} from '../controllers/folderController';
import { authenticate, requireOrganization } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authenticate, asyncHandler(requireOrganization));

router.get('/', asyncHandler(getFolders));
router.post('/', asyncHandler(createFolder));
router.patch('/:id', asyncHandler(updateFolder));
router.delete('/:id', asyncHandler(deleteFolder));

export default router;
