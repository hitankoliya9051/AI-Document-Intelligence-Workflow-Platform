import path from 'path';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import { parse as parseCsv } from 'csv-parse/sync';
import { ParsedDocumentResult } from './IParserService';

// PDF Parse safe import
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

export class DocumentParserService {
  static async parse(
    buffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<ParsedDocumentResult> {
    const ext = path.extname(originalName).toLowerCase().replace('.', '');

    try {
      if (ext === 'pdf' || mimeType.includes('pdf')) {
        return await this.parsePdf(buffer);
      }

      if (
        ext === 'docx' ||
        mimeType.includes('wordprocessingml') ||
        mimeType.includes('msword')
      ) {
        return await this.parseDocx(buffer);
      }

      if (
        ext === 'xlsx' ||
        ext === 'xls' ||
        mimeType.includes('spreadsheet') ||
        mimeType.includes('excel')
      ) {
        return this.parseSpreadsheet(buffer);
      }

      if (ext === 'csv' || mimeType.includes('csv')) {
        return this.parseCsvData(buffer);
      }

      if (
        ['txt', 'md', 'json', 'log', 'xml', 'html'].includes(ext) ||
        mimeType.startsWith('text/')
      ) {
        return this.parsePlainText(buffer);
      }

      if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff'].includes(ext) || mimeType.startsWith('image/')) {
        return this.parseImageMetadata(buffer, originalName, mimeType);
      }

      // Fallback: attempt plain text decoding
      return this.parsePlainText(buffer);
    } catch (error: any) {
      console.error(`Document parser error for ${originalName}:`, error);
      // Graceful degraded response so pipeline can continue
      const fallbackText = buffer.toString('utf-8').slice(0, 5000);
      return {
        text: fallbackText.trim() || `[File: ${originalName} (${ext.toUpperCase()})]`,
        pageCount: 1,
        wordCount: fallbackText ? fallbackText.split(/\s+/).filter(Boolean).length : 0,
        metadata: {
          parserWarning: `Parser encountered issue: ${error.message}. Basic text extraction used.`,
        },
      };
    }
  }

  private static async parsePdf(buffer: Buffer): Promise<ParsedDocumentResult> {
    const data = await pdfParse(buffer);
    const text = data.text || '';
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const pageCount = data.numpages || 1;

    return {
      text: text.trim(),
      pageCount,
      wordCount,
      metadata: {
        info: data.info || {},
        version: data.version || 'PDF',
      },
    };
  }

  private static async parseDocx(buffer: Buffer): Promise<ParsedDocumentResult> {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value || '';
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    // Estimate pages based on word count (~400 words per page)
    const pageCount = Math.max(1, Math.ceil(wordCount / 400));

    return {
      text: text.trim(),
      pageCount,
      wordCount,
      metadata: {
        messages: result.messages,
      },
    };
  }

  private static parseSpreadsheet(buffer: Buffer): Promise<ParsedDocumentResult> {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    let combinedText = '';
    const tables: Array<{ name: string; headers: string[]; rows: any[][] }> = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const jsonData: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      
      if (jsonData && jsonData.length > 0) {
        const headers = (jsonData[0] || []).map((h: any) => String(h || '').trim());
        const rows = jsonData.slice(1);
        
        tables.push({
          name: sheetName,
          headers,
          rows: rows.slice(0, 100), // store up to 100 preview rows
        });

        combinedText += `\n--- Sheet: ${sheetName} ---\n`;
        jsonData.forEach((row) => {
          combinedText += row.filter((c) => c !== undefined && c !== null).join(' | ') + '\n';
        });
      }
    }

    const wordCount = combinedText.split(/\s+/).filter(Boolean).length;

    return Promise.resolve({
      text: combinedText.trim(),
      pageCount: workbook.SheetNames.length,
      wordCount,
      tables,
      metadata: {
        sheetNames: workbook.SheetNames,
      },
    });
  }

  private static parseCsvData(buffer: Buffer): Promise<ParsedDocumentResult> {
    const rawContent = buffer.toString('utf-8');
    let records: any[][] = [];
    try {
      records = parseCsv(rawContent, {
        skip_empty_lines: true,
        relax_column_count: true,
      });
    } catch {
      records = rawContent.split('\n').map((line) => line.split(','));
    }

    const headers = (records[0] || []).map((h) => String(h).trim());
    const rows = records.slice(1);

    const tables = [
      {
        name: 'CSV Data',
        headers,
        rows: rows.slice(0, 100),
      },
    ];

    const wordCount = rawContent.split(/\s+/).filter(Boolean).length;

    return Promise.resolve({
      text: rawContent.trim(),
      pageCount: 1,
      wordCount,
      tables,
      metadata: {
        rowCount: records.length,
        columnCount: headers.length,
      },
    });
  }

  private static parsePlainText(buffer: Buffer): Promise<ParsedDocumentResult> {
    const text = buffer.toString('utf-8');
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const pageCount = Math.max(1, Math.ceil(wordCount / 450));

    return Promise.resolve({
      text: text.trim(),
      pageCount,
      wordCount,
    });
  }

  private static parseImageMetadata(
    buffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<ParsedDocumentResult> {
    const sizeKb = (buffer.length / 1024).toFixed(1);
    const text = `[Image Document: ${originalName} | Type: ${mimeType} | Size: ${sizeKb} KB]\nThis image has been indexed and is available for visual inspection and AI vision extraction.`;

    return Promise.resolve({
      text,
      pageCount: 1,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      metadata: {
        isImage: true,
        mimeType,
        sizeKb,
      },
    });
  }
}
