import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../constants/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class EmailVerificationService {
  private static generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static async sendVerificationCode(email: string): Promise<string> {
    try {
      const code = this.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika

      await AsyncStorage.setItem(`verification_code_${email}`, JSON.stringify({
        code,
        expiresAt: expiresAt.toISOString(),
        email
      }));

      console.log(`📧 Doğrulama kodu: ${code}`);
      alert(`Geliştirme modu: Doğrulama kodunuz ${code}`);
      
      return code;
    } catch (error) {
      console.error('Doğrulama kodu gönderilirken hata:', error);
      throw new Error('Doğrulama kodu gönderilemedi');
    }
  }

  static async verifyCode(email: string, inputCode: string): Promise<boolean> {
    try {
      console.log('🔍 Kod doğrulama başlıyor...', { email, inputCode });
      
      const storedData = await AsyncStorage.getItem(`verification_code_${email}`);
      
      if (!storedData) {
        throw new Error('Doğrulama kodu bulunamadı');
      }

      const { code, expiresAt } = JSON.parse(storedData);
      console.log('📋 Stored code:', code, 'Input code:', inputCode);
      
      if (new Date() > new Date(expiresAt)) {
        await AsyncStorage.removeItem(`verification_code_${email}`);
        throw new Error('Doğrulama kodu süresi dolmuş');
      }

      if (code !== inputCode.toUpperCase()) {
        throw new Error('Geçersiz doğrulama kodu');
      }

      console.log('✅ Kod doğru! Firestore güncelleniyor...');
      
      // Kod doğru, temizle
      await AsyncStorage.removeItem(`verification_code_${email}`);
      
      // Firestore'da emailVerified'ı true yap
      if (auth.currentUser) {
        console.log('👤 Current user UID:', auth.currentUser.uid);
        
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        
        // Önce mevcut veriyi kontrol et
        const beforeDoc = await getDoc(userDocRef);
        console.log('📄 Firestore ÖNCE:', beforeDoc.exists() ? beforeDoc.data() : 'Döküman yok');
        
        await setDoc(userDocRef, {
          emailVerified: true,
          verifiedAt: new Date(),
          updatedAt: new Date()
        }, { merge: true });
        
        // Sonra kontrol et
        const afterDoc = await getDoc(userDocRef);
        console.log('📄 Firestore SONRA:', afterDoc.exists() ? afterDoc.data() : 'Döküman yok');
        
        console.log('✅ Firestore emailVerified güncellendi: true');
      } else {
        console.error('❌ auth.currentUser null!');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Doğrulama hatası:', error);
      throw error;
    }
  }

  static async markEmailAsVerified(email: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('Kullanıcı oturum açmamış');
      }

      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, {
        emailVerified: true,
        verifiedAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });

      console.log('✅ Email doğrulandı olarak işaretlendi');
    } catch (error) {
      console.error('Email doğrulama işaretleme hatası:', error);
      throw error;
    }
  }
} 