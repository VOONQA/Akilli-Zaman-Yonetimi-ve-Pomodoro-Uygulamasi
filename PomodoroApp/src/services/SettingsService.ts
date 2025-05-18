import { Database } from '../types/database';
import { UserSettings, DEFAULT_SETTINGS } from '../models/UserSettings';

export class SettingsService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async initializeSettings(): Promise<void> {
    try {
      // Ayarlar tablosunu oluştur
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS user_settings (
          id INTEGER PRIMARY KEY NOT NULL,
          settings TEXT NOT NULL
        )
      `);

      // Eğer ayarlar tablosunda kayıt yoksa, varsayılan ayarları ekle
      const checkExistingSettings = await this.db.select<{ count: number }[]>(
        'SELECT COUNT(*) as count FROM user_settings WHERE id = 1'
      );

      const countValue = checkExistingSettings.length > 0 ? 
        (checkExistingSettings[0] as unknown as { count: number }).count : 0;

      if (countValue === 0) {
        await this.db.execute(
          'INSERT INTO user_settings (id, settings) VALUES (1, ?)',
          [JSON.stringify(DEFAULT_SETTINGS)]
        );
      }
    } catch (error) {
      console.error('Ayarlar başlatılırken hata oluştu:', error);
      throw error;
    }
  }

  async getUserSettings(): Promise<UserSettings> {
    try {
      const result = await this.db.select<{ settings: string }[]>(
        'SELECT settings FROM user_settings WHERE id = 1'
      );

      if (result.length === 0) {
        return DEFAULT_SETTINGS;
      }

      const settingsValue = (result[0] as unknown as { settings: string }).settings;
      return JSON.parse(settingsValue);
    } catch (error) {
      console.error('Ayarlar alınırken hata oluştu:', error);
      return DEFAULT_SETTINGS;
    }
  }

  async updateSettings(settings: UserSettings): Promise<void> {
    try {
      await this.db.execute(
        'UPDATE user_settings SET settings = ? WHERE id = 1',
        [JSON.stringify(settings)]
      );
    } catch (error) {
      console.error('Ayarlar güncellenirken hata oluştu:', error);
      throw error;
    }
  }

  async updateTimerSettings(timerSettings: Partial<UserSettings['timer']>): Promise<void> {
    try {
      const currentSettings = await this.getUserSettings();
      const updatedSettings = {
        ...currentSettings,
        timer: {
          ...currentSettings.timer,
          ...timerSettings,
        },
      };
      await this.updateSettings(updatedSettings);
    } catch (error) {
      console.error('Zamanlayıcı ayarları güncellenirken hata oluştu:', error);
      throw error;
    }
  }

  async updateNotificationSettings(notificationSettings: Partial<UserSettings['notifications']>): Promise<void> {
    try {
      const currentSettings = await this.getUserSettings();
      const updatedSettings = {
        ...currentSettings,
        notifications: {
          ...currentSettings.notifications,
          ...notificationSettings,
        },
      };
      await this.updateSettings(updatedSettings);
    } catch (error) {
      console.error('Bildirim ayarları güncellenirken hata oluştu:', error);
      throw error;
    }
  }

  async updateThemeSettings(themeSettings: Partial<UserSettings['theme']>): Promise<void> {
    try {
      const currentSettings = await this.getUserSettings();
      const updatedSettings = {
        ...currentSettings,
        theme: {
          ...currentSettings.theme,
          ...themeSettings,
        },
      };
      await this.updateSettings(updatedSettings);
    } catch (error) {
      console.error('Tema ayarları güncellenirken hata oluştu:', error);
      throw error;
    }
  }

  async updatePremiumStatus(isPremium: boolean): Promise<void> {
    try {
      const currentSettings = await this.getUserSettings();
      const updatedSettings = {
        ...currentSettings,
        isPremium,
      };
      await this.updateSettings(updatedSettings);
    } catch (error) {
      console.error('Premium durumu güncellenirken hata oluştu:', error);
      throw error;
    }
  }

  async acceptLegalTerms(accepted: boolean): Promise<void> {
    try {
      const currentSettings = await this.getUserSettings();
      const updatedSettings = {
        ...currentSettings,
        legalTermsAccepted: accepted,
      };
      await this.updateSettings(updatedSettings);
    } catch (error) {
      console.error('Yasal şartlar kabulü güncellenirken hata oluştu:', error);
      throw error;
    }
  }

  async acceptPrivacyPolicy(accepted: boolean): Promise<void> {
    try {
      const currentSettings = await this.getUserSettings();
      const updatedSettings = {
        ...currentSettings,
        privacyPolicyAccepted: accepted,
      };
      await this.updateSettings(updatedSettings);
    } catch (error) {
      console.error('Gizlilik politikası kabulü güncellenirken hata oluştu:', error);
      throw error;
    }
  }
}
