import OpenAI from 'openai';
import { OPENAI_API_KEY } from '@env';
import { Task } from '../../models/Task';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

interface AIScheduleOptions {
  completedTasks: Task[];
  weeks: number; // 1, 2, 3 veya 4 hafta
  startDate: Date;
}

interface GeneratedTask {
  title: string;
  description: string;
  date: string; // ISO string format
  pomodoroCount: number;
}

// AI'dan önerilen çalışma takvimi oluşturma
export const generateAISchedule = async (options: AIScheduleOptions): Promise<GeneratedTask[]> => {
  try {
    const { completedTasks, weeks, startDate } = options;
    
    // Mevcut görevlerden ders adlarını çıkarmaya çalış
    let existingSubjects: string[] = [];
    if (completedTasks.length > 0) {
      existingSubjects = completedTasks.map(task => {
        // Başlıktan ders adını çıkar (genellikle ilk kelime)
        return task.title.split(' ')[0];
      });
      // Benzersiz ders adlarını al
      existingSubjects = [...new Set(existingSubjects)];
    }
    
    // Varsayılan lise derslerini hazırla
    const defaultSubjects = [
      "Matematik", "Fizik", "Kimya", "Biyoloji", 
      "Türk Dili ve Edebiyatı", "Tarih", "Coğrafya", 
      "Yabancı Dil", "Felsefe", "Din Kültürü"
    ];
    
    // Eğer yeterli veri yoksa (az konu varsa) varsayılan dersleri ekle
    const subjects = existingSubjects.length >= 3 ? 
      existingSubjects : 
      [...existingSubjects, ...defaultSubjects.filter(s => !existingSubjects.includes(s))];
    
    // Bitiş tarihini hesapla
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (weeks * 7) - 1);
    
    // Prompt hazırla
    let prompt = `Bir öğrenci için ${weeks} haftalık çalışma takvimi oluştur. 
Başlangıç tarihi: ${startDate.toLocaleDateString('tr-TR')}
Bitiş tarihi: ${endDate.toLocaleDateString('tr-TR')}

Şu dersler için görevler oluştur: ${subjects.join(", ")}

Her gün için 1-2 görev oluştur. Her görev için başlık sadece ders adı olmalı (Örn: "Matematik", "Fizik", "Tarih", vb.).
Görevlerin açıklamasında konu detayları ver.

Her görev şu bilgileri içermeli:
1. Başlık: Sadece ders adı (örn: "Matematik")
2. Açıklama: Çalışılacak konu (örn: "Türev ve integral uygulamaları")
3. Tarih: Haftanın günlerine göre dağıtılmış (YYYY-MM-DD)
4. Pomodoro sayısı: 1-3 arası

Yanıtını yalnızca aşağıdaki JSON formatında ver:
{
  "tasks": [
    {
      "title": "Ders adı",
      "description": "Konu açıklaması",
      "date": "YYYY-MM-DD",
      "pomodoroCount": 2
    },
    ...diğer görevler
  ]
}`;

    // OpenAI API'sini çağır
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "Sen bir eğitim planlama asistanısın. Öğrencilere haftalık çalışma programları oluşturursun."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error("AI yanıt üretemedi");
    }

    try {
      // JSON yanıtı parse et
      const parsedResponse = JSON.parse(response);
      
      // tasks alanını kontrol et
      if (!parsedResponse.tasks || !Array.isArray(parsedResponse.tasks)) {
        return createFallbackSchedule(startDate, weeks, 
          existingSubjects.length > 0 ? existingSubjects : defaultSubjects);
      }
      
      // Her görevin gerekli alanları içerip içermediğini kontrol et
      for (const task of parsedResponse.tasks) {
        if (!task.title || !task.date || !task.pomodoroCount) {
          // Eksik alanları tamamla
          task.title = task.title || "Ders Çalışması";
          task.description = task.description || "Ders tekrarı ve problem çözme";
          task.pomodoroCount = task.pomodoroCount || 2;
          
          // Tarih yoksa uygun bir tarih ata
          if (!task.date) {
            const randomDay = Math.floor(Math.random() * (weeks * 7));
            const taskDate = new Date(startDate);
            taskDate.setDate(taskDate.getDate() + randomDay);
            task.date = taskDate.toISOString().split('T')[0];
          }
        }
        
        // Date formatını düzelt
        if (task.date && !task.date.includes('T')) {
          // YYYY-MM-DD formatını ISO string'e çevir
          const dateObj = new Date(task.date);
          if (!isNaN(dateObj.getTime())) {
            task.date = dateObj.toISOString();
          }
        }
      }
      
      return parsedResponse.tasks;
    } catch (error) {
      console.error("JSON parse hatası:", error);
      return createFallbackSchedule(startDate, weeks, 
        existingSubjects.length > 0 ? existingSubjects : defaultSubjects);
    }
  } catch (error) {
    console.error("AI takvim oluşturma hatası:", error);
    throw error;
  }
};

// Yedek olarak basit bir takvim oluştur
const createFallbackSchedule = (startDate: Date, weeks: number, subjects: string[]): GeneratedTask[] => {
  const tasks: GeneratedTask[] = [];
  const daysCount = weeks * 7;
  
  for (let day = 0; day < daysCount; day++) {
    const taskDate = new Date(startDate);
    taskDate.setDate(taskDate.getDate() + day);
    
    // Hafta içi günlerde daha fazla görev oluştur
    const isWeekend = taskDate.getDay() === 0 || taskDate.getDay() === 6;
    const tasksPerDay = isWeekend ? 1 : 2;
    
    for (let i = 0; i < tasksPerDay; i++) {
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const pomodoroCount = Math.floor(Math.random() * 2) + 1; // 1-2 arası
      
      tasks.push({
        title: subject,
        description: `${subject} konusunda temel kavramlar ve alıştırmalar`,
        date: taskDate.toISOString(),
        pomodoroCount: pomodoroCount
      });
    }
  }
  
  return tasks;
};
