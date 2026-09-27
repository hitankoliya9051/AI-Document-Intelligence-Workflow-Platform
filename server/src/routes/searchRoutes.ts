import { Router } from 'express';
import { globalSearch } from '../controllers/searchController';
import { authenticate, requireOrganization } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authenticate, asyncHandler(requireOrganization));

router.get('/', asyncHandler(globalSearch));

export default router;
