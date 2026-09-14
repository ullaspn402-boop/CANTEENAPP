import { AIProvider, AssistantAnswer } from '../types.ts';
import { IntelligenceData } from '../../../types.ts';

export class FallbackProvider implements AIProvider {
  name = 'FallbackProvider (Resilient Campus Defaults)';

  async isAvailable(): Promise<boolean> {
    return true; // Always operational
  }

  async getDemandIntelligence(): Promise<IntelligenceData> {
    return {
      demandPredictions: [
        {
          timeSlot: 'Tomorrow 12:30 – 01:30 PM (Lunch Period)',
          predictions: [
            { itemName: 'Special North Indian Thali', predictedUnits: 100, confidence: 'Baseline', reason: 'Default campus lunch demand baseline' },
            { itemName: 'Masala Dosa', predictedUnits: 70, confidence: 'Baseline', reason: 'Standard campus staple rate' },
            { itemName: 'Masala Chai (Kulhad)', predictedUnits: 120, confidence: 'Baseline', reason: 'Beverage break standard volume' },
          ],
        },
      ],
      peakHourPredictions: [
        { slot: '12:30 – 01:30 PM', expectedRush: 'High', queueEstimateMins: 10, recommendation: 'Deploy 2 staff at primary token counter' },
        { slot: '04:00 – 05:00 PM', expectedRush: 'Moderate', queueEstimateMins: 5, recommendation: 'Standard evening snack prep' },
      ],
      foodWasteAnalysis: [
        { foodItemId: 1, name: 'Special North Indian Thali', dailyPrepared: 100, dailySold: 85, overPreparedUnits: 15, wastePercentage: 15, riskLevel: 'Medium' },
        { foodItemId: 2, name: 'Masala Dosa', dailyPrepared: 90, dailySold: 82, overPreparedUnits: 8, wastePercentage: 9, riskLevel: 'Low' },
      ],
      recommendations: [
        { title: 'Campus Favorite Combo', item: 'Masala Dosa + Filter Coffee', savingsHint: 'Popular student breakfast choice', badge: 'Top Pick' },
        { title: 'Healthy Lunch Choice', item: 'Special North Indian Thali', savingsHint: 'Balanced fresh daily meal', badge: 'Best Value' },
      ],
      mlModelStatus: {
        architecture: 'Static Fallback Model (Zero External Dependency)',
        dataCollectionActive: true,
        historicalRecordsCount: 50,
        datasetHealth: 'Operating on safe fallback heuristics',
      },
    };
  }

  async askAssistant(query: string): Promise<AssistantAnswer> {
    return {
      answer: 'AI Assistant is currently operating in offline mode. For today\'s menu, ordering, or counter token collection, please use the navigation tabs above. Canteen operating hours are 8:00 AM – 8:00 PM.',
      source: 'fallback',
      confidence: 0.5,
      suggestions: ['View Menu', 'Check Order Status', 'Help & Operating Hours'],
    };
  }
}
