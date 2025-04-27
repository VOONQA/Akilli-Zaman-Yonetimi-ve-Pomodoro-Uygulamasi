import React from 'react';
import { FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { YouTubeCategories } from '../../types/youtube';

interface YouTubeCategoryProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const YouTubeCategory: React.FC<YouTubeCategoryProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  const categories = Object.values(YouTubeCategories);

  return (
    <FlatList
      data={categories}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === item && styles.selectedCategoryButton
          ]}
          onPress={() => onSelectCategory(item)}
        >
          <Text 
            style={[
              styles.categoryButtonText,
              selectedCategory === item && styles.selectedCategoryText
            ]}
          >
            {item}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  contentContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f5f5f5',
  },
  selectedCategoryButton: {
    backgroundColor: '#FF0000',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default YouTubeCategory;
