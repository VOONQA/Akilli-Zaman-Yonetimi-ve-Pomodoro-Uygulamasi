// Not veri modellerini tanımlıyoruz
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  folderId: string | null;
  color?: string;
}

// Klasör veri modelini tanımlıyoruz
export interface NoteFolder {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  color?: string;
}

// Etiket veri modelini tanımlıyoruz
export interface NoteTag {
  id: string;
  name: string;
  color?: string;
}

// Not filtrelerini tanımlıyoruz
export type NoteFilter = {
  searchText?: string;
  folderId?: string | null;
}
