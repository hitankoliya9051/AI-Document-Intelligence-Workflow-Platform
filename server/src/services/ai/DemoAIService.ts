import {
  IAIService,
  AISummaryResult,
  AIClassificationResult,
  AIExtractionResult,
  AIChatMessage,
  AIChatResult,
} from './IAIService';
import { IExtractedField, IExtractedEntity, IExtractedTable } from '../../models';

export class DemoAIService implements IAIService {
  public providerName = 'demo';
  public isDemoMode = true;

  async summarize(text: string, title?: string): Promise<AISummaryResult> {
    const cleaned = text.trim();
    if (!cleaned) {
      return {
        summary: '[Demo Analysis]: Document is empty or could not be decoded.',
        keyPoints: ['No text extracted'],
        confidence: 0.5,
      };
    }

    const sentences = cleaned
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && !s.includes('---'));

    // Top sentences for summary
    const summarySentences = sentences.slice(0, 3);
    const summaryText = summarySentences.length > 0 
      ? summarySentences.join(' ')
      : cleaned.slice(0, 300) + '...';

    // Extract key points
    const keyPoints: string[] = [];
    if (title) keyPoints.push(`Document: ${title}`);
    
    // Look for monetary, dates, or party references
    const amountMatch = cleaned.match(/(?:total|amount|due|balance)[:\s]*([$€£¥]?\s*[\d,]+(?:\.\d{2})?)/i);
    if (amountMatch) keyPoints.push(`Detected financial amount: ${amountMatch[1]}`);

    const dateMatch = cleaned.match(/(?:date|due|effective)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})/i);
    if (dateMatch) keyPoints.push(`Key date: ${dateMatch[1]}`);

    if (keyPoints.length < 3 && sentences.length > 3) {
      keyPoints.push(sentences[3].slice(0, 100));
    }

    return {
      summary: `[Demo Analysis - Offline Rule Engine]: ${summaryText}`,
      keyPoints: keyPoints.length > 0 ? keyPoints : ['Document successfully indexed with offline parser.'],
      confidence: 0.88,
    };
  }

  async classify(text: string, title: string = ''): Promise<AIClassificationResult> {
    const lower = (text + ' ' + title).toLowerCase();

    if (lower.includes('invoice') || lower.includes('bill to') || lower.includes('amount due') || lower.includes('remit payment')) {
      return {
        documentType: 'invoice',
        confidence: 0.94,
        tags: ['Finance', 'Invoice', 'Accounts Payable'],
      };
    }

    if (lower.includes('agreement') || lower.includes('contract') || lower.includes('terms of service') || lower.includes('indemnification')) {
      return {
        documentType: 'contract',
        confidence: 0.92,
        tags: ['Legal', 'Contract', 'Compliance'],
      };
    }

    if (lower.includes('financial') || lower.includes('balance sheet') || lower.includes('statement of operations') || lower.includes('revenue')) {
      return {
        documentType: 'financial_report',
        confidence: 0.89,
        tags: ['Finance', 'Quarterly Report', 'Audit'],
      };
    }

    if (lower.includes('receipt') || lower.includes('payment received') || lower.includes('transaction id')) {
      return {
        documentType: 'receipt',
        confidence: 0.91,
        tags: ['Expenses', 'Receipt'],
      };
    }

    if (lower.includes('resume') || lower.includes('curriculum vitae') || lower.includes('experience') && lower.includes('education')) {
      return {
        documentType: 'resume',
        confidence: 0.87,
        tags: ['HR', 'Candidate', 'Recruiting'],
      };
    }

    return {
      documentType: 'general',
      confidence: 0.75,
      tags: ['General Document'],
    };
  }

  async extractStructuredData(
    text: string,
    documentType: string = 'general',
    existingTables: IExtractedTable[] = []
  ): Promise<AIExtractionResult> {
    const fields: IExtractedField[] = [];
    const entities: IExtractedEntity[] = [];

    // Helper to add field
    const addField = (
      key: string,
      label: string,
      value: any,
      type: IExtractedField['type'],
      confidence: number = 0.92,
      snippet?: string
    ) => {
      if (value !== undefined && value !== null && String(value).trim()) {
        fields.push({
          key,
          label,
          value,
          type,
          confidence,
          isEdited: false,
          status: 'pending',
          sourceLocation: snippet ? { snippet: snippet.slice(0, 120) } : undefined,
        });
      }
    };

    // 1. Title / Subject
    const titleMatch = text.match(/(?:title|subject|re:)\s*[:\-]?\s*([^\n\r]+)/i);
    if (titleMatch) {
      addField('document_title', 'Document Title', titleMatch[1].trim(), 'string', 0.95, titleMatch[0]);
    }

    // 2. Invoice / Reference Number
    const invMatch = text.match(/(?:invoice\s*(?:#|no\.?|num(?:ber)?)?|inv\s*#)\s*[:\-]?\s*([A-Za-z0-9\-_]+)/i) ||
                     text.match(/(?:ref(?:erence)?\s*(?:#|no\.?|id)?)\s*[:\-]?\s*([A-Za-z0-9\-_]+)/i);
    if (invMatch) {
      addField('reference_number', 'Invoice / Reference #', invMatch[1].trim(), 'string', 0.96, invMatch[0]);
      entities.push({ type: 'REFERENCE_ID', text: invMatch[1].trim(), confidence: 0.96 });
    }

    // 3. Issue Date
    const dateMatch = text.match(/(?:issue\s*date|invoice\s*date|date)\s*[:\-]?\s*([A-Za-z0-9\s,\/\-]+?)(?=\s{2,}|\n|$)/i);
    if (dateMatch) {
      addField('issue_date', 'Issue Date', dateMatch[1].trim(), 'date', 0.91, dateMatch[0]);
      entities.push({ type: 'DATE', text: dateMatch[1].trim(), confidence: 0.91 });
    }

    // 4. Due Date
    const dueDateMatch = text.match(/(?:due\s*date|payment\s*due)\s*[:\-]?\s*([A-Za-z0-9\s,\/\-]+?)(?=\s{2,}|\n|$)/i);
    if (dueDateMatch) {
      addField('due_date', 'Due Date', dueDateMatch[1].trim(), 'date', 0.93, dueDateMatch[0]);
    }

    // 5. Total Amount
    const amountMatch = text.match(/(?:total\s*amount|total\s*due|amount\s*due|grand\s*total|balance\s*due|total)\s*[:\-]?\s*([$€£¥₹]?\s*[\d,]+(?:\.\d{2})?)/i);
    if (amountMatch) {
      addField('total_amount', 'Total Amount', amountMatch[1].trim(), 'currency', 0.94, amountMatch[0]);
      entities.push({ type: 'MONEY', text: amountMatch[1].trim(), confidence: 0.94 });
    }

    // 6. Currency
    const currencyMatch = text.match(/\b(USD|EUR|GBP|CAD|AUD|INR|JPY|\$|€|£|₹)\b/i);
    if (currencyMatch) {
      addField('currency', 'Currency', currencyMatch[1].toUpperCase(), 'string', 0.97);
    }

    // 7. Vendor / Company Name
    const vendorMatch = text.match(/(?:from|vendor|provider|company|contractor|seller)\s*[:\-]?\s*([^\n\r,]+)/i);
    if (vendorMatch) {
      addField('vendor_name', 'Vendor / Issuer', vendorMatch[1].trim(), 'string', 0.88, vendorMatch[0]);
      entities.push({ type: 'ORGANIZATION', text: vendorMatch[1].trim(), confidence: 0.88 });
    }

    // 8. Client / Customer Name
    const clientMatch = text.match(/(?:to|bill\s*to|client|customer|buyer)\s*[:\-]?\s*([^\n\r,]+)/i);
    if (clientMatch) {
      addField('customer_name', 'Customer / Recipient', clientMatch[1].trim(), 'string', 0.89, clientMatch[0]);
      entities.push({ type: 'ORGANIZATION', text: clientMatch[1].trim(), confidence: 0.89 });
    }

    // 9. Contact Email
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      addField('contact_email', 'Contact Email', emailMatch[0], 'email', 0.98, emailMatch[0]);
      entities.push({ type: 'EMAIL', text: emailMatch[0], confidence: 0.98 });
    }

    // 10. Phone Number
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) {
      addField('contact_phone', 'Phone Number', phoneMatch[0], 'phone', 0.94, phoneMatch[0]);
      entities.push({ type: 'PHONE', text: phoneMatch[0], confidence: 0.94 });
    }

    // 11. Tax ID / VAT
    const taxMatch = text.match(/(?:tax\s*id|vat\s*(?:no|number)?|ein|gstin)\s*[:\-]?\s*([A-Za-z0-9\-]+)/i);
    if (taxMatch) {
      addField('tax_id', 'Tax ID / VAT', taxMatch[1].trim(), 'string', 0.92, taxMatch[0]);
    }

    // Fallback if sparse fields detected: add generic document type field
    if (fields.length === 0) {
      addField('document_type', 'Document Type', documentType.toUpperCase(), 'string', 0.8);
      addField('document_length', 'Word Count', text.split(/\s+/).length, 'number', 0.99);
    }

    const avgConfidence = fields.reduce((acc, f) => acc + f.confidence, 0) / (fields.length || 1);

    return {
      fields,
      entities,
      tables: existingTables,
      confidenceScore: parseFloat(avgConfidence.toFixed(2)),
      isDemoMode: true,
    };
  }

  async chatWithDocument(
    documentContext: string,
    query: string,
    history: AIChatMessage[] = []
  ): Promise<AIChatResult> {
    const qLower = query.toLowerCase();
    const sentences = documentContext
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    // Score sentences by term overlap
    const queryTokens = qLower.split(/\W+/).filter((t) => t.length > 2);
    const scoredSentences = sentences.map((sentence) => {
      const sLower = sentence.toLowerCase();
      let matchCount = 0;
      queryTokens.forEach((token) => {
        if (sLower.includes(token)) matchCount += 1;
      });
      return { sentence, matchCount };
    });

    scoredSentences.sort((a, b) => b.matchCount - a.matchCount);
    const topMatches = scoredSentences.filter((s) => s.matchCount > 0).slice(0, 3);

    const citations = topMatches.map((m) => m.sentence);

    let answer = '';
    if (topMatches.length > 0) {
      answer = `[Demo Analysis Mode - Grounded Search]: Based on the document content, ${topMatches.map((m) => `"${m.sentence}"`).join(' Furthermore, ')}`;
    } else {
      answer = `[Demo Analysis Mode]: I could not find a direct answer to "${query}" in the extracted text of this document. Try searching for specific keywords present in the document.`;
    }

    return {
      answer,
      citations,
      confidence: topMatches.length > 0 ? 0.85 : 0.4,
      isDemoMode: true,
    };
  }
}
