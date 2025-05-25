export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName?: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdateProfileData {
  displayName?: string;
  photoURL?: string;
}

export interface SyncData {
  tasks: any[];
  statistics: any[];
  settings: any;
  badges: any[];
  lastSyncedAt: Date;
}
