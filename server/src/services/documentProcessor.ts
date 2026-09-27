import mongoose from 'mongoose';
import {
  DocumentModel,
  ExtractedData,
  Tag,
  Organization,
} from '../models';
import { getStorageService } from './storage';
import { DocumentParserService } from './parser/documentParser';
import { getAIService } from './ai';
import { WorkflowEngine } from './workflowEngine';
import { createNotification } from './notificationService';
import { logActivity } from './activityLogger';

export class DocumentProcessor {
  /**
   * Complete end-to-end processing pipeline for an uploaded document
   */
  static async processDocument(documentId: string | mongoose.Types.ObjectId): Promise<void> {
    const docId = new mongoose.Types.ObjectId(documentId);
    const document = await DocumentModel.findById(docId);

    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    try {
      // 1. Mark status as processing
      document.status = 'processing';
      document.processingError = undefined;
      await document.save();

      await logActivity({
        organizationId: document.organizationId,
        userId: document.uploadedBy,
        action: 'processing_started',
        documentId: document._id,
        details: { fileName: document.originalName },
      });

      // 2. Fetch file content from storage abstraction
      const storage = getStorageService();
      const fileBuffer = await storage.getFileBuffer(document.storageKey);

      // 3. Extract text, word count, page count, and embedded tables
      const parsed = await DocumentParserService.parse(
        fileBuffer,
        document.originalName,
        document.mimeType
      );

      // 4. AI Document Analysis (or safe fallback demo engine)
      const aiService = getAIService();

      const [classification, summaryRes, extractionRes] = await Promise.all([
        aiService.classify(parsed.text, document.title),
        aiService.summarize(parsed.text, document.title),
        aiService.extractStructuredData(parsed.text, document.documentType, parsed.tables),
      ]);

      // 5. Handle automatic tagging based on AI classification tags
      const tagIds: mongoose.Types.ObjectId[] = [...(document.tags || [])];
      for (const tagName of classification.tags) {
        let tag = await Tag.findOne({
          organizationId: document.organizationId,
          name: tagName,
        });

        if (!tag) {
          tag = await Tag.create({
            name: tagName,
            organizationId: document.organizationId,
            createdBy: document.uploadedBy,
            color: '#6366f1',
          });
        }

        if (!tagIds.some((id) => id.toString() === tag!._id.toString())) {
          tagIds.push(tag._id as mongoose.Types.ObjectId);
        }
      }

      // 6. Save or update ExtractedData
      await ExtractedData.findOneAndUpdate(
        { documentId: document._id },
        {
          documentId: document._id,
          organizationId: document.organizationId,
          fields: extractionRes.fields,
          tables: extractionRes.tables || parsed.tables || [],
          entities: extractionRes.entities,
          reviewStatus: 'pending',
          isDemoMode: extractionRes.isDemoMode,
        },
        { upsert: true, new: true }
      );

      // 7. Update Document model with all extracted intelligence
      document.extractedText = parsed.text;
      document.wordCount = parsed.wordCount;
      document.pageCount = parsed.pageCount;
      document.summary = summaryRes.summary;
      document.documentType = classification.documentType || document.documentType;
      document.confidenceScore = extractionRes.confidenceScore;
      document.tags = tagIds;
      if (parsed.metadata) {
        document.metadata = { ...(document.metadata || {}), ...parsed.metadata };
      }
      await document.save();

      // 8. Progress Document Workflow through WorkflowEngine
      await WorkflowEngine.advanceAfterProcessing(document._id, extractionRes.confidenceScore);

      // 9. Send success notification to uploader
      await createNotification({
        userId: document.uploadedBy,
        organizationId: document.organizationId,
        title: 'Document Processed',
        message: `Analysis completed for "${document.title}". Confidence score: ${(extractionRes.confidenceScore * 100).toFixed(0)}%.`,
        type: 'processing_completed',
        documentId: document._id,
        link: `/documents/${document._id}`,
      });

      // 10. Audit log
      await logActivity({
        organizationId: document.organizationId,
        userId: document.uploadedBy,
        action: 'processing_completed',
        documentId: document._id,
        details: {
          wordCount: parsed.wordCount,
          fieldsExtracted: extractionRes.fields.length,
          confidenceScore: extractionRes.confidenceScore,
          isDemoMode: extractionRes.isDemoMode,
        },
      });

      console.log(`Document [${document._id}] (${document.title}) processed successfully.`);
    } catch (error: any) {
      console.error(`Document processing failed for ${documentId}:`, error);

      document.status = 'failed';
      document.processingError = error.message || 'Unknown processing error';
      await document.save();

      await createNotification({
        userId: document.uploadedBy,
        organizationId: document.organizationId,
        title: 'Processing Failed',
        message: `Failed to process document "${document.title}": ${document.processingError}`,
        type: 'processing_failed',
        documentId: document._id,
        link: `/documents/${document._id}`,
      });

      await logActivity({
        organizationId: document.organizationId,
        userId: document.uploadedBy,
        action: 'processing_failed',
        documentId: document._id,
        details: { error: document.processingError },
      });
    }
  }
}
