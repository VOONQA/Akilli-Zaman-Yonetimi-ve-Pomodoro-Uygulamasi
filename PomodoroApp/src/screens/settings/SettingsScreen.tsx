import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabScreenProps } from '../../navigation/navigationTypes';
import ProfileScreen from '../profile/ProfileScreen';
import { useDatabase } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import { SettingsService } from '../../services/SettingsService';
import SwitchItem from '../../components/settings/SwitchItem';
import SliderItem from '../../components/settings/SliderItem';
import { useTheme } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = TabScreenProps<'Settings'>;

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const { db, isLoading } = useDatabase();
  const { settings, updateTimerSettings, updateNotificationSettings, togglePremium } = useSettings();
  const { colors } = useTheme();
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [paymentFormData, setPaymentFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
  });

  useEffect(() => {
    if (db && !isLoading) {
      const service = new SettingsService(db);
      
      // Ayarları başlat
      service.initializeSettings().catch(err => {
        console.error('Ayarlar başlatılırken hata:', err);
      });
    }
  }, [db, isLoading]);

  const openProfileModal = () => {
    setProfileModalVisible(true);
  };

  const closeProfileModal = () => {
    setProfileModalVisible(false);
  };

  // Premium özellikler için
  const showPremiumFeatures = () => {
    Alert.alert(
      'Premium Özellikler',
      'Premium sürüme geçerek sınırsız not tutma, gelişmiş istatistikler ve özel odaklanma müzikleri gibi avantajlardan faydalanabilirsiniz.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Premium Ol', onPress: () => {
          // Burada premium ekranına gitmek yerine şimdilik bir alert gösterelim
          Alert.alert('Premium', 'Premium özellikleri yakında!');
        }}
      ]
    );
  };

  // Yasal bilgiler için
  const showLegalInfo = () => {
    Alert.alert(
      'Yasal Bilgiler',
      'Gizlilik Politikası ve Kullanım Şartları içeriği burada görüntülenecek.',
      [{ text: 'Tamam', style: 'default' }]
    );
  };

  // Format helper fonksiyonları
  const formatMinutes = (value: number) => `${value} dakika`;
  const formatPomodoroCount = (value: number) => `${value} pomodoro`;
  
  // Ödeme fonksiyonunu güncelle
  const handlePremiumPurchase = () => {
    // Satın alma ekranını göster
    Alert.alert(
      "Premium'a Yükselt",
      "Ödeme ekranına yönlendiriliyorsunuz. Devam etmek istiyor musunuz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Devam Et", 
          onPress: () => setPaymentModalVisible(true)
        }
      ]
    );
  };

  // Değerleri güncelleme fonksiyonu
  const updatePaymentField = (field: string, value: string) => {
    setPaymentFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.onSurface }]}>Ayarlar</Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={openProfileModal}
        >
          <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Zamanlayıcı Ayarları */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Zamanlayıcı Ayarları</Text>
          
          <View style={styles.sliderItemsContainer}>
            <SliderItem
              title="Pomodoro Süresi"
              subtitle="Çalışma periyodu süresi"
              icon="time-outline"
              iconColor="#e74c3c"
              value={settings.timer.pomodoroMinutes}
              onValueChange={(value) => updateTimerSettings({ pomodoroMinutes: value })}
              minimumValue={1}
              maximumValue={60}
              valueFormat={formatMinutes}
            />
            
            <SliderItem
              title="Kısa Mola Süresi"
              subtitle="Kısa dinlenme süresi"
              icon="cafe-outline"
              iconColor="#27ae60"
              value={settings.timer.shortBreakMinutes}
              onValueChange={(value) => updateTimerSettings({ shortBreakMinutes: value })}
              minimumValue={1}
              maximumValue={30}
              valueFormat={formatMinutes}
            />
            
            <SliderItem
              title="Uzun Mola Süresi"
              subtitle="Uzun dinlenme süresi"
              icon="bed-outline"
              iconColor="#2980b9"
              value={settings.timer.longBreakMinutes}
              onValueChange={(value) => updateTimerSettings({ longBreakMinutes: value })}
              minimumValue={5}
              maximumValue={60}
              valueFormat={formatMinutes}
            />
            
            <SliderItem
              title="Uzun Mola Öncesi"
              subtitle="Pomodoro sayısı"
              icon="repeat-outline"
              iconColor="#8e44ad"
              value={settings.timer.pomodorosUntilLongBreak}
              onValueChange={(value) => updateTimerSettings({ pomodorosUntilLongBreak: value })}
              minimumValue={2}
              maximumValue={10}
              step={1}
              valueFormat={formatPomodoroCount}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <SwitchItem
              title="Otomatik Mola"
              subtitle="Molaları otomatik başlat"
              icon="play-outline"
              iconColor="#f39c12"
              value={settings.timer.autoStartBreaks}
              onValueChange={(value) => updateTimerSettings({ autoStartBreaks: value })}
            />
            
            <SwitchItem
              title="Otomatik Pomodoro"
              subtitle="Pomodoro'ları otomatik başlat"
              icon="refresh-outline"
              iconColor="#f39c12"
              value={settings.timer.autoStartPomodoros}
              onValueChange={(value) => updateTimerSettings({ autoStartPomodoros: value })}
            />
          </View>
        </View>
        
        {/* Bildirim Ayarları */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Bildirim Ayarları</Text>
          
          <SwitchItem
            title="Bildirimler"
            subtitle="Zamanlayıcı başlangıç ve bitiş bildirimleri"
            icon="notifications-outline"
            iconColor="#e74c3c"
            value={settings.notifications.notificationsEnabled}
            onValueChange={(value) => updateNotificationSettings({ notificationsEnabled: value })}
          />
          
          <SwitchItem
            title="Ses"
            subtitle="Bildirim sesi çalsın"
            icon="volume-high-outline"
            iconColor="#3498db"
            value={settings.notifications.soundEnabled}
            onValueChange={(value) => updateNotificationSettings({ soundEnabled: value })}
          />
          
          <SwitchItem
            title="Titreşim"
            subtitle="Bildirim geldiğinde titreşim olsun"
            icon="phone-portrait-outline"
            iconColor="#9b59b6"
            value={settings.notifications.vibrationEnabled}
            onValueChange={(value) => updateNotificationSettings({ vibrationEnabled: value })}
          />
          
          {/* Bildirim Ses Tipi */}
          <View style={styles.itemContainer}>
            <View style={styles.itemHeaderContainer}>
              <Ionicons name="volume-high-outline" size={24} color="#3498db" style={{ marginRight: 12 }} />
              <View>
                <Text style={[styles.itemTitle, { color: colors.onSurface }]}>Bildirim Sesi</Text>
                <Text style={[styles.itemSubtitle, { color: '#666' }]}>
                  Bildirimlerde kullanılacak ses tipi
                </Text>
              </View>
            </View>
            
            <View style={styles.radioGroup}>
              <TouchableOpacity 
                style={styles.radioOption}
                onPress={() => updateNotificationSettings({ soundType: 'default' })}
              >
                <View style={[
                  styles.radioCircle, 
                  settings.notifications.soundType === 'default' && styles.radioCircleSelected
                ]} />
                <Text style={styles.radioText}>Varsayılan</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.radioOption}
                onPress={() => updateNotificationSettings({ soundType: 'bell' })}
              >
                <View style={[
                  styles.radioCircle, 
                  settings.notifications.soundType === 'bell' && styles.radioCircleSelected
                ]} />
                <Text style={styles.radioText}>Zil</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.radioOption}
                onPress={() => updateNotificationSettings({ soundType: 'chime' })}
              >
                <View style={[
                  styles.radioCircle, 
                  settings.notifications.soundType === 'chime' && styles.radioCircleSelected
                ]} />
                <Text style={styles.radioText}>Çan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Premium */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Premium</Text>
          
          <TouchableOpacity 
            style={styles.premiumButton} 
            onPress={handlePremiumPurchase}
          >
            <View style={styles.premiumButtonContent}>
              <Ionicons name="star-outline" size={24} color="#FFD700" />
              <Text style={styles.premiumText}>Premium'a Yükselt - ₺49.99</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        
        {/* Yasal Bilgiler */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Yasal</Text>
          
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => Alert.alert(
              "Gizlilik Politikası",
              "1. Toplanan Bilgiler\nUygulamamız, kullanıcı deneyimini geliştirmek amacıyla sadece uygulama içi etkinlikler ve tercihler gibi temel kullanım verileri toplar.\n\n2. Veri Kullanımı\nToplanan veriler yalnızca uygulamanın performansını iyileştirmek ve kişiselleştirilmiş deneyim sunmak için kullanılır.\n\n3. Veri Paylaşımı\nKişisel verileriniz üçüncü taraflarla paylaşılmaz, satılmaz veya kiralanmaz.\n\n4. Veri Güvenliği\nVerilerinizi korumak için endüstri standardı güvenlik önlemleri uygulanmaktadır.\n\n5. Çocukların Gizliliği\nUygulamamız 13 yaş altı çocuklardan bilerek kişisel bilgi toplamaz.\n\n6. Değişiklikler\nGizlilik politikamızda yapılacak herhangi bir değişiklik bu sayfada duyurulacaktır.",
              [{ text: "Anladım" }]
            )}
          >
            <View style={styles.settingsItemContent}>
              <Ionicons name="shield-outline" size={24} color="#3498db" style={styles.settingsItemIcon} />
              <Text style={styles.settingsItemTitle}>Gizlilik Politikası</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => Alert.alert(
              "Kullanım Koşulları",
              "1. Genel Hükümler\nBu uygulamayı kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız. Uygulama içeriği izinsiz kopyalanamaz ve paylaşılamaz.\n\n2. Kullanım Hakları\nUygulama, kişisel kullanım için lisanslanmıştır. Ticari amaçla kullanılamaz.\n\n3. Sorumluluk Reddi\nUygulamanın kullanımından doğabilecek herhangi bir zararda sorumluluk kabul edilmez.\n\n4. Gizlilik\nKullanıcı bilgileri 3. şahıslarla paylaşılmaz ve sadece uygulama içinde kullanılır.\n\n5. Değişiklikler\nBu koşullar önceden bildirilmeksizin değiştirilebilir. Güncel koşullar için düzenli olarak kontrol etmeniz önerilir.",
              [{ text: "Anladım" }]
            )}
          >
            <View style={styles.settingsItemContent}>
              <Ionicons name="document-text-outline" size={24} color="#e74c3c" style={styles.settingsItemIcon} />
              <Text style={styles.settingsItemTitle}>Kullanım Koşulları</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Profil Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={profileModalVisible}
        onRequestClose={closeProfileModal}
      >
        <ProfileScreen onClose={closeProfileModal} />
      </Modal>

      {/* Ödeme Ekranı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.paymentModalContainer}>
          <View style={styles.paymentModalContent}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <Text style={styles.paymentModalTitle}>Premium Üyelik</Text>
              
              <View style={styles.premiumFeatures}>
                <Text style={styles.featuresTitle}>Premium Avantajları:</Text>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.featureText}>Gelişmiş istatistikler ve raporlama</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.featureText}>Sınırsız görev ve not oluşturma</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.featureText}>Odaklanma müzikleri ve beyaz gürültü</Text>
                </View>
              </View>
              
              <View style={styles.paymentOptions}>
                <TouchableOpacity 
                  style={[
                    styles.paymentOption, 
                    selectedPlan === 'yearly' ? styles.paymentOptionSelected : {}
                  ]}
                  onPress={() => setSelectedPlan('yearly')}
                >
                  <View style={styles.paymentOptionHeader}>
                    <Text style={styles.paymentOptionTitle}>Yıllık</Text>
                    <View style={styles.saveBadge}>
                      <Text style={styles.saveBadgeText}>%40 Tasarruf</Text>
                    </View>
                  </View>
                  <Text style={styles.paymentOptionPrice}>₺49.99</Text>
                  <Text style={styles.paymentOptionDescription}>Yıllık fatura, her ay ₺4.17</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.paymentOption, 
                    selectedPlan === 'monthly' ? styles.paymentOptionSelected : {}
                  ]}
                  onPress={() => setSelectedPlan('monthly')}
                >
                  <Text style={styles.paymentOptionTitle}>Aylık</Text>
                  <Text style={styles.paymentOptionPrice}>₺8.99</Text>
                  <Text style={styles.paymentOptionDescription}>Aylık fatura</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.paymentForm}>
                <Text style={styles.formSectionTitle}>Kişisel Bilgiler</Text>
                
                <Text style={styles.paymentLabel}>Ad Soyad</Text>
                <TextInput 
                  style={styles.paymentInput}
                  placeholder="Ad Soyad"
                  value={paymentFormData.fullName}
                  onChangeText={(text) => updatePaymentField('fullName', text)}
                />
                
                <Text style={styles.paymentLabel}>E-posta Adresi</Text>
                <TextInput 
                  style={styles.paymentInput}
                  placeholder="ornek@mail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={paymentFormData.email}
                  onChangeText={(text) => updatePaymentField('email', text)}
                />
                
                <Text style={styles.formSectionTitle}>Fatura Bilgileri</Text>
                
                <Text style={styles.paymentLabel}>Fatura Adresi</Text>
                <TextInput 
                  style={styles.paymentInput}
                  placeholder="Adres"
                  multiline={true}
                  numberOfLines={2}
                  value={paymentFormData.address}
                  onChangeText={(text) => updatePaymentField('address', text)}
                />
                
                <View style={styles.paymentRow}>
                  <View style={styles.paymentHalf}>
                    <Text style={styles.paymentLabel}>Şehir</Text>
                    <TextInput 
                      style={styles.paymentInput}
                      placeholder="Şehir"
                      value={paymentFormData.city}
                      onChangeText={(text) => updatePaymentField('city', text)}
                    />
                  </View>
                  
                  <View style={styles.paymentHalf}>
                    <Text style={styles.paymentLabel}>Posta Kodu</Text>
                    <TextInput 
                      style={styles.paymentInput}
                      placeholder="Posta Kodu"
                      keyboardType="number-pad"
                      value={paymentFormData.postalCode}
                      onChangeText={(text) => updatePaymentField('postalCode', text)}
                    />
                  </View>
                </View>
                
                <Text style={styles.formSectionTitle}>Ödeme Bilgileri</Text>
                
                <Text style={styles.paymentLabel}>Kart Üzerindeki İsim</Text>
                <TextInput 
                  style={styles.paymentInput}
                  placeholder="Kart Üzerindeki İsim"
                  value={paymentFormData.cardName}
                  onChangeText={(text) => updatePaymentField('cardName', text)}
                />
                
                <Text style={styles.paymentLabel}>Kart Numarası</Text>
                <View style={styles.cardNumberContainer}>
                  <TextInput 
                    style={styles.paymentInput}
                    placeholder="1234 5678 9012 3456"
                    keyboardType="number-pad"
                    value={paymentFormData.cardNumber}
                    onChangeText={(text) => updatePaymentField('cardNumber', text)}
                  />
                  <View style={styles.cardBrandsContainer}>
                    <Ionicons name="card-outline" size={20} color="#666" />
                  </View>
                </View>
                
                <View style={styles.paymentRow}>
                  <View style={styles.paymentHalf}>
                    <Text style={styles.paymentLabel}>Son Kullanma</Text>
                    <TextInput 
                      style={styles.paymentInput}
                      placeholder="AA/YY"
                      value={paymentFormData.cardExpiry}
                      onChangeText={(text) => updatePaymentField('cardExpiry', text)}
                    />
                  </View>
                  
                  <View style={styles.paymentHalf}>
                    <Text style={styles.paymentLabel}>CVV/CVC</Text>
                    <View style={styles.securityCodeContainer}>
                      <TextInput 
                        style={styles.paymentInput}
                        placeholder="123"
                        keyboardType="number-pad"
                        maxLength={4}
                        value={paymentFormData.cardCvv}
                        onChangeText={(text) => updatePaymentField('cardCvv', text)}
                      />
                      <Ionicons name="help-circle-outline" size={20} color="#666" style={styles.securityCodeHelp} />
                    </View>
                  </View>
                </View>
              </View>
              
              <View style={styles.paymentActions}>
                <TouchableOpacity 
                  style={styles.paymentCancelButton}
                  onPress={() => setPaymentModalVisible(false)}
                >
                  <Text style={styles.paymentCancelText}>İptal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.paymentConfirmButton}
                  onPress={() => {
                    // Ödeme bilgilerini AsyncStorage'a kaydet
                    const savePaymentData = async () => {
                      try {
                        const paymentData = {
                          plan: selectedPlan,
                          ...paymentFormData,
                          date: new Date().toISOString()
                        };
                        await AsyncStorage.setItem('paymentData', JSON.stringify(paymentData));
                        console.log('Ödeme bilgileri kaydedildi');
                      } catch (error) {
                        console.error('Ödeme bilgileri kaydedilirken hata oluştu:', error);
                      }
                    };
                    
                    savePaymentData();
                    setPaymentModalVisible(false);
                    togglePremium(true);
                    
                    // Kullanıcıya başarılı mesajı göster
                    Alert.alert(
                      "Başarılı", 
                      `Premium üyeliğiniz aktif edildi!
                      ${selectedPlan === 'yearly' ? 'Yıllık plan (₺49.99)' : 'Aylık plan (₺8.99)'} seçtiniz.
                      Bir sonraki ödeme tarihiniz: ${
                        new Date(
                          new Date().setMonth(
                            new Date().getMonth() + (selectedPlan === 'yearly' ? 12 : 1)
                          )
                        ).toLocaleDateString('tr-TR')
                      }`,
                      [{ text: "Harika!" }]
                    );
                  }}
                >
                  <Ionicons name="lock-closed" size={16} color="white" style={styles.paymentConfirmIcon} />
                  <Text style={styles.paymentConfirmText}>
                    {selectedPlan === 'yearly' ? '₺49.99 Öde' : '₺8.99 Öde'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.termsText}>
                Satın alma işlemini tamamlayarak Kullanım Koşulları ve Gizlilik Politikası'nı kabul etmiş olursunuz.
              </Text>
              
              <View style={styles.securePaymentInfo}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#666" />
                <Text style={styles.securePaymentText}>Tüm ödeme bilgileriniz güvenli bir şekilde işlenir</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemContainer: {
    backgroundColor: 'transparent',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  itemHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  radioGroup: {
    flexDirection: 'column',
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3498db',
    marginRight: 10,
  },
  radioCircleSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 6,
    borderColor: '#3498db',
  },
  radioText: {
    fontSize: 16,
  },
  premiumButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginVertical: 5,
  },
  premiumButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemIcon: {
    marginRight: 12,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  premiumSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  paymentModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
  },
  paymentModalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  paymentModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  premiumFeatures: {
    marginBottom: 15,
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
  },
  paymentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  paymentOption: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  paymentOptionSelected: {
    borderColor: '#3498db',
    backgroundColor: 'rgba(52, 152, 219, 0.05)',
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  saveBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  saveBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  paymentOptionPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 6,
  },
  paymentOptionDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  paymentForm: {
    marginBottom: 20,
  },
  paymentLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  paymentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentHalf: {
    width: '48%',
  },
  paymentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentCancelButton: {
    padding: 15,
    borderRadius: 5,
    backgroundColor: '#f1f1f1',
    width: '48%',
    alignItems: 'center',
  },
  paymentConfirmButton: {
    padding: 15,
    borderRadius: 5,
    backgroundColor: '#FF5722',
    width: '48%',
    alignItems: 'center',
  },
  paymentCancelText: {
    color: '#666',
    fontWeight: 'bold',
  },
  paymentConfirmText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sliderItemsContainer: {
    marginBottom: 10,
  },
  switchContainer: {
    marginTop: 5,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  cardNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  cardBrandsContainer: {
    position: 'absolute',
    right: 10,
    flexDirection: 'row',
  },
  securityCodeContainer: {
    position: 'relative',
  },
  securityCodeHelp: {
    position: 'absolute',
    right: 10,
    top: 12,
  },
  paymentConfirmIcon: {
    marginRight: 8,
  },
  securePaymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  securePaymentText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
});

export default SettingsScreen;
