import { Alert } from 'react-native';

// Gerçek email gönderme servisi
export class EmailService {
  // EmailJS konfigürasyonu
  private static SERVICE_ID = 'service_birjnna';
  private static TEMPLATE_ID = 'template_vo0x06u';
  private static PUBLIC_KEY = 'RxHoG6oj87_3TZwM3';

  // EmailJS kullanarak email gönder
  static async sendEmail(to: string, subject: string, message: string): Promise<boolean> {
    try {
      // EmailJS veya başka bir email servisi kullanılabilir
      // Şimdilik mock implementation
      
      const emailData = {
        to_email: to,
        subject: subject,
        message: message,
        from_name: 'Pomodoro App'
      };

      // Gerçek email servisi entegrasyonu burada olacak
      console.log('Email gönderiliyor:', emailData);
      
      // Simüle edilmiş başarılı gönderim
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 1000);
      });
      
    } catch (error) {
      console.error('Email gönderme hatası:', error);
      return false;
    }
  }

  // Doğrulama email'i gönder
  static async sendVerificationEmail(email: string, code: string): Promise<boolean> {
    try {
      console.log('📧 Email simülasyonu (Geliştirme Modu):', email, code);
      
      // EmailJS mobil uygulamalarda çalışmıyor
      // Şimdilik false döndür ki alert ile kod gösterilsin
      return false;
      
    } catch (error) {
      console.error('❌ Email gönderme hatası:', error);
      return false;
    }
  }
} 