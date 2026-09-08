import { create } from 'zustand';
import energyApi from '../services/energyApi';

/**
 * Zustand store to manage Energy dashboard, history, limits, and loading states.
 */
export const useEnergyStore = create((set, get) => ({
  dashboard: null,
  energyHistory: [],
  energyLimit: null,
  loading: false,
  error: null,

  // Custom electricity tariffs & recorded physical bill
  tariffSettings: {
    gridRate: 42.0,      // Default LKR 42.00 / kWh
    feedInRate: 35.0,    // Default LKR 35.00 / kWh
    actualBill: null,    // Recorded physical utility bill in LKR
  },

  updateTariffSettings: (newSettings) => {
    set((state) => ({
      tariffSettings: {
        ...state.tariffSettings,
        ...newSettings
      }
    }));
  },

  // Fetch energy metrics for dashboard view
  fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const data = await energyApi.getDashboard();
      set({ dashboard: data, loading: false });
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to load dashboard data';
      set({ error: errMsg, loading: false });
    }
  },

  // Fetch historical energy records for trends charts
  fetchEnergyHistory: async (range = '7d') => {
    set({ loading: true, error: null });
    try {
      const history = await energyApi.getHistory(range);
      set({ energyHistory: history, loading: false });
    } catch (err) {
      console.error('Error fetching energy history:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to load energy history';
      set({ error: errMsg, loading: false });
    }
  },

  // Fetch household energy consumption limit configuration
  fetchEnergyLimit: async () => {
    set({ loading: true, error: null });
    try {
      const limit = await energyApi.getLimit();
      set({ energyLimit: limit, loading: false });
    } catch (err) {
      console.error('Error fetching energy limit:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to load energy limit';
      set({ error: errMsg, loading: false });
    }
  },

  // Save changes to monthly limits and warning levels
  updateEnergyLimit: async (limit, warningPercentage) => {
    set({ loading: true, error: null });
    try {
      const updatedLimit = await energyApi.updateLimit(limit, warningPercentage);
      set({ energyLimit: updatedLimit, loading: false });
      
      // Refresh dashboard to reflect new limits
      await get().fetchDashboard();
      return { success: true };
    } catch (err) {
      console.error('Error updating energy limit:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to update energy limit';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  // Trigger energy readings simulator
  simulateEnergy: async (days = 30, clearExisting = false, triggerAnomaly = false) => {
    set({ loading: true, error: null });
    try {
      await energyApi.simulate(days, clearExisting, triggerAnomaly);
      
      // Refresh state
      await Promise.all([
        get().fetchDashboard(),
        get().fetchEnergyHistory()
      ]);
      
      set({ loading: false });
      return { success: true };
    } catch (err) {
      console.error('Error simulating energy data:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to run data simulation';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  // Clear errors manually
  clearError: () => set({ error: null }),
}));
