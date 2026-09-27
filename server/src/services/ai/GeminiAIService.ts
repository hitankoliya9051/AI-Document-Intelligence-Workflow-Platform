import {
  IAIService,
  AISummaryResult,
  AIClassificationResult,
  AIExtractionResult,
  AIChatMessage,
  AIChatResult,
} from './IAIService';
import { IExtractedField, IExtractedEntity, IExtractedTable } from '../../models';

export class GeminiAIService implements IAIService {
  public providerName = 'gemini';
  public isDemoMode = false;
  private apiKey: string;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-1.5-flash') {
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  private async callGemini(prompt: string, systemInstruction?: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
    
    const body: any = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error [${response.status}]: ${errText}`);
    }

    const data: any = await response.json();
    const candidate = data.candidates?.[0];
    return candidate?.content?.parts?.[0]?.text || '';
  }

  async summarize(text: string, title?: string): Promise<AISummaryResult> {
    const prompt = `You are an expert document analyst. Provide an executive summary and 3-5 bullet points of key highlights for the following document:\nTitle: ${title || 'Document'}\n\nContent:\n${text.slice(0, 15000)}\n\nRespond ONLY with valid JSON in this exact structure:
{
  "summary": "...",
  "keyPoints": ["point 1", "point 2"],
  "confidence": 0.95
}`;

    try {
      const raw = await this.callGemini(prompt, 'Respond only with pure JSON.');
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        summary: parsed.summary || 'Summary unavailable',
        keyPoints: parsed.keyPoints || [],
        confidence: parsed.confidence || 0.95,
      };
    } catch (e: any) {
      console.warn('Gemini summarize error, using fallback:', e.message);
      return {
        summary: text.slice(0, 300) + '...',
        keyPoints: ['Summarized via baseline analyzer.'],
        confidence: 0.7,
      };
    }
  }

  async classify(text: string, title: string = ''): Promise<AIClassificationResult> {
    const prompt = `Classify this document into one category (e.g. invoice, contract, financial_report, receipt, resume, technical_spec, memo, general) and provide 3 relevant tags:\nTitle: ${title}\nContent:\n${text.slice(0, 8000)}\n\nRespond ONLY in JSON:\n{"documentType":"invoice","confidence":0.95,"tags":["Finance","Invoice"]}`;

    try {
      const raw = await this.callGemini(prompt);
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        documentType: parsed.documentType || 'general',
        confidence: parsed.confidence || 0.9,
        tags: parsed.tags || ['Document'],
      };
    } catch {
      return {
        documentType: 'general',
        confidence: 0.8,
        tags: ['Document'],
      };
    }
  }

  async extractStructuredData(
    text: string,
    documentType: string = 'general',
    existingTables: IExtractedTable[] = []
  ): Promise<AIExtractionResult> {
    const prompt = `Analyze this document and extract structured key-value entities, numbers, dates, amounts, parties, and reference IDs.
Document Type: ${documentType}
Content:\n${text.slice(0, 15000)}

Respond ONLY in JSON with this structure:
{
  "fields": [
    { "key": "invoice_number", "label": "Invoice #", "value": "INV-001", "type": "string", "confidence": 0.98 },
    { "key": "total_amount", "label": "Total Amount", "value": "$1,250.00", "type": "currency", "confidence": 0.97 }
  ],
  "entities": [
    { "type": "ORGANIZATION", "text": "Acme Corp", "confidence": 0.95 }
  ],
  "confidenceScore": 0.96
}`;

    try {
      const raw = await this.callGemini(prompt);
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const fields: IExtractedField[] = (parsed.fields || []).map((f: any) => ({
        key: f.key,
        label: f.label || f.key,
        value: f.value,
        type: f.type || 'string',
        confidence: f.confidence || 0.9,
        isEdited: false,
        status: 'pending',
      }));

      return {
        fields,
        entities: parsed.entities || [],
        tables: existingTables,
        confidenceScore: parsed.confidenceScore || 0.95,
        isDemoMode: false,
      };
    } catch (e: any) {
      console.warn('Gemini extraction error:', e.message);
      throw e;
    }
  }

  async chatWithDocument(
    documentContext: string,
    query: string,
    history: AIChatMessage[] = []
  ): Promise<AIChatResult> {
    const prompt = `Document Context:
${documentContext.slice(0, 15000)}

User Question: ${query}

Answer the question strictly based on the provided document context. If the answer cannot be found in the document, explicitly say so.
Provide citations/direct quotes that support your answer.
Respond in JSON:
{
  "answer": "...",
  "citations": ["quote from document"],
  "confidence": 0.95
}`;

    try {
      const raw = await this.callGemini(prompt);
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        answer: parsed.answer,
        citations: parsed.citations || [],
        confidence: parsed.confidence || 0.95,
        isDemoMode: false,
      };
    } catch (err: any) {
      return {
        answer: `AI Chat error: ${err.message}`,
        citations: [],
        confidence: 0,
        isDemoMode: false,
      };
    }
  }
}
