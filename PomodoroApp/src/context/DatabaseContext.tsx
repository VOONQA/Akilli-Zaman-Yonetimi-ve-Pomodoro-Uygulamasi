import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { openDatabase } from '../services/database';
import { Database } from '../types/database';
import { initializeDatabase } from '../services/migrations';

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

  // Veritabanını başlatma fonksiyonu
  const initializeDatabaseFunc = async () => {
    try {
      console.log('Veritabanı başlatılıyor...');
      // Veritabanını aç
      const database = openDatabase();
      
      // Doğrudan database'i kullan, adapter'a gerek yok
      await initializeDatabase(database); 
      
      // State'i güncelle
      setDb(database);
      setIsLoading(false);
      console.log('Veritabanı başarıyla yüklendi');
    } catch (error) {
      console.error('Veritabanı başlatılırken hata:', error);
      setIsLoading(false);
    }
  };

  // Uygulama başlatıldığında veritabanını başlat
  useEffect(() => {
    initializeDatabaseFunc();
  }, []);

  // Context değerini oluştur
  const value = {
    db,
    isLoading,
    initializeDatabase: initializeDatabaseFunc,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export default DatabaseContext;