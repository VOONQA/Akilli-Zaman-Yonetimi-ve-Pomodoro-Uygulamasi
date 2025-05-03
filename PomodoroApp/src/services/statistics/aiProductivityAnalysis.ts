import { DailyStats, HourlyProductivity, AIProductivityInsight } from '../../types/statistics';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import OpenAI from 'openai';
import { saveAIAnalysis, getAIAnalysis } from './aiAnalysisService';

// OpenAI API istemcisi - .env dosyasından API anahtarını kullan
let openai: OpenAI | null = null;

try {
  // API anahtarını .env dosyasından al
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (apiKey) {
    openai = new OpenAI({
      apiKey: apiKey
    });
  } else {
    console.log('OpenAI API anahtarı bulunamadı (.env dosyasında OPENAI_API_KEY tanımlı olmalı)');
  }
} catch (error) {
  console.error('OpenAI istemcisi başlatılamadı:', error);
}

/**
 * Verimlilik verilerine göre yapay zeka analizleri oluşturur
 */
export const getProductivityAnalysis = async (
  dailyStats: DailyStats[],
  hourlyProductivity: HourlyProductivity[],
  timeRange: 'daily' | 'weekly' | 'monthly',
  date: Date
): Promise<AIProductivityInsight[]> => {
  try {
    // Önce veritabanında kayıtlı analiz var mı kontrol et
    const periodValue = getPeriodValue(timeRange, date);
    const savedAnalysis = await getAIAnalysis(timeRange, periodValue);
    
    if (savedAnalysis) {
      console.log('Veritabanından kayıtlı analiz bulundu:', timeRange, periodValue);
      return savedAnalysis;
    }
    
    // OpenAI API mevcut değilse hata döndür
    if (!openai) {
      console.error('OpenAI API bağlantısı yok');
      throw new Error('API bağlantısı kurulamadı');
    }

    // Veri şeklini oluştur
    const statsData = {
      dailyStats: dailyStats.map(day => ({
        date: day.date,
        completedPomodoros: day.completedPomodoros,
        totalPomodoros: day.totalPomodoros,
        focusTime: day.totalFocusTime,
        tasksCompleted: day.tasks.completed,
        totalTasks: day.tasks.total,
        mostProductiveHour: day.mostProductiveHour
      })),
      hourlyData: hourlyProductivity,
      timeRange,
      currentDate: format(date, 'yyyy-MM-dd')
    };

    // OpenAI'dan analiz iste
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `Sen bir pomodoro uygulaması için verimlilik analizi asistanısın. 
          Kullanıcının üretkenlik verilerini analiz edip, onlara 3-5 yararlı içgörü sunacaksın.
          Her içgörü şu formatta olmalı:
          - insight: Tespit edilen verimlilik durumu (Türkçe)
          - score: 0-100 arası bir etki puanı
          - category: 'time' | 'task' | 'focus' | 'break' | 'habit' kategorilerinden biri
          - recommendation: Somut ve uygulanabilir bir öneri (Türkçe)
          
          Kullanıcı ${timeRange === 'daily' ? 'günlük' : timeRange === 'weekly' ? 'haftalık' : 'aylık'} bir görünüme bakıyor.
          Önerileri buna göre uyarla ve kişiselleştir.
          
          Yanıtın şu formatta JSON içermeli: { "insights": [ { içgörüler... } ] }`
        },
        {
          role: "user",
          content: `Aşağıdaki verimlilik verilerini analiz et ve içgörüler sun:\n${JSON.stringify(statsData, null, 2)}`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const analysisText = response.choices[0]?.message?.content;
    
    if (!analysisText) {
      throw new Error('API yanıtı geçersiz');
    }
    
    // JSON yanıtını parse et
    const analysis = JSON.parse(analysisText);
    
    if (!Array.isArray(analysis.insights)) {
      throw new Error('API yanıtı beklenen formatta değil');
    }
    
    const insights = analysis.insights.slice(0, 5); // En fazla 5 içgörü döndür
    
    // Analizleri veritabanına kaydet
    await saveAIAnalysis(timeRange, periodValue, insights);
    
    return insights;
    
  } catch (error) {
    console.error('AI analizi yapılırken hata:', error);
    
    // Hata durumunda varsayılan öneriler
    return [
      {
        insight: 'Verilerin analiz edilirken bir sorun oluştu',
        score: 60,
        category: 'focus',
        recommendation: 'Daha sonra tekrar deneyin veya Ayarlar bölümünden AI servislerini kontrol edin'
      }
    ];
  }
};

// Dönem değerini formatla
const getPeriodValue = (timeRange: 'daily' | 'weekly' | 'monthly', date: Date): string => {
  if (timeRange === 'daily') {
    return format(date, 'yyyy-MM-dd');
  } else if (timeRange === 'weekly') {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
    return format(weekStart, 'yyyy-MM-dd');
  } else {
    return format(date, 'yyyy-MM');
  }
};

/**
 * Kullanıcının çalışma alışkanlıklarına göre tavsiyeler üretir
 */
export const getPersonalizedAdvice = async (userId: string): Promise<string> => {
  try {
    // OpenAI API mevcut değilse hata döndür
    if (!openai) {
      throw new Error('OpenAI API bağlantısı yok');
    }
    
    // Kullanıcıya özel öneri için OpenAI API'yi kullan
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Sen bir pomodoro uygulaması için kişisel danışmansın. Kullanıcıya özgü, motive edici ve yapıcı tavsiyeler vermelisin. Yanıtların kısa, net ve uygulanabilir olmalı."
        },
        {
          role: "user",
          content: `Kullanıcı ID: ${userId}. Bana pomodoro ve verimlilik konusunda kişisel bir tavsiye ver.`
        }
      ],
      temperature: 0.8,
      max_tokens: 200
    });

    return response.choices[0]?.message?.content || 'Şu anda öneri oluşturulamıyor.';
    
  } catch (error) {
    console.error('Kişisel tavsiye alınırken hata:', error);
    return 'Şu anda kişiselleştirilmiş tavsiye servisi kullanılamıyor.';
  }
};
