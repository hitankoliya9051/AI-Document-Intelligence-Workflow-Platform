import { Router } from 'express';
import {
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getWorkflowExecution,
} from '../controllers/workflowController';
import { authenticate, requireOrganization, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authenticate, asyncHandler(requireOrganization));

router.get('/', asyncHandler(getWorkflows));
router.post('/', requireRole(['owner', 'admin']), asyncHandler(createWorkflow));
router.get('/:id', asyncHandler(getWorkflowById));
router.patch('/:id', requireRole(['owner', 'admin']), asyncHandler(updateWorkflow));
router.delete('/:id', requireRole(['owner', 'admin']), asyncHandler(deleteWorkflow));
router.get('/execution/:documentId', asyncHandler(getWorkflowExecution));

export default router;
