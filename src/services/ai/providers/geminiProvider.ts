import type { AIProvider, AssistantAnswer } from '../types.ts';
import type { IntelligenceData } from '../../../types.ts';
import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = typeof process !== 'undefined' ? (process.env?.VITE_GEMINI_API_KEY || process.env?.GEMINI_API_KEY) : null;
  if (!apiKey) return null;
  if (!geminiClient) {
    try {
      geminiClient = new GoogleGenAI({ apiKey });
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
      return null;
    }
  }
  return geminiClient;
}

const PRIMARY_MODEL = 'gemini-2.5-flash';
const BACKUP_MODEL = 'gemini-1.5-flash';

export class GeminiProvider implements AIProvider {
  name = 'Google Gemini (GenAI)';

  async isAvailable(): Promise<boolean> {
    const key = typeof process !== 'undefined' ? (process.env?.VITE_GEMINI_API_KEY || process.env?.GEMINI_API_KEY) : null;
    return Boolean(key);
  }

  async getDemandIntelligence(): Promise<IntelligenceData> {
    const client = getGeminiClient();
    if (!client) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }

    let response;
    try {
      response = await client.models.generateContent({
        model: PRIMARY_MODEL,
        contents: `You are an AI culinary forecasting engine for a university canteen. Output valid JSON only (no markdown, no backticks) with:
        demandPredictions: array of timeSlot groups with predictions (itemName, predictedUnits, confidence, reason),
        peakHourPredictions: array of slots with expectedRush, queueEstimateMins, recommendation,
        foodWasteAnalysis: array of food items with dailyPrepared, dailySold, overPreparedUnits, wastePercentage, riskLevel,
        recommendations: array of title, item, savingsHint, badge,
        mlModelStatus: architecture, dataCollectionActive, historicalRecordsCount, datasetHealth`,
      });
    } catch (err: any) {
      // Fallback model attempt
      response = await client.models.generateContent({
        model: BACKUP_MODEL,
        contents: `You are an AI culinary forecasting engine for a university canteen. Output valid JSON only (no markdown, no backticks) with:
        demandPredictions: array of timeSlot groups with predictions (itemName, predictedUnits, confidence, reason),
        peakHourPredictions: array of slots with expectedRush, queueEstimateMins, recommendation,
        foodWasteAnalysis: array of food items with dailyPrepared, dailySold, overPreparedUnits, wastePercentage, riskLevel,
        recommendations: array of title, item, savingsHint, badge,
        mlModelStatus: architecture, dataCollectionActive, historicalRecordsCount, datasetHealth`,
      });
    }

    const text = response.text?.trim() || '';
    const cleanJson = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
    return JSON.parse(cleanJson);
  }

  async askAssistant(query: string, context?: { userName?: string }): Promise<AssistantAnswer> {
    const client = getGeminiClient();
    if (!client) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const prompt = `You are CampusBite AI, a friendly college canteen assistant for student ${context?.userName || 'Rahul'}.
    Answer this student question concisely in 2-3 sentences about food, menus, queues, or meal recommendations:
    "${query}"`;

    let response;
    try {
      response = await client.models.generateContent({
        model: PRIMARY_MODEL,
        contents: prompt,
      });
    } catch {
      response = await client.models.generateContent({
        model: BACKUP_MODEL,
        contents: prompt,
      });
    }

    return {
      answer: response.text?.trim() || 'I am happy to assist you with your canteen meal!',
      source: 'gemini',
      confidence: 0.95,
      suggestions: ['Check wait time', 'Today Special Combo', 'Track my token'],
    };
  }
}
