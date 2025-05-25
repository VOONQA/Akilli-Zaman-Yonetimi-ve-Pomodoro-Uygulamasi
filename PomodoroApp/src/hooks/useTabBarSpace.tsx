import { StyleSheet, View, ViewStyle } from 'react-native';
import { TAB_BAR_HEIGHT } from '../navigation/TabNavigator';

// Tab barın olduğu ekranların en altına boşluk ekleme amaçlı hook
export function useTabBarSpace() {
  return {
    // Ekranın altına tab bar yüksekliğinde boşluk ekler
    tabBarSpacerStyle: {
      height: TAB_BAR_HEIGHT,
    } as ViewStyle,
    
    // Ekranın en altına eklenecek boşluk bileşeni
    TabBarSpacer: () => <View style={{ height: TAB_BAR_HEIGHT }} />,
    
    // Daha yaygın kullanılan bir pattern: container stiline eklenecek paddingBottom
    containerStyle: {
      paddingBottom: TAB_BAR_HEIGHT,
    } as ViewStyle
  };
} 