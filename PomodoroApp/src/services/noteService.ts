import { Database } from '../types/database';
import { Note, NoteFolder } from '../models/Note';

// Not CRUD işlemleri
export const getNotes = async (db: Database): Promise<Note[]> => {
  try {
    const notes = await db.select<Note>(`
      SELECT 
        notes.id, 
        notes.title, 
        notes.content, 
        notes.created_at as createdAt, 
        notes.updated_at as updatedAt, 
        notes.folder_id as folderId, 
        notes.color
      FROM notes
      ORDER BY notes.updated_at DESC
    `);

    return notes;
  } catch (error) {
    console.error('Notlar alınırken hata:', error);
    throw error;
  }
};

export const getNote = async (db: Database, id: string): Promise<Note | null> => {
  try {
    const notes = await db.select<Note>(`
      SELECT 
        id, 
        title, 
        content, 
        created_at as createdAt, 
        updated_at as updatedAt, 
        folder_id as folderId, 
        color
      FROM notes
      WHERE id = ?
    `, [id]);
    
    if (notes.length === 0) {
      return null;
    }
    
    return notes[0];
  } catch (error) {
    console.error(`${id} ID'li not alınırken hata:`, error);
    throw error;
  }
};

// uuid yerine basit bir ID oluşturma fonksiyonu
function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export const createNote = async (db: Database, note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = new Date().toISOString();
    const id = generateId();
    
    await db.insert('notes', {
      id,
      title: note.title,
      content: note.content,
      created_at: now,
      updated_at: now,
      folder_id: note.folderId,
      color: note.color
    });
    
    return id;
  } catch (error) {
    console.error('Not oluşturulurken hata:', error);
    throw error;
  }
};

export const updateNote = async (db: Database, id: string, note: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    
    if (note.title !== undefined) updateData.title = note.title;
    if (note.content !== undefined) updateData.content = note.content;
    if (note.folderId !== undefined) updateData.folder_id = note.folderId;
    if (note.color !== undefined) updateData.color = note.color;
    
    await db.update('notes', updateData, 'id = ?', [id]);
  } catch (error) {
    console.error(`${id} ID'li not güncellenirken hata:`, error);
    throw error;
  }
};

export const deleteNote = async (db: Database, id: string): Promise<void> => {
  try {
    // Etiket ilişkileri cascade ile silinecek
    await db.delete('notes', 'id = ?', [id]);
  } catch (error) {
    console.error(`${id} ID'li not silinirken hata:`, error);
    throw error;
  }
};

// Klasör işlemleri
export const getFolders = async (db: Database): Promise<NoteFolder[]> => {
  try {
    const folders = await db.select<NoteFolder>(`
      SELECT 
        id, 
        name, 
        created_at as createdAt, 
        updated_at as updatedAt, 
        color
      FROM note_folders
      ORDER BY name ASC
    `);
    
    return folders;
  } catch (error) {
    console.error('Klasörler alınırken hata:', error);
    throw error;
  }
};

export const createFolder = async (db: Database, folder: Omit<NoteFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = new Date().toISOString();
    const id = generateId(); // uuid.v4() yerine
    
    await db.insert('note_folders', {
      id,
      name: folder.name,
      created_at: now,
      updated_at: now,
      color: folder.color
    });
    
    return id;
  } catch (error) {
    console.error('Klasör oluşturulurken hata:', error);
    throw error;
  }
};

export const updateFolder = async (db: Database, id: string, folder: Partial<Omit<NoteFolder, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    
    if (folder.name !== undefined) updateData.name = folder.name;
    if (folder.color !== undefined) updateData.color = folder.color;
    
    await db.update('note_folders', updateData, 'id = ?', [id]);
  } catch (error) {
    console.error(`${id} ID'li klasör güncellenirken hata:`, error);
    throw error;
  }
};

export const deleteFolder = async (db: Database, id: string): Promise<void> => {
  try {
    // İlk olarak, bu klasördeki notların folder_id değerini NULL olarak güncelle
    await db.update('notes', { folder_id: null, updated_at: new Date().toISOString() }, 'folder_id = ?', [id]);
    
    // Sonra klasörü sil
    await db.delete('note_folders', 'id = ?', [id]);
  } catch (error) {
    console.error(`${id} ID'li klasör silinirken hata:`, error);
    throw error;
  }
};

// Not arama ve filtreleme
export const searchNotes = async (db: Database, query: string): Promise<Note[]> => {
  try {
    const searchTerm = `%${query}%`;
    
    const notes = await db.select<Note>(`
      SELECT 
        notes.id, 
        notes.title, 
        notes.content, 
        notes.created_at as createdAt, 
        notes.updated_at as updatedAt, 
        notes.folder_id as folderId, 
        notes.color
      FROM notes
      WHERE title LIKE ? OR content LIKE ?
      ORDER BY notes.updated_at DESC
    `, [searchTerm, searchTerm]);
    
    return notes;
  } catch (error) {
    console.error('Notlar aranırken hata:', error);
    throw error;
  }
};

export const getNotesByFolder = async (db: Database, folderId: string | null): Promise<Note[]> => {
  try {
    let query = `
      SELECT 
        notes.id, 
        notes.title, 
        notes.content, 
        notes.created_at as createdAt, 
        notes.updated_at as updatedAt, 
        notes.folder_id as folderId, 
        notes.color
      FROM notes
    `;
    
    let params: any[] = [];
    
    if (folderId === null) {
      query += ` WHERE folder_id IS NULL `;
    } else {
      query += ` WHERE folder_id = ? `;
      params.push(folderId);
    }
    
    query += ` ORDER BY notes.updated_at DESC `;
    
    const notes = await db.select<Note>(query, params);
    
    return notes;
  } catch (error) {
    console.error('Klasöre göre notlar alınırken hata:', error);
    throw error;
  }
};
