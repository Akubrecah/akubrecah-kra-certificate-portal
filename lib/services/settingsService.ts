import prisma from '../prisma';

/**
 * SettingsService handles system-wide configurations and service toggles
 * Integrated with Neon/PostgreSQL via Prisma
 */
class SettingsService {
  /**
   * Get all service settings
   * @returns {Promise<{success: boolean, data: any[], error?: string}>}
   */
  async getServiceSettings() {
    try {
      const settings = await prisma.serviceSetting.findMany({
        orderBy: {
          serviceName: 'asc',
        },
      });

      const defaults = [
        { service_key: 'register_kra_pin', is_active: true, service_name: 'Register KRA PIN' },
        { service_key: 'renew_kra_password', is_active: true, service_name: 'Renew KRA Password' },
        { service_key: 'change_kra_email', is_active: true, service_name: 'Change KRA Email' },
        { service_key: 'file_nil_returns', is_active: true, service_name: 'File Nil Returns' },
        { service_key: 'register_nssf', is_active: true, service_name: 'Register NSSF' },
        { service_key: 'register_shif', is_active: true, service_name: 'Register SHIF' },
        { service_key: 'kra_retrieval', is_active: true, service_name: 'KRA Retrieval' }
      ];

      if (settings.length === 0) {
        return { success: true, data: defaults };
      }

      return { 
        success: true, 
        data: settings.map(s => ({
          service_key: s.serviceKey,
          service_name: s.serviceName,
          is_active: s.isActive,
          description: s.description
        }))
      };
    } catch (error: any) {
      console.error('Error fetching service settings:', error);
      
      // Fallback defaults if the database is not seeded or reachable
      return { 
        success: false, 
        error: error.message,
        data: [
          { service_key: 'register_kra_pin', is_active: true, service_name: 'Register KRA PIN' },
          { service_key: 'renew_kra_password', is_active: true, service_name: 'Renew KRA Password' },
          { service_key: 'change_kra_email', is_active: true, service_name: 'Change KRA Email' },
          { service_key: 'file_nil_returns', is_active: true, service_name: 'File Nil Returns' },
          { service_key: 'register_nssf', is_active: true, service_name: 'Register NSSF' },
          { service_key: 'register_shif', is_active: true, service_name: 'Register SHIF' },
          { service_key: 'kra_retrieval', is_active: true, service_name: 'KRA Retrieval' }
        ]
      };
    }
  }

  /**
   * Create a new service setting
   * @param {Object} data - Service data
   */
  async createServiceSetting(data: { key: string, name: string, description?: string, isActive?: boolean }) {
    try {
      const setting = await prisma.serviceSetting.create({
        data: {
          serviceKey: data.key,
          serviceName: data.name,
          description: data.description || '',
          isActive: data.isActive ?? true,
        },
      });

      return { success: true, data: setting };
    } catch (error: any) {
      console.error('Error creating service setting:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a specific service setting
   * @param {string} key - Service key
   * @param {boolean} isActive - New status
   */
  async updateServiceSetting(key: string, isActive: boolean) {
    try {
      const setting = await prisma.serviceSetting.update({
        where: { serviceKey: key },
        data: { isActive },
      });

      return { success: true, data: setting };
    } catch (error: any) {
      console.error(`Error updating service setting ${key}:`, error);
      return { success: false, error: error.message };
    }
  }
}

export default new SettingsService();
