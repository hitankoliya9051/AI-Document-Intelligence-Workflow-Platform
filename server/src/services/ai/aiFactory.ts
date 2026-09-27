import { IAIService } from './IAIService';
import { DemoAIService } from './DemoAIService';
import { GeminiAIService } from './GeminiAIService';
import { config } from '../../config';

let cachedAiService: IAIService | null = null;

export const getAIService = (): IAIService => {
  if (cachedAiService) {
    return cachedAiService;
  }

  const { provider, geminiApiKey, openaiApiKey } = config.ai;

  if (provider === 'gemini' && geminiApiKey) {
    console.log('[AI Service] Initialized Gemini AI Provider');
    cachedAiService = new GeminiAIService(geminiApiKey);
    return cachedAiService;
  }

  // Graceful fallback to DemoAIService
  console.log('[AI Service] Initialized Safe Demo AI Service (Offline rule engine active - no API key provided)');
  cachedAiService = new DemoAIService();
  return cachedAiService;
};

export * from './IAIService';
export * from './DemoAIService';
export * from './GeminiAIService';
