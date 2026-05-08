import prisma from '../prisma';

/**
 * AppSettingsService handles reading and writing generic application settings
 * to the generic AppSetting table with JSON payloads.
 */
class AppSettingsService {
  /**
   * Get all settings grouped by category
   */
  async getAllSettings() {
    try {
      const settings = await prisma.appSetting.findMany();
      
      const grouped: Record<string, Record<string, any>> = {};
      
      settings.forEach(setting => {
        if (!grouped[setting.category]) {
          grouped[setting.category] = {};
        }
        grouped[setting.category][setting.settingKey] = setting.value;
      });
      
      return { success: true, data: grouped };
    } catch (error: any) {
      console.error('Error fetching all settings:', error);
      return { success: false, error: error.message, data: {} };
    }
  }

  /**
   * Get settings for a specific category
   * @param category The setting category (e.g., 'api', 'tax', 'general')
   */
  async getSettingsByCategory(category: string) {
    try {
      const settings = await prisma.appSetting.findMany({
        where: { category }
      });
      
      const result: Record<string, any> = {};
      settings.forEach(setting => {
        result[setting.settingKey] = setting.value;
      });
      
      return { success: true, data: result };
    } catch (error: any) {
      console.error(`Error fetching settings for category ${category}:`, error);
      return { success: false, error: error.message, data: {} };
    }
  }

  /**
   * Update or create a specific setting
   * @param category The setting category
   * @param key The specific setting key within the category
   * @param value The JSON value to store
   */
  async upsertSetting(category: string, key: string, value: any) {
    try {
      const setting = await prisma.appSetting.upsert({
        where: { settingKey: key },
        update: { 
          category, // just to ensure it's correct
          value 
        },
        create: {
          category,
          settingKey: key,
          value
        }
      });
      
      return { success: true, data: setting };
    } catch (error: any) {
      console.error(`Error upserting setting ${key}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update multiple settings for a category at once
   * @param category The setting category
   * @param settings Object mapping keys to values
   */
  async updateCategorySettings(category: string, settings: Record<string, any>) {
    try {
      const results = [];
      
      for (const [key, value] of Object.entries(settings)) {
        const result = await this.upsertSetting(category, key, value);
        if (!result.success) {
          throw new Error(`Failed to update ${key}: ${result.error}`);
        }
        results.push(result.data);
      }
      
      return { success: true, data: results };
    } catch (error: any) {
      console.error(`Error updating category ${category}:`, error);
      return { success: false, error: error.message };
    }
  }
}

export default new AppSettingsService();
