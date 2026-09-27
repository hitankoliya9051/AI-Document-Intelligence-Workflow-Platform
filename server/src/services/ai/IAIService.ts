import { IExtractedField, IExtractedEntity, IExtractedTable } from '../../models';

export interface AISummaryResult {
  summary: string;
  keyPoints: string[];
  confidence: number;
}

export interface AIClassificationResult {
  documentType: string;
  confidence: number;
  tags: string[];
}

export interface AIExtractionResult {
  fields: IExtractedField[];
  entities: IExtractedEntity[];
  tables?: IExtractedTable[];
  confidenceScore: number;
  isDemoMode: boolean;
}

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIChatResult {
  answer: string;
  citations: string[];
  confidence: number;
  isDemoMode: boolean;
}

export interface IAIService {
  providerName: string;
  isDemoMode: boolean;

  summarize(text: string, title?: string): Promise<AISummaryResult>;

  classify(text: string, title?: string): Promise<AIClassificationResult>;

  extractStructuredData(
    text: string,
    documentType?: string,
    existingTables?: IExtractedTable[]
  ): Promise<AIExtractionResult>;

  chatWithDocument(
    documentContext: string,
    query: string,
    history?: AIChatMessage[]
  ): Promise<AIChatResult>;
}
