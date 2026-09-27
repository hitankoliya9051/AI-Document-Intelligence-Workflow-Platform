import { Router } from 'express';
import authRoutes from './authRoutes';
import documentRoutes from './documentRoutes';
import extractionRoutes from './extractionRoutes';
import reviewRoutes from './reviewRoutes';
import workflowRoutes from './workflowRoutes';
import folderRoutes from './folderRoutes';
import tagRoutes from './tagRoutes';
import commentRoutes from './commentRoutes';
import notificationRoutes from './notificationRoutes';
import activityRoutes from './activityRoutes';
import analyticsRoutes from './analyticsRoutes';
import organizationRoutes from './organizationRoutes';
import settingsRoutes from './settingsRoutes';
import searchRoutes from './searchRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/extractions', extractionRoutes);
router.use('/reviews', reviewRoutes);
router.use('/workflows', workflowRoutes);
router.use('/folders', folderRoutes);
router.use('/tags', tagRoutes);
router.use('/comments', commentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activities', activityRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/organizations', organizationRoutes);
router.use('/settings', settingsRoutes);
router.use('/search', searchRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'docintel-api',
  });
});

export default router;
