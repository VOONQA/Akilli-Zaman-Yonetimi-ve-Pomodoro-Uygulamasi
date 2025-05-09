import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotes } from '../../context/NoteContext';
import { NoteFolder } from '../../models/Note';

interface FolderSelectorProps {
  visible: boolean;
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onClose: () => void;
}

const FOLDER_COLORS = [
  '#5E60CE', // Mor (önceden #FF5722 - turuncu idi)
  '#4CAF50', // Yeşil
  '#2196F3', // Mavi
  '#9C27B0', // Mor
  '#F44336', // Kırmızı
  '#FFC107', // Sarı
  '#795548', // Kahverengi
  '#607D8B', // Gri-Mavi
];

const FolderSelector: React.FC<FolderSelectorProps> = ({
  visible,
  selectedFolderId,
  onSelect,
  onClose,
}) => {
  const { folders, createFolder, deleteFolder } = useNotes();
  
  // Yeni klasör oluşturma
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);
  
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Hata', 'Klasör adı boş olamaz');
      return;
    }
    
    try {
      console.log('Klasör oluşturuluyor:', newFolderName.trim(), selectedColor);
      const folderId = await createFolder({
        name: newFolderName.trim(),
        color: selectedColor,
      });
      
      console.log('Klasör oluşturuldu, ID:', folderId);
      
      // Yeni oluşturulan klasörü seç
      onSelect(folderId);
      
      // Form alanlarını temizle
      setNewFolderName('');
      setSelectedColor(FOLDER_COLORS[0]);
      setIsCreating(false);
    } catch (error) {
      console.error('Klasör oluşturulurken hata:', error);
      Alert.alert('Hata', 'Klasör oluşturulurken bir hata oluştu: ' + error);
    }
  };
  
  const handleDeleteFolder = async (folder: NoteFolder) => {
    Alert.alert(
      'Klasörü Sil',
      `"${folder.name}" klasörünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve bu klasördeki notlar klasörsüz hale gelecektir.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFolder(folder.id);
              
              // Eğer silinen klasör seçiliyse, klasör seçimini temizle
              if (selectedFolderId === folder.id) {
                onSelect(null);
              }
            } catch (error) {
              console.error('Klasör silinirken hata:', error);
              Alert.alert('Hata', 'Klasör silinirken bir hata oluştu');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  
  // Klasör oluşturma formunu render et
  const renderCreateForm = () => (
    <View style={styles.createFormContainer}>
      <Text style={styles.formTitle}>Yeni Klasör</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Klasör adı"
        value={newFolderName}
        onChangeText={setNewFolderName}
        maxLength={30}
        autoFocus
      />
      
      <Text style={styles.colorLabel}>Renk Seç:</Text>
      <View style={styles.colorSelector}>
        {FOLDER_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color && styles.selectedColorOption,
            ]}
            onPress={() => setSelectedColor(color)}
          />
        ))}
      </View>
      
      <View style={styles.formButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setIsCreating(false)}
        >
          <Text style={styles.cancelButtonText}>İptal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateFolder}
          disabled={!newFolderName.trim()}
        >
          <Text style={styles.createButtonText}>Oluştur</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Klasör öğesini render et
  const renderFolderItem = ({ item }: { item: NoteFolder }) => (
    <TouchableOpacity
      style={[
        styles.folderItem,
        selectedFolderId === item.id && styles.selectedFolderItem,
      ]}
      onPress={() => onSelect(item.id)}
    >
      <View style={styles.folderItemContent}>
        <View style={[styles.folderIcon, { backgroundColor: item.color || '#ccc' }]}>
          <Ionicons name="folder" size={18} color="#fff" />
        </View>
        <Text style={styles.folderName}>{item.name}</Text>
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteFolder(item)}
      >
        <Ionicons name="trash-outline" size={18} color="#5E60CE" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <View style={styles.header}>
              <Text style={styles.title}>Klasör Seçin</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {isCreating ? (
              renderCreateForm()
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.noFolderItem,
                    selectedFolderId === null && styles.selectedFolderItem,
                  ]}
                  onPress={() => onSelect(null)}
                >
                  <Ionicons name="document-text-outline" size={20} color="#666" />
                  <Text style={styles.noFolderText}>Klasörsüz</Text>
                </TouchableOpacity>
                
                <FlatList
                  data={folders}
                  renderItem={renderFolderItem}
                  keyExtractor={(item) => item.id}
                  style={styles.folderList}
                  contentContainerStyle={styles.folderListContent}
                />
                
                <TouchableOpacity
                  style={styles.addFolderButton}
                  onPress={() => setIsCreating(true)}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#5E60CE" />
                  <Text style={styles.addFolderText}>Yeni Klasör</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxHeight: '80%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noFolderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  noFolderText: {
    marginLeft: 10,
    fontSize: 16,
  },
  folderList: {
    maxHeight: 300,
  },
  folderListContent: {
    paddingBottom: 10,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedFolderItem: {
    backgroundColor: '#f5f5f5',
  },
  folderItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  folderIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  folderName: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 5,
  },
  addFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addFolderText: {
    color: '#5E60CE',
    marginLeft: 5,
    fontWeight: '500',
  },
  createFormContainer: {
    padding: 15,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  colorLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 5,
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: '#000',
  },
  formButtons: {
    flexDirection: 'row',
  },
  cancelButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    borderRadius: 5,
    marginRight: 5,
  },
  cancelButtonText: {
    color: '#666',
  },
  createButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#5E60CE',
    borderRadius: 5,
    marginLeft: 5,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default FolderSelector;
