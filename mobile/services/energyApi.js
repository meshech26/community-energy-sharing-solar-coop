import api from './api';

/**
 * API methods for Energy Monitoring
 */
const energyApi = {
  // Fetch dashboard stats
  getDashboard: async () => {
    const response = await api.get('/energy/dashboard');
    return response.data;
  },

  // Fetch solar generation trend history
  getGeneration: async (range = '7d') => {
    const response = await api.get(`/energy/generation?range=${range}`);
    return response.data;
  },

  // Fetch electricity consumption trend history
  getConsumption: async (range = '7d') => {
    const response = await api.get(`/energy/consumption?range=${range}`);
    return response.data;
  },

  // Fetch full combined historical trends
  getHistory: async (range = '7d') => {
    const response = await api.get(`/energy/history?range=${range}`);
    return response.data;
  },

  // Fetch configured monthly limits
  getLimit: async () => {
    const response = await api.get('/energy/limit');
    return response.data;
  },

  // Save/Update monthly limits
  updateLimit: async (monthlyLimit, warningPercentage) => {
    const response = await api.post('/energy/limit', {
      monthlyLimit,
      warningPercentage,
    });
    return response.data;
  },

  // Simulate energy data (university prototyping only)
  simulate: async (days = 30, clearExisting = false, triggerAnomaly = false) => {
    const response = await api.post('/energy/simulate', {
      days,
      clearExisting,
      triggerAnomaly,
    });
    return response.data;
  },
};

export default energyApi;
