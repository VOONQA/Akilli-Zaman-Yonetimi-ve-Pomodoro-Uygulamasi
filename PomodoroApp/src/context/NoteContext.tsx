import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Note, NoteFolder, NoteTag, NoteFilter } from '../models/Note';
import { useDatabase } from './DatabaseContext';
import * as noteService from '../services/noteService';
import * as folderService from '../services/noteService';
import * as tagService from '../services/noteService';

interface NoteContextType {
  notes: Note[];
  folders: NoteFolder[];
  loading: boolean;
  error: string | null;
  currentFilter: NoteFilter;
  
  // Not işlemleri
  createNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateNote: (id: string, note: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  getNote: (id: string) => Promise<Note | null>;
  
  // Klasör işlemleri
  createFolder: (folder: Omit<NoteFolder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateFolder: (id: string, folder: Partial<Omit<NoteFolder, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  
  // Filtreleme işlemleri
  setFilter: (filter: NoteFilter) => void;
  clearFilter: () => void;
  
  // Yenileme işlemi
  refreshNotes: () => Promise<void>;
}

const defaultContextValue: NoteContextType = {
  notes: [],
  folders: [],
  loading: false,
  error: null,
  currentFilter: {},
  
  createNote: async () => '',
  updateNote: async () => {},
  deleteNote: async () => {},
  getNote: async () => null,
  
  createFolder: async () => '',
  updateFolder: async () => {},
  deleteFolder: async () => {},
  
  setFilter: () => {},
  clearFilter: () => {},
  
  refreshNotes: async () => {}
};

const NoteContext = createContext<NoteContextType>(defaultContextValue);

export const useNotes = () => useContext(NoteContext);

interface NoteProviderProps {
  children: ReactNode;
}

export const NoteProvider: React.FC<NoteProviderProps> = ({ children }) => {
  const { db } = useDatabase();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<NoteFilter>({});
  
  // Tüm notları yükle
  const loadNotes = async () => {
    if (!db) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const fetchedNotes = await noteService.getNotes(db);
      setNotes(fetchedNotes);
      
      const fetchedFolders = await folderService.getFolders(db);
      setFolders(fetchedFolders);
    } catch (err) {
      setError('Notlar yüklenirken bir hata oluştu');
      console.error('Notlar yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Veritabanı hazır olduğunda notları yükle
  useEffect(() => {
    if (db) {
      loadNotes();
    }
  }, [db]);
  
  const refreshNotes = async () => {
    await loadNotes();
  };
  
  // Not işlemleri
  const createNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!db) throw new Error('Veritabanı hazır değil');
    
    try {
      const id = await noteService.createNote(db, note);
      await refreshNotes();
      return id;
    } catch (err) {
      console.error('Not oluşturulurken hata:', err);
      setError('Not oluşturulurken bir hata oluştu');
      throw err;
    }
  };
  
  const updateNote = async (id: string, note: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>) => {
    if (!db) throw new Error('Veritabanı hazır değil');
    
    try {
      await noteService.updateNote(db, id, note);
      await refreshNotes();
    } catch (err) {
      setError('Not güncellenirken bir hata oluştu');
      console.error('Not güncellenirken hata:', err);
      throw err;
    }
  };
  
  const deleteNote = async (id: string) => {
    if (!db) throw new Error('Veritabanı hazır değil');
    
    try {
      await noteService.deleteNote(db, id);
      await refreshNotes();
    } catch (err) {
      setError('Not silinirken bir hata oluştu');
      console.error('Not silinirken hata:', err);
      throw err;
    }
  };
  
  const getNote = async (id: string) => {
    if (!db) throw new Error('Veritabanı hazır değil');
    
    try {
      return await noteService.getNote(db, id);
    } catch (err) {
      setError('Not alınırken bir hata oluştu');
      console.error('Not alınırken hata:', err);
      throw err;
    }
  };
  
  // Filtreleme işlemleri
  const setFilter = (filter: NoteFilter) => {
    setCurrentFilter(filter);
  };
  
  const clearFilter = () => {
    setCurrentFilter({});
  };
  
  // Klasör işlemleri
  const createFolder = async (folder: Omit<NoteFolder, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!db) throw new Error('Veritabanı hazır değil');
    
    try {
      const id = await folderService.createFolder(db, folder);
      await refreshNotes();
      return id;
    } catch (err) {
      console.error('Klasör oluşturulurken hata:', err);
      setError('Klasör oluşturulurken bir hata oluştu');
      throw err;
    }
  };
  
  const updateFolder = async (id: string, folder: Partial<Omit<NoteFolder, 'id' | 'createdAt' | 'updatedAt'>>) => {
    if (!db) throw new Error('Veritabanı hazır değil');
    
    try {
      await folderService.updateFolder(db, id, folder);
      await refreshNotes();
    } catch (err) {
      setError('Klasör güncellenirken bir hata oluştu');
      console.error('Klasör güncellenirken hata:', err);
      throw err;
    }
  };
  
  const deleteFolder = async (id: string) => {
    if (!db) throw new Error('Veritabanı hazır değil');
    
    try {
      await folderService.deleteFolder(db, id);
      await refreshNotes();
    } catch (err) {
      setError('Klasör silinirken bir hata oluştu');
      console.error('Klasör silinirken hata:', err);
      throw err;
    }
  };
  
  // Context değerini oluştur
  const value: NoteContextType = {
    notes,
    folders,
    loading,
    error,
    currentFilter,
    
    createNote,
    updateNote,
    deleteNote,
    getNote,
    
    createFolder,
    updateFolder,
    deleteFolder,
    
    setFilter,
    clearFilter,
    
    refreshNotes
  };
  
  return (
    <NoteContext.Provider value={value}>
      {children}
    </NoteContext.Provider>
  );
};

export default NoteContext;
