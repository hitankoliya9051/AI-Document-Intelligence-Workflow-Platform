import { Router } from 'express';
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  downloadDocument,
  previewDocument,
  updateDocument,
  archiveDocument,
  restoreDocument,
  deleteDocument,
  reprocessDocument,
  chatWithDocument,
} from '../controllers/documentController';
import { authenticate, requireOrganization, requireRole } from '../middleware/auth';
import { documentUpload } from '../middleware/upload';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authenticate, asyncHandler(requireOrganization));

router.post('/upload', documentUpload.single('file'), asyncHandler(uploadDocument));
router.post('/', documentUpload.single('file'), asyncHandler(uploadDocument));
router.get('/', asyncHandler(getDocuments));
router.get('/:id', asyncHandler(getDocumentById));
router.get('/:id/download', asyncHandler(downloadDocument));
router.get('/:id/preview', asyncHandler(previewDocument));
router.patch('/:id', asyncHandler(updateDocument));
router.post('/:id/archive', requireRole(['owner', 'admin']), asyncHandler(archiveDocument));
router.post('/:id/restore', requireRole(['owner', 'admin']), asyncHandler(restoreDocument));
router.delete('/:id', requireRole(['owner', 'admin']), asyncHandler(deleteDocument));
router.post('/:id/process', asyncHandler(reprocessDocument));
router.post('/:id/chat', asyncHandler(chatWithDocument));

export default router;
