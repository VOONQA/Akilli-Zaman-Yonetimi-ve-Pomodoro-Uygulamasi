import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../constants/firebaseConfig';
import { AuthState, User } from '../types/auth';
import { AuthService } from '../services/AuthService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';
import { AutoSyncService } from '../services/AutoSyncService';
import { ProfileImageService } from '../services/ProfileImageService';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: { displayName?: string }) => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  profileImage: string | null;
  updateProfileImage: (imageUri: string | null) => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        error: null
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Kullanıcı verilerini yenile
  const refreshUser = async () => {
    try {
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        // SADECE Firestore'dan emailVerified al, Firebase Auth'u kullanma
        let emailVerified = false;
        let userProfileImage = null;
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.emailVerified !== undefined) {
            emailVerified = data.emailVerified;
          }
          if (data.profileImageUri) {
            userProfileImage = data.profileImageUri;
            setProfileImage(userProfileImage);
          }
        }
        
        const userData: User = {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email!,
          displayName: auth.currentUser.displayName || undefined,
          emailVerified: emailVerified,
          createdAt: userDoc.exists() ? userDoc.data().createdAt?.toDate() : new Date(),
          lastLoginAt: new Date()
        };
        
        setUser(userData);
        console.log('🔄 Kullanıcı verileri yenilendi:', userData.email, 'Verified:', emailVerified);
      }
    } catch (error) {
      console.error('❌ Kullanıcı verileri yenilenirken hata:', error);
      setError('Kullanıcı verileri yenilenemedi');
    }
  };

  // Profil resmini güncelle
  const updateProfileImage = async (imageUri: string | null) => {
    try {
      if (!auth.currentUser) {
        throw new Error('Kullanıcı oturum açmamış');
      }

      // Firestore'a kaydet
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, {
        profileImageUri: imageUri,
        updatedAt: new Date()
      }, { merge: true });

      // Local state'i güncelle
      setProfileImage(imageUri);
      
      console.log('✅ Profil resmi güncellendi');
    } catch (error) {
      console.error('❌ Profil resmi güncelleme hatası:', error);
      throw error;
    }
  };

  // Çıkış yap
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfileImage(null); // Profil resmini temizle
      setError(null);
      console.log('✅ Çıkış yapıldı');
    } catch (error: any) {
      console.error('❌ Çıkış hatası:', error);
      setError('Çıkış yapılırken bir hata oluştu');
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser?.email);
      
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          // SADECE Firestore'dan emailVerified al
          let emailVerified = false;
          let userProfileImage = null;
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.emailVerified !== undefined) {
              emailVerified = data.emailVerified;
              console.log('📧 Firestore emailVerified:', emailVerified);
            }
            if (data.profileImageUri) {
              userProfileImage = data.profileImageUri;
              setProfileImage(userProfileImage);
              console.log('🖼️ Profil resmi yüklendi');
            }
          }
          
          const userData: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || undefined,
            emailVerified: emailVerified,
            createdAt: userDoc.exists() ? userDoc.data().createdAt?.toDate() : new Date(),
            lastLoginAt: new Date()
          };
          
          // Firestore'a yazarken emailVerified'ı KORUMA
          const updateData: any = {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            lastLoginAt: new Date(),
            updatedAt: new Date()
          };
          
          // SADECE döküman yoksa emailVerified ekle
          if (!userDoc.exists()) {
            updateData.emailVerified = false;
            updateData.createdAt = new Date();
            console.log('📝 Yeni kullanıcı dökümanı oluşturuluyor');
          } else {
            console.log('📝 Mevcut kullanıcı güncelleniyor, emailVerified korunuyor');
          }
          
          await setDoc(userDocRef, updateData, { merge: true });
          
          setUser(userData);
          console.log('✅ Kullanıcı oturumu yüklendi:', userData.email, 'Verified:', emailVerified);
        } catch (error) {
          console.error('❌ Kullanıcı verileri yüklenirken hata:', error);
          setUser(null);
          setProfileImage(null);
        }
      } else {
        setUser(null);
        setProfileImage(null); // Çıkış yapıldığında profil resmini temizle
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await AuthService.login(email, password);
    } catch (error: any) {
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName?: string) => {
    try {
      await AuthService.register(email, password, displayName);
    } catch (error: any) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await AuthService.resetPassword(email);
    } catch (error: any) {
      throw error;
    }
  };

  const updateProfile = async (data: { displayName?: string }) => {
    try {
      await AuthService.updateProfile(data);
    } catch (error: any) {
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    profileImage,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    clearError,
    refreshUser,
    updateProfileImage
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
