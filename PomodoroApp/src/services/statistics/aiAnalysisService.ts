import { openDatabase } from '../database';
import { AIProductivityInsight } from '../../types/statistics';

const AI_ANALYSIS_TABLE = 'ai_analysis';

// AI Analiz sonuçlarını veritabanına kaydeder
export const saveAIAnalysis = async (
  periodType: 'daily' | 'weekly' | 'monthly',
  periodValue: string,
  insights: AIProductivityInsight[]
): Promise<void> => {
  try {
    const db = openDatabase();
    const now = new Date().toISOString();
    
    // Önce aynı dönem için mevcut kayıt olup olmadığını kontrol et
    interface AnalysisRecord {
      id: string;
    }
    
    const existingAnalysis = await db.select<AnalysisRecord>(
      `SELECT id FROM ${AI_ANALYSIS_TABLE} WHERE period_type = ? AND period_value = ? LIMIT 1`,
      [periodType, periodValue]
    );
    
    if (existingAnalysis && existingAnalysis.length > 0) {
      // Mevcut kaydı güncelle - dizi elemanına erişiyoruz
      await db.update(
        AI_ANALYSIS_TABLE,
        {
          analysis_text: JSON.stringify(insights),
          updated_at: now
        },
        'id = ?',
        [existingAnalysis[0]?.id]
      );
    } else {
      // Yeni kayıt oluştur - otomatik ID ataması için id alanını belirtmiyoruz
      await db.insert(AI_ANALYSIS_TABLE, {
        period_type: periodType,
        period_value: periodValue,
        analysis_text: JSON.stringify(insights),
        date: now.split('T')[0],
        created_at: now,
        updated_at: now
      });
    }
  } catch (error) {
    console.error('AI analiz sonuçları kaydedilirken hata:', error);
  }
};

// Belirli bir dönem için AI Analiz sonuçlarını veritabanından çeker
export const getAIAnalysis = async (
  periodType: 'daily' | 'weekly' | 'monthly',
  periodValue: string
): Promise<AIProductivityInsight[] | null> => {
  try {
    const db = openDatabase();
    
    interface AnalysisResult {
      analysis_text: string;
    }
    
    const result = await db.select<AnalysisResult>(
      `SELECT analysis_text FROM ${AI_ANALYSIS_TABLE} WHERE period_type = ? AND period_value = ? ORDER BY created_at DESC LIMIT 1`,
      [periodType, periodValue]
    );
    
    if (result && result.length > 0) {
      // Dizi elemanına erişiyoruz
      const analysisRecord = result[0];
      const analysisText = analysisRecord.analysis_text;
      return JSON.parse(analysisText) as AIProductivityInsight[];
    } 
    
    return null;
  } catch (error) {
    console.error('AI analiz sonuçları alınırken hata:', error);
    return null;
  }
};