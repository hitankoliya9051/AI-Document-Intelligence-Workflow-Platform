import { Router } from 'express';
import {
  register,
  login,
  getCurrentUser,
  switchOrganization,
  forgotPassword,
  resetPassword,
  logout,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.post('/register',       authRateLimiter, asyncHandler(register));
router.post('/login',          authRateLimiter, asyncHandler(login));
router.get('/me',              authenticate,    asyncHandler(getCurrentUser));
router.post('/switch-org',     authenticate,    asyncHandler(switchOrganization));
router.post('/forgot-password',authRateLimiter, asyncHandler(forgotPassword));
router.post('/reset-password', authRateLimiter, asyncHandler(resetPassword));
router.post('/logout',         authenticate,    asyncHandler(logout));

export default router;
