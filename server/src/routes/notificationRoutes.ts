import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController';
import { authenticate, requireOrganization } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authenticate, asyncHandler(requireOrganization));

router.get('/', asyncHandler(getNotifications));
router.patch('/:id/read', asyncHandler(markAsRead));
router.post('/read-all', asyncHandler(markAllAsRead));

export default router;
