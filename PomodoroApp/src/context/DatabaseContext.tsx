import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Veritabanı tipleri
type Database = any; // İleride SQLite.SQLiteDatabase olacak

// Context tipi
interface DatabaseContextType {
  db: Database | null;
  isLoading: boolean;
  initializeDatabase: () => Promise<void>;
}

// Varsayılan değerler
const defaultContextValue: DatabaseContextType = {
  db: null,
  isLoading: true,
  initializeDatabase: async () => {},
};

// Context oluşturma
const DatabaseContext = createContext<DatabaseContextType>(defaultContextValue);

// Export işlemi burada doğru şekilde yapılmalı
export function useDatabase() {
  return useContext(DatabaseContext);
}

// Provider props tipi
interface DatabaseProviderProps {
  children: ReactNode;
}

// Provider bileşeni
export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [db, setDb] = useState<Database | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false); // Başlatma durumunu takip et

  // useCallback ile sarmalayalım ki referans sabit kalsın
  const initializeDatabase = useCallback(async () => {
    // Eğer zaten başlatıldıysa tekrar başlatma
    if (isInitialized) {
      return;
    }

    try {
      setIsLoading(true);
      console.log('Veritabanı başlatılıyor...');
      
      // Gerçek bir veritabanı başlatması yapacaksınız
      // Şimdilik sadece sahte bir veritabanı nesnesi oluşturuyoruz
      setTimeout(() => {
        setDb({} as Database);
        setIsLoading(false);
        setIsInitialized(true); // Başlatma işlemi tamamlandı
      }, 500);
    } catch (error) {
      console.error('Veritabanı başlatma hatası:', error);
      setIsLoading(false);
    }
  }, [isInitialized]); // Sadece isInitialized değiştiğinde yeniden oluştur

  const contextValue: DatabaseContextType = {
    db,
    isLoading,
    initializeDatabase,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};