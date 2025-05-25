import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotes } from '../../context/NoteContext';
import { Note, NoteFolder } from '../../models/Note';
import NoteEditor from './NoteEditor';

interface NoteModalProps {
  visible: boolean;
  onClose: () => void;
}

const FOLDER_COLORS = [
  '#5E60CE', // Mor
  '#4CAF50', // Yeşil
  '#2196F3', // Mavi
  '#9C27B0', // Mor
  '#F44336', // Kırmızı
  '#FFC107', // Sarı
  '#795548', // Kahverengi
  '#607D8B', // Gri-Mavi
];

const NoteModal: React.FC<NoteModalProps> = ({ visible, onClose }) => {
  const { notes, folders, loading, error, refreshNotes, deleteNote, createFolder } = useNotes();
  
  // Modal içinde farklı görünümleri yönetmek için state
  const [activeView, setActiveView] = useState<'list' | 'editor' | 'detail' | 'folders'>('list');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // Notları filtrele
  const getFilteredNotes = () => {
    let filtered = [...notes];
    
    // Klasör filtreleme
    if (selectedFolder) {
      filtered = filtered.filter(note => note.folderId === selectedFolder);
    }
    
    // Arama filtreleme
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(query) || 
        note.content.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };
  
  // Yeni not oluştur
  const handleCreateNote = () => {
    setSelectedNote(null);
    setActiveView('editor');
  };
  
  // Not düzenle
  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setActiveView('editor');
  };
  
  // Not sil
  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
      await refreshNotes();
    } catch (error) {
      console.error('Not silinirken hata:', error);
    }
  };
  
  // Modal açıldığında notları yenile
  useEffect(() => {
    if (visible) {
      refreshNotes();
    }
  }, [visible]);
  
  // Not listesini render etme
  const renderNoteItem = ({ item }: { item: Note }) => {
    // Not tarihini düzgün formatta göster
    const createdDate = new Date(item.createdAt);
    const updatedDate = new Date(item.updatedAt);
    
    const formattedCreatedDate = createdDate.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    const formattedUpdatedDate = updatedDate.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Klasör rengini bul
    const folder = folders.find(f => f.id === item.folderId);
    const folderColor = folder?.color || '#cccccc';
    
    const isSelected = selectedNotes.includes(item.id);
    
    return (
      <TouchableOpacity 
        style={[
          styles.noteItem,
          isSelected && styles.selectedNoteItem
        ]}
        onPress={() => {
          if (isSelectionMode) {
            // Seçim modunda - notu seç/kaldır
            if (isSelected) {
              setSelectedNotes(selectedNotes.filter(id => id !== item.id));
            } else {
              setSelectedNotes([...selectedNotes, item.id]);
            }
          } else {
            // Normal mod - notu düzenle
            handleEditNote(item);
          }
        }}
        onLongPress={() => {
          if (!isSelectionMode) {
            setIsSelectionMode(true);
            setSelectedNotes([item.id]);
          }
        }}
        delayLongPress={300}
      >
        <View style={styles.noteHeader}>
          {isSelectionMode && (
            <View style={[
              styles.checkBox, 
              isSelected && styles.checkedBox
            ]}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
          )}
          <Text style={[styles.noteTitle, isSelectionMode && {marginLeft: 10}]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.folderIndicator, { backgroundColor: folderColor }]}>
            <Text style={styles.folderName}>{folder?.name || 'Genel'}</Text>
          </View>
        </View>
        
        <Text style={styles.noteContent} numberOfLines={2}>{item.content}</Text>
        
        <View style={styles.noteFooter}>
          <View style={styles.dateContainer}>
            <Text style={styles.noteDate}>Oluşturulma: {formattedCreatedDate}</Text>
            {formattedCreatedDate !== formattedUpdatedDate && (
              <Text style={styles.noteDate}>Güncelleme: {formattedUpdatedDate}</Text>
            )}
          </View>
          
          {!isSelectionMode && (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteNote(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#5E60CE" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  // Klasör filtreleme butonları
  const renderFolderButtons = () => {
    return (
      <View style={styles.folderListContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{id: 'all', name: 'Tümü', color: '#5E60CE'}, ...folders]}
          keyExtractor={(item) => item.id}
          renderItem={({item}) => {
            const isSelected = item.id === 'all' 
              ? selectedFolder === null 
              : selectedFolder === item.id;
            
            return (
              <TouchableOpacity 
                style={[
                  styles.folderButton, 
                  isSelected && styles.selectedFolderButton,
                  item.id !== 'all' && { borderLeftColor: item.color || '#cccccc' }
                ]}
                onPress={() => setSelectedFolder(item.id === 'all' ? null : item.id)}
              >
                <Text style={[
                  styles.folderButtonText,
                  isSelected && styles.selectedFolderButtonText
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.folderListContent}
        />
      </View>
    );
  };
  
  // Ana görünüm: Not listesi
  const renderNoteList = () => {
    const filteredNotes = getFilteredNotes();
    
    return (
      <View style={styles.listContainer}>
        {isSelectionMode ? (
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionText}>
              {selectedNotes.length} not seçildi
            </Text>
            <View style={styles.selectionButtons}>
              <TouchableOpacity 
                style={styles.cancelSelectionButton}
                onPress={() => {
                  setIsSelectionMode(false);
                  setSelectedNotes([]);
                }}
              >
                <Text style={styles.cancelSelectionText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteSelectedButton}
                onPress={() => {
                  if (selectedNotes.length > 0) {
                    Alert.alert(
                      'Notları Sil',
                      `${selectedNotes.length} notu silmek istediğinize emin misiniz?`,
                      [
                        {
                          text: 'İptal',
                          style: 'cancel',
                        },
                        {
                          text: 'Sil',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              // Seçili notları sil
                              for (const noteId of selectedNotes) {
                                await deleteNote(noteId);
                              }
                              await refreshNotes();
                              setIsSelectionMode(false);
                              setSelectedNotes([]);
                            } catch (error) {
                              console.error('Notlar silinirken hata:', error);
                              Alert.alert('Hata', 'Notlar silinirken bir hata oluştu');
                            }
                          }
                        }
                      ]
                    );
                  }
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={styles.deleteSelectedText}>Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Not ara..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {renderFolderButtons()}
        
        {filteredNotes.length > 0 ? (
          <FlatList
            data={filteredNotes}
            renderItem={renderNoteItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.notesList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>Not bulunamadı</Text>
          </View>
        )}
        
        {!isSelectionMode && (
          <TouchableOpacity style={styles.addButton} onPress={handleCreateNote}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  // Not editörü görünümü
  const renderEditor = () => {
    return (
      <NoteEditor
        note={selectedNote}
        onSave={() => {
          setActiveView('list');
          refreshNotes();
        }}
        onCancel={() => setActiveView('list')}
      />
    );
  };
  
  // Klasör görünümünü render et
  const renderFolders = () => {
    return (
      <View style={styles.foldersContainer}>
        <View style={styles.folderHeader}>
          <Text style={styles.folderHeaderTitle}>Klasörler</Text>
          <TouchableOpacity 
            style={styles.addFolderButton}
            onPress={() => setShowFolderModal(true)}
          >
            <Ionicons name="add" size={24} color="#5E60CE" />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={folders}
          keyExtractor={(item) => item.id}
          renderItem={({item}) => (
            <TouchableOpacity 
              style={[styles.folderListItem, {borderLeftColor: item.color || '#ccc'}]}
              onPress={() => {
                setSelectedFolder(item.id);
                setActiveView('list');
              }}
            >
              <View style={styles.folderItemContent}>
                <Ionicons name="folder" size={24} color={item.color || '#ccc'} />
                <Text style={styles.folderItemName}>{item.name}</Text>
              </View>
              <Text style={styles.folderItemCount}>
                {notes.filter(note => note.folderId === item.id).length} not
              </Text>
            </TouchableOpacity>
          )}
          ListHeaderComponent={() => (
            <TouchableOpacity 
              style={[styles.folderListItem, {borderLeftColor: '#5E60CE'}]}
              onPress={() => {
                setSelectedFolder(null);
                setActiveView('list');
              }}
            >
              <View style={styles.folderItemContent}>
                <Ionicons name="documents-outline" size={24} color="#5E60CE" />
                <Text style={styles.folderItemName}>Tümü</Text>
              </View>
              <Text style={styles.folderItemCount}>{notes.length} not</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };
  
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            {activeView === 'folders' ? (
              <>
                <Text style={styles.title}>Klasörlerim</Text>
                <TouchableOpacity onPress={() => setActiveView('list')}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </>
            ) : activeView === 'list' ? (
              <>
                <Text style={styles.title}>Notlarım</Text>
                <View style={styles.headerButtons}>
                  <TouchableOpacity 
                    style={styles.folderIcon}
                    onPress={() => setActiveView('folders')}
                  >
                    <Ionicons name="folder-outline" size={24} color="#5E60CE" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => setActiveView('list')}>
                  <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>
                  {selectedNote ? 'Notu Düzenle' : 'Yeni Not'}
                </Text>
                <View style={{ width: 24 }} />
              </>
            )}
          </View>
          
          {/* Hata mesajı */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {/* Loading göstergesi */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF5722" />
            </View>
          )}
          
          {/* İçerik */}
          {activeView === 'list' ? renderNoteList() : 
           activeView === 'editor' ? renderEditor() :
           activeView === 'folders' ? renderFolders() : null}
        </KeyboardAvoidingView>
      </View>

      {/* Modern klasör oluşturma modalı */}
      <Modal
        visible={showFolderModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFolderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Klasör Seçin</Text>
              <TouchableOpacity onPress={() => setShowFolderModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Yeni Klasör</Text>
            
            <TextInput
              style={styles.folderNameInput}
              placeholder="Klasör adı"
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus={true}
            />
            
            <Text style={styles.colorLabel}>Renk Seç:</Text>
            <View style={styles.colorSelector}>
              {FOLDER_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColorOption
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowFolderModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.createButton}
                onPress={async () => {
                  if (newFolderName.trim()) {
                    try {
                      const folderId = await createFolder({
                        name: newFolderName.trim(),
                        color: selectedColor
                      });
                      await refreshNotes();
                      setNewFolderName('');
                      setShowFolderModal(false);
                      setSelectedFolder(folderId);
                    } catch (error) {
                      console.error('Klasör oluşturulurken hata:', error);
                      Alert.alert('Hata', 'Klasör oluşturulamadı.');
                    }
                  }
                }}
              >
                <Text style={styles.createButtonText}>Oluştur</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
  },
  folderListContainer: {
    marginVertical: 10,
    height: 50,
  },
  folderListContent: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  folderButton: {
    height: 36,
    paddingHorizontal: 16,
    marginRight: 10,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedFolderButton: {
    backgroundColor: '#5E60CE',
  },
  folderButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedFolderButtonText: {
    color: '#fff',
  },
  notesList: {
    padding: 10,
  },
  noteItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF5722',
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
    marginBottom: 5,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  folderIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 5,
  },
  folderName: {
    fontSize: 10,
    color: '#fff',
  },
  noteContent: {
    color: '#555',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flex: 1,
  },
  noteDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  deleteButton: {
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#888',
    marginTop: 10,
    fontSize: 16,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#5E60CE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 5,
  },
  errorText: {
    color: '#d32f2f',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderIcon: {
    marginRight: 15,
  },
  foldersContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  folderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  folderHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addFolderButton: {
    padding: 5,
  },
  folderListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    borderLeftWidth: 4,
  },
  folderItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderItemName: {
    fontSize: 16,
    marginLeft: 10,
  },
  folderItemCount: {
    fontSize: 14,
    color: '#888',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  folderNameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  colorLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    justifyContent: 'flex-start',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: '#333',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 5,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#5E60CE',
    padding: 12,
    borderRadius: 5,
    marginLeft: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectedNoteItem: {
    backgroundColor: '#efe9ff',
    borderLeftColor: '#5E60CE',
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#5E60CE',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#5E60CE',
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 10,
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelSelectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  cancelSelectionText: {
    color: '#666',
  },
  deleteSelectedButton: {
    backgroundColor: '#5E60CE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteSelectedText: {
    color: '#fff',
    marginLeft: 4,
  },
});

export default NoteModal;
