export interface ParsedDocumentResult {
  text: string;
  pageCount: number;
  wordCount: number;
  metadata?: Record<string, any>;
  tables?: Array<{
    name: string;
    headers: string[];
    rows: any[][];
  }>;
}

export interface IDocumentParser {
  supports(mimeType: string, extension: string): boolean;
  parse(buffer: Buffer, originalName?: string): Promise<ParsedDocumentResult>;
}
