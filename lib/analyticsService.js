// analyticsService.js
import { supabase } from './supabaseClient';

class AnalyticsService {
  // Update and return the "Trusted by X Kenyans" counter
  // Update and return the "Trusted by X Kenyans" counter
  async getTrustedByCount() {
    try {
      // First, check if the user_metrics table exists and has data
      const { data, error } = await supabase
        .from('user_metrics')
        .select('total_users')
        .order('metric_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      // If we have data, return it
      if (data && data.total_users) {
        console.log('[ANALYTICS] Found user count:', data.total_users);
        return data.total_users;
      }

      // If no data or error, create a new entry with a starting count based on sessions
      console.log('[ANALYTICS] No user metrics found, creating initial record');

      // Count completed sessions to get a real number
      const { count: sessionsCount, error: sessionsError } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Default starting value (adjust as needed)
      let initialCount = 0;

      if (!sessionsError) {
        // Use real session count or add a buffer (e.g., 0 + real count)
        initialCount = sessionsCount || 0;
        console.log('[ANALYTICS] Using session count as base:', initialCount);
      }

      // Create a new metrics record with today's date
      const today = new Date().toISOString().split('T')[0];
      const { error: insertError } = await supabase
        .from('user_metrics')
        .insert([{
          metric_date: today,
          total_users: initialCount,
          new_users: 0,
          active_users: 1
        }]);

      if (insertError) {
        console.error('[ANALYTICS] Error creating initial metrics:', insertError);
        return 0; // Fallback to a minimal count if we can't create a record
      }

      console.log('[ANALYTICS] Created initial metrics with count:', initialCount);
      return initialCount;
    } catch (error) {
      console.error('[ANALYTICS] Error getting trusted by count:', error);
      // Return a minimal fallback value if there's an error
      return 0;
    }
  }

  // Track new user registration
  async trackNewUser(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if we already have a record for today
      const { data: existingRecord, error: checkError } = await supabase
        .from('user_metrics')
        .select('*')
        .eq('metric_date', today)
        .maybeSingle(); // Changed to maybeSingle

      if (checkError) throw checkError;

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('user_metrics')
          .update({
            total_users: existingRecord.total_users + 1,
            new_users: existingRecord.new_users + 1
          })
          .eq('metric_date', today);

        if (error) throw error;
      } else {
        // Get the most recent record to calculate the new total
        const { data: lastRecord, error: fetchError } = await supabase
          .from('user_metrics')
          .select('total_users')
          .order('metric_date', { ascending: false })
          .limit(1)
          .maybeSingle(); // Changed to maybeSingle

        if (fetchError) throw fetchError;

        const previousTotal = lastRecord?.total_users || 0;

        // Create new record
        const { error } = await supabase
          .from('user_metrics')
          .insert([{
            metric_date: today,
            total_users: previousTotal + 1,
            new_users: 1,
            active_users: 1
          }]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error tracking new user:', error);
    }
  }

  // Track user session activity
  async trackUserActivity(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if we already have a record for today
      const { data: existingRecord, error: checkError } = await supabase
        .from('user_metrics')
        .select('*')
        .eq('metric_date', today)
        .maybeSingle(); // Changed to maybeSingle

      if (checkError) throw checkError;

      if (existingRecord) {
        // Update active users count (could be more sophisticated with unique users tracking)
        const { error } = await supabase
          .from('user_metrics')
          .update({
            active_users: existingRecord.active_users + 1
          })
          .eq('metric_date', today);

        if (error) throw error;
      } else {
        // Create new record for today if it doesn't exist
        // Similar to the trackNewUser function, get previous total
        const { data: lastRecord, error: fetchError } = await supabase
          .from('user_metrics')
          .select('total_users')
          .order('metric_date', { ascending: false })
          .limit(1)
          .maybeSingle(); // Changed to maybeSingle

        if (fetchError) throw fetchError;

        const previousTotal = lastRecord?.total_users || 0;

        // Create new record
        const { error } = await supabase
          .from('user_metrics')
          .insert([{
            metric_date: today,
            total_users: previousTotal,
            new_users: 0,
            active_users: 1
          }]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error tracking user activity:', error);
    }
  }

  // Track transactions
  async trackTransaction(amount, isSuccess) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if we already have a record for today
      const { data: existingRecord, error: checkError } = await supabase
        .from('transaction_metrics')
        .select('*')
        .eq('metric_date', today)
        .maybeSingle(); // Changed to maybeSingle

      if (checkError) throw checkError;

      if (existingRecord) {
        // Update existing record
        const newSuccessRate = isSuccess
          ? (existingRecord.success_count + 1) / (existingRecord.transaction_count + 1)
          : existingRecord.success_count / (existingRecord.transaction_count + 1);

        const { error } = await supabase
          .from('transaction_metrics')
          .update({
            total_amount: existingRecord.total_amount + amount,
            transaction_count: existingRecord.transaction_count + 1,
            success_count: isSuccess ? existingRecord.success_count + 1 : existingRecord.success_count,
            success_rate: newSuccessRate
          })
          .eq('metric_date', today);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('transaction_metrics')
          .insert([{
            metric_date: today,
            total_amount: amount,
            transaction_count: 1,
            success_count: isSuccess ? 1 : 0,
            success_rate: isSuccess ? 1.0 : 0.0
          }]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error tracking transaction:', error);
    }
  }

  // Track PIN usage
  async trackPinUsage(pinType, isIndividual) {
    try {
      // Update pin usage metrics
      const { error } = await supabase
        .from('pin_usage_metrics')
        .insert([{
          pin_type: pinType,
          is_individual: isIndividual,
          used_at: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking PIN usage:', error);
    }
  }

  // Track return completion
  async trackReturnCompletion(status) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Update return metrics table
      const { error } = await supabase
        .from('return_completion_metrics')
        .insert([{
          status: status, // 'completed', 'pending', 'error'
          completed_at: new Date().toISOString(),
          date: today
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking return completion:', error);
    }
  }

  /**
   * Log a general activity to the database
   * @param {Object} data Activity data (type, title, description, metadata)
   */
  async logActivity(data) {
    try {
      const { type, title, description, metadata = {} } = data;
      
      const { error } = await supabase
        .from('activity_logs')
        .insert([{
          type,
          title,
          description,
          metadata,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        // If the table doesn't exist yet, we just log to console to avoid crashing
        if (error.code === '42P01') {
          console.warn('[ANALYTICS] activity_logs table not found, logging to console instead:', { type, title, description });
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('[ANALYTICS] Error logging activity:', error);
    }
  }

  /**
   * Get recent activities for the dashboard
   * @param {number} limit Number of activities to fetch
   */
  async getRecentActivity(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Format for the UI
      return (data || []).map(item => ({
        id: item.id,
        type: item.type, // 'return', 'payment', 'registration'
        user: item.metadata?.userName || 'System User',
        time: this._formatTimeAgo(item.created_at),
        status: item.metadata?.status || 'completed'
      }));
    } catch (error) {
      console.error('[ANALYTICS] Error getting recent activity:', error);
      return [];
    }
  }

  // Helper to format time ago
  _formatTimeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now.getTime() - past.getTime();
    
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 60) return `${diffInMins} minutes ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${diffInDays} days ago`;
  }


  // Get full dashboard metrics
  async getDashboardMetrics() {
    // Initialize default response data
    let userMetrics = [];
    let transactionMetrics = [];
    let pinMetrics = [];
    let returnMetrics = [];
    let totals = {
      users: 0,
      revenue: 0,
      returns: 0,
      successRate: 0
    };
    let errors = {};

    try {
      // Get user metrics - handle gracefully if table doesn't exist
      try {
        const { data, error } = await supabase
          .from('user_metrics')
          .select('*')
          .order('metric_date', { ascending: false })
          .limit(6);

        if (error) {
          console.error('Error fetching user metrics:', error);
          errors.userMetrics = error.message;
        } else {
          userMetrics = data || [];
        }
      } catch (err) {
        console.error('Failed to query user_metrics table:', err);
        errors.userMetrics = err.message;
      }

      // Get transaction metrics - handle gracefully if table doesn't exist
      try {
        const { data, error } = await supabase
          .from('transaction_metrics')
          .select('*')
          .order('metric_date', { ascending: false })
          .limit(6);

        if (error) {
          console.error('Error fetching transaction metrics:', error);
          errors.transactionMetrics = error.message;
        } else {
          transactionMetrics = data || [];
        }
      } catch (err) {
        console.error('Failed to query transaction_metrics table:', err);
        errors.transactionMetrics = err.message;
      }

      // Get PIN usage metrics - handle gracefully if table doesn't exist
      try {
        // Get individual count
        const { count: individualCount, error: individualError } = await supabase
          .from('pin_usage_metrics')
          .select('*', { count: 'exact', head: true })
          .eq('is_individual', true);

        // Get business count
        const { count: businessCount, error: businessError } = await supabase
          .from('pin_usage_metrics')
          .select('*', { count: 'exact', head: true })
          .eq('is_individual', false);

        const error = individualError || businessError;
        const data = [
          { is_individual: true, count: individualCount || 0 },
          { is_individual: false, count: businessCount || 0 }
        ];

        if (error) {
          console.error('Error fetching PIN metrics:', error);
          errors.pinMetrics = error.message;
        } else {
          pinMetrics = data || [];
        }
      } catch (err) {
        console.error('Failed to query pin_usage_metrics table:', err);
        errors.pinMetrics = err.message;
      }

      // Get return completion metrics - handle gracefully if table doesn't exist
      try {
        let hasError = false;
        const statusResults = [];

        // Get counts for each status
        for (const status of ['completed', 'pending', 'error']) {
          const { count, error } = await supabase
            .from('return_completion_metrics')
            .select('*', { count: 'exact', head: true })
            .eq('status', status);

          if (error) {
            console.error(`Error fetching ${status} return metrics:`, error);
            errors.returnMetrics = error.message;
            hasError = true;
            break;
          }

          statusResults.push({
            date: new Date().toISOString().split('T')[0],
            status,
            count: count || 0
          });
        }

        if (!hasError) {
          returnMetrics = statusResults;

        }
      } catch (err) {
        console.error('Failed to query return_completion_metrics table:', err);
        errors.returnMetrics = err.message;
      }

      // Get overall totals
      try {
        // Total Users from user_metrics or count users table
        const { count: userCount } = await supabase
          .from('sessions') // Using sessions as a proxy for unique users if users table is not active
          .select('user_id', { count: 'exact', head: true });
        
        totals.users = userCount || 0;

        // Total Revenue from transaction_metrics or payments table
        const { data: revenueData } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'completed');
        
        totals.revenue = revenueData?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

        // Total Returns
        const { count: returnsCount } = await supabase
          .from('tax_returns')
          .select('*', { count: 'exact', head: true });
        
        totals.returns = returnsCount || 0;

        // Success Rate
        const { count: completedReturns } = await supabase
          .from('tax_returns')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');
        
        totals.successRate = totals.returns > 0 ? (completedReturns / totals.returns) * 100 : 0;

      } catch (err) {
        console.error('Error fetching totals:', err);
      }

      // Get recent activity
      let recentActivity = [];
      try {
        recentActivity = await this.getRecentActivity(5);
      } catch (err) {
        console.error('Error fetching recent activity:', err);
      }

      // Process and format data for the dashboard
      const formattedData = {
        userMetrics,
        transactionMetrics,
        pinBreakdown: this._formatPinMetrics(pinMetrics),
        returnsData: this._formatReturnMetrics(returnMetrics),
        totals,
        recentActivity,
        errors: Object.keys(errors).length > 0 ? errors : null
      };

      return formattedData;
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      return {
        error: error.message,
        success: false
      };
    }
  }

  // Helper method to format PIN metrics
  _formatPinMetrics(pinMetrics) {
    const formattedData = [];

    // Group by individual vs business
    const individual = pinMetrics
      .filter(item => item.is_individual)
      .reduce((sum, item) => sum + parseInt(item.count || 0), 0);

    const business = pinMetrics
      .filter(item => !item.is_individual)
      .reduce((sum, item) => sum + parseInt(item.count || 0), 0);

    formattedData.push({ name: 'Individual', value: individual || 0 });
    formattedData.push({ name: 'Business', value: business || 0 });

    return formattedData;
  }

  // Helper method to format return metrics
  _formatReturnMetrics(returnMetrics) {
    // Group by date and status
    const dateMap = {};

    returnMetrics.forEach(item => {
      if (!dateMap[item.date]) {
        dateMap[item.date] = {
          name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          completed: 0,
          pending: 0,
          error: 0
        };
      }

      dateMap[item.date][item.status] = parseInt(item.count || 0);
    });

    // Convert to array and sort by date
    return Object.values(dateMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-6); // Get the last 6 days
  }
}

export default AnalyticsService;