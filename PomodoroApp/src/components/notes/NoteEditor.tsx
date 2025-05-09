import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActionSheetIOS,
  Alert,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotes } from '../../context/NoteContext';
import { Note, NoteFolder } from '../../models/Note';
import FolderSelector from './FolderSelector';

interface NoteEditorProps {
  note: Note | null; // null ise yeni not
  onSave: () => void;
  onCancel: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onCancel }) => {
  const { createNote, updateNote, folders } = useNotes();
  
  // Form state
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(note?.folderId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [creationDate, setCreationDate] = useState<string | null>(note?.createdAt || null);
  
  // Modals
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  
  // Refs
  const contentInputRef = useRef<TextInput>(null);
  
  // Yeni not için oluşturma tarihi oluştur
  useEffect(() => {
    if (!note) {
      setCreationDate(new Date().toISOString());
    }
  }, [note]);
  
  // Kaydetme işlemi
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Hata', 'Başlık boş olamaz');
      return;
    }
    
    try {
      setIsSaving(true);
      
      if (note) {
        // Mevcut notu güncelle
        await updateNote(note.id, {
          title,
          content,
          folderId: selectedFolderId,
        });
      } else {
        // Yeni not oluştur - createdAt özelliğini göndermeyelim
        await createNote({
          title,
          content, 
          folderId: selectedFolderId
          // createdAt kısmını kaldırdık, service bunu otomatik ekleyecek
        });
      }
      
      onSave();
    } catch (error) {
      console.error('Not kaydedilirken hata:', error);
      Alert.alert('Hata', 'Not kaydedilirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Klasör seçimi
  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    setFolderModalVisible(false);
  };
  
  // Seçili klasör
  const selectedFolder = selectedFolderId
    ? folders.find(folder => folder.id === selectedFolderId)
    : null;
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.editorContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Başlık"
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={() => contentInputRef.current?.focus()}
            maxLength={100}
            returnKeyType="next"
          />
          
          {creationDate && (
            <Text style={styles.dateText}>
              Oluşturulma: {new Date(creationDate).toLocaleDateString('tr-TR', {
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          )}
          
          <View style={styles.metaContainer}>
            <TouchableOpacity
              style={styles.folderSelector}
              onPress={() => setFolderModalVisible(true)}
            >
              <Ionicons name="folder-outline" size={18} color="#666" />
              <Text style={styles.folderText}>
                {selectedFolder ? selectedFolder.name : 'Klasör Seç'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>
          
          <TextInput
            ref={contentInputRef}
            style={styles.contentInput}
            placeholder="Notunuzu yazın..."
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
      
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isSaving}
        >
          <Text style={styles.cancelButtonText}>İptal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.savingButton]}
          onPress={handleSave}
          disabled={isSaving || !title.trim()}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Klasör Seçici Modal */}
      <FolderSelector
        visible={folderModalVisible}
        selectedFolderId={selectedFolderId}
        onSelect={handleFolderSelect}
        onClose={() => setFolderModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  editorContainer: {
    flex: 1,
    padding: 15,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  folderSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
  },
  folderText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 5,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 300,
  },
  toolbar: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    marginRight: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: '#eee',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 10,
    marginLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: '#5E60CE',
  },
  savingButton: {
    backgroundColor: '#B39DDB',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  noteItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#5E60CE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyButton: {
    backgroundColor: '#5E60CE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
  dateText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 15,
    fontStyle: 'italic',
  },
});

export default NoteEditor;
