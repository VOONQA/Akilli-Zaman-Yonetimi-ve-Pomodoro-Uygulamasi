import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { Task } from '../models/Task';

export async function requestCalendarPermissions() {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export async function getCalendars() {
  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    return calendars;
  } catch (error) {
    console.error('Takvimler alınırken hata:', error);
    throw error;
  }
}

export async function createEvent(task: Task) {
  try {
    // Önce izin kontrol ediliyor
    const permissionGranted = await requestCalendarPermissions();
    if (!permissionGranted) {
      throw new Error('Takvim izni reddedildi');
    }

    // Varsayılan takvimi bulalım
    const calendars = await getCalendars();
    const defaultCalendars = calendars.filter(
      calendar => 
        calendar.source.name === (Platform.OS === 'ios' ? 'iCloud' : 'Google') &&
        calendar.allowsModifications
    );
    
    if (defaultCalendars.length === 0) {
      throw new Error('Uygun takvim bulunamadı');
    }
    
    const defaultCalendar = defaultCalendars[0];
    
    // Tarihleri ayarlayalım
    const startDate = new Date(task.date);
    const endDate = new Date(task.date);
    endDate.setHours(endDate.getHours() + 1); // 1 saatlik etkinlik
    
    // Etkinlik oluşturalım
    const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
      title: task.title,
      notes: task.description,
      startDate,
      endDate,
      timeZone: 'Europe/Istanbul',
      alarms: [{ relativeOffset: -30 }] // 30 dakika önce hatırlatma
    });
    
    return eventId;
  } catch (error) {
    console.error('Takvim etkinliği oluşturulurken hata:', error);
    throw error;
  }
}

export async function importEventsAsTasks(startDate: Date, endDate: Date) {
  try {
    const permissionGranted = await requestCalendarPermissions();
    if (!permissionGranted) {
      throw new Error('Takvim izni reddedildi');
    }
    
    const calendars = await getCalendars();
    
    // Tüm etkinlikleri toplama
    let allEvents: any[] = [];
    
    for (const calendar of calendars) {
      try {
        // Her takvimin etkinliklerini alalım
        const events = await Calendar.getEventsAsync(
          [calendar.id],
          startDate,
          endDate
        );
        
        allEvents = [...allEvents, ...events];
      } catch (error) {
        console.warn(`${calendar.title} takviminden etkinlikler alınırken hata:`, error);
      }
    }
    
    // Etkinlikleri görev formatına dönüştürelim
    return allEvents.map(event => ({
      title: event.title,
      description: event.notes,
      date: new Date(event.startDate),
      dueDate: new Date(event.endDate),
      pomodoroCount: 2, // Varsayılan olarak 2 pomodoro atanabilir
      isCalendarEvent: true,
      calendarEventId: event.id
    }));
  } catch (error) {
    console.error('Takvim etkinlikleri alınırken hata:', error);
    throw error;
  }
}
