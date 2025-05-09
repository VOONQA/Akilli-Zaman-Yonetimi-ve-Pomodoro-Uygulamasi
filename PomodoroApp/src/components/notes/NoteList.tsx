import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotes } from '../../context/NoteContext';
import { Note, NoteFolder } from '../../models/Note';

interface NoteListProps {
  onSelectNote: (note: Note) => void;
  onAddNote: () => void;
  selectedFolderId?: string | null;
  searchQuery?: string;
}

const NoteList: React.FC<NoteListProps> = ({
  onSelectNote,
  onAddNote,
  selectedFolderId,
  searchQuery = ''
}) => {
  const { notes, folders, loading, error, refreshNotes } = useNotes();
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  
  // Notları filtrele
  useEffect(() => {
    let filtered = [...notes];
    
    // Klasör filtreleme
    if (selectedFolderId !== undefined) {
      filtered = filtered.filter(note => note.folderId === selectedFolderId);
    }
    
    // Arama filtreleme
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(query) || 
        note.content.toLowerCase().includes(query)
      );
    }
    
    // Tarihe göre sırala (en son güncellenen başta)
    filtered.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    
    setFilteredNotes(filtered);
  }, [notes, selectedFolderId, searchQuery]);
  
  // Bileşen yüklendiğinde notları yenile
  useEffect(() => {
    refreshNotes();
  }, []);
  
  // Tarihi formatla
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Not öğesini render et
  const renderNoteItem = ({ item }: { item: Note }) => {
    // Klasör bilgisini bul
    const folder = folders.find(f => f.id === item.folderId);
    
    return (
      <TouchableOpacity
        style={styles.noteItem}
        onPress={() => onSelectNote(item)}
      >
        <View style={styles.noteHeader}>
          <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
        </View>
        
        <Text style={styles.noteContent} numberOfLines={2}>{item.content}</Text>
        
        <View style={styles.noteFooter}>
          <Text style={styles.noteDate}>{formatDate(item.updatedAt)}</Text>
          
          {folder && (
            <View style={[styles.folderTag, { backgroundColor: folder.color || '#ccc' }]}>
              <Text style={styles.folderTagText}>{folder.name}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  // Boş liste durumunu render et
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={50} color="#ccc" />
      <Text style={styles.emptyText}>
        {searchQuery 
          ? 'Aramanızla eşleşen not bulunamadı'
          : selectedFolderId !== undefined
            ? 'Bu klasörde henüz not yok'
            : 'Henüz not eklenmemiş'
        }
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={onAddNote}
      >
        <Text style={styles.emptyButtonText}>Yeni Not Ekle</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Hata durumunu render et
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#f44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={refreshNotes}
        >
          <Text style={styles.retryButtonText}>Yeniden Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Yükleme durumunu render et
  if (loading && notes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={styles.loadingText}>Notlar yükleniyor...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <FlatList
        data={filteredNotes}
        renderItem={renderNoteItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
      />
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={onAddNote}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingBottom: 80,
  },
  noteItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  noteContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteDate: {
    fontSize: 12,
    color: '#999',
  },
  folderTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  folderTagText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    color: '#888',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#f44336',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#888',
    marginTop: 10,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default NoteList;
