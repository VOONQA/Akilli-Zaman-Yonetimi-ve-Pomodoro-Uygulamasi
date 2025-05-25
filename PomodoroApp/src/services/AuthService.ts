import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../constants/firebaseConfig';
import { User, LoginCredentials, RegisterCredentials } from '../types/auth';

export class AuthService {
  // Giriş yap
  static async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Firestore'da kullanıcı bilgilerini güncelle
      await this.updateUserInFirestore(firebaseUser);
      
      return this.mapFirebaseUserToUser(firebaseUser);
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Kayıt ol
  static async register(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Kullanıcı profil bilgilerini güncelle
      if (displayName) {
        await firebaseUpdateProfile(firebaseUser, { displayName });
      }
      
      // Firestore'da kullanıcı dökümanı oluştur
      await this.createUserInFirestore(firebaseUser, displayName);
      
      return this.mapFirebaseUserToUser(firebaseUser);
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Çıkış yap
  static async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error('Çıkış yapılırken bir hata oluştu');
    }
  }

  // Şifre sıfırlama
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Profil güncelle
  static async updateProfile(data: { displayName?: string }): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

      if (data.displayName) {
        await firebaseUpdateProfile(user, { displayName: data.displayName });
        
        // Firestore'da da güncelle
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          displayName: data.displayName,
          updatedAt: new Date()
        });
      }
    } catch (error: any) {
      throw new Error('Profil güncellenirken bir hata oluştu');
    }
  }

  // Email doğrulandı olarak işaretle
  static async markEmailAsVerified(uid: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        emailVerified: true,
        updatedAt: new Date()
      });
    } catch (error: any) {
      throw new Error('Email doğrulama durumu güncellenemedi');
    }
  }

  // Kullanıcı bilgilerini Firestore'dan al
  static async getUserFromFirestore(uid: string): Promise<any> {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error: any) {
      throw new Error('Kullanıcı bilgileri alınamadı');
    }
  }

  // Firestore'da kullanıcı oluştur
  private static async createUserInFirestore(firebaseUser: FirebaseUser, displayName?: string): Promise<void> {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: displayName || firebaseUser.displayName || null,
      emailVerified: firebaseUser.emailVerified,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(userRef, userData);
  }

  // Firestore'da kullanıcı güncelle
  private static async updateUserInFirestore(firebaseUser: FirebaseUser): Promise<void> {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        lastLoginAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      // Eğer kullanıcı dökümanı yoksa oluştur
      await this.createUserInFirestore(firebaseUser);
    }
  }

  // Firebase User'ı User tipine çevir
  private static mapFirebaseUserToUser(firebaseUser: FirebaseUser): User {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      emailVerified: firebaseUser.emailVerified,
      createdAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime) : new Date(),
      lastLoginAt: firebaseUser.metadata.lastSignInTime ? new Date(firebaseUser.metadata.lastSignInTime) : new Date()
    };
  }

  // Hata mesajlarını Türkçe'ye çevir
  private static getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı';
      case 'auth/wrong-password':
        return 'Yanlış şifre girdiniz';
      case 'auth/invalid-credential':
        return 'E-posta veya şifre hatalı';
      case 'auth/invalid-email':
        return 'Geçersiz e-posta adresi formatı';
      case 'auth/email-already-in-use':
        return 'Bu e-posta adresi zaten kullanımda';
      case 'auth/weak-password':
        return 'Şifre en az 6 karakter olmalıdır';
      case 'auth/user-disabled':
        return 'Bu hesap devre dışı bırakılmıştır';
      case 'auth/too-many-requests':
        return 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin';
      case 'auth/network-request-failed':
        return 'İnternet bağlantınızı kontrol edin';
      default:
        console.log('Bilinmeyen hata kodu:', errorCode);
        return 'Bir hata oluştu. Lütfen tekrar deneyin';
    }
  }
}
