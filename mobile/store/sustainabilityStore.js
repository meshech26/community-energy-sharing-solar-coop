import { create } from "zustand";
import * as api from "../services/sustainability";

export const useSustainabilityStore = create((set, get) => ({
  goal: null,
  progress: null,
  comparison: null,
  tip: null,
  suggestedTarget: null,
  leaderboard: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  loadGoal: async () => {
    set({ loading: true, error: null });
    try {
      const goal = await api.fetchGoal();
      set({ goal, loading: false });
    } catch (err) {
      // 404 just means no goal yet — not a real error
      if (err.response?.status === 404) {
        set({ goal: null, loading: false });
      } else {
        set({ error: err.response?.data?.message || err.message, loading: false });
      }
    }
  },

  loadSuggestedTarget: async () => {
    try {
      const { suggestedTargetPercentReduction } = await api.fetchSuggestedTarget();
      set({ suggestedTarget: suggestedTargetPercentReduction });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message });
    }
  },

  createGoal: async (targetPercentReduction, suggestedByApp = true) => {
    set({ loading: true, error: null });
    try {
      const goal = await api.createGoal(targetPercentReduction, suggestedByApp);
      set({ goal, loading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },

  updateGoal: async (fields) => {
    set({ loading: true, error: null });
    try {
      const goal = await api.updateGoal(fields);
      set({ goal, loading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },

  toggleLeaderboardOptIn: async (value) => {
    try {
      const goal = await api.toggleLeaderboardOptIn(value);
      set({ goal });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message });
    }
  },

  logProgress: async (month, usageKwh) => {
    set({ loading: true, error: null });
    try {
      const result = await api.logProgress(month, usageKwh);
      set({ goal: result.goal, comparison: result.comparison, loading: false });
      return { success: true, badges: result.badges };
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return { success: false };
    }
  },

  loadProgress: async () => {
    try {
      const progress = await api.fetchProgress();
      set({ progress });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message });
    }
  },

  loadComparison: async () => {
    try {
      const comparison = await api.fetchComparison();
      set({ comparison });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message });
    }
  },

  loadTip: async () => {
    try {
      const { tip } = await api.fetchWeeklyTip();
      set({ tip });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message });
    }
  },

  loadLeaderboard: async () => {
    try {
      const { leaderboard } = await api.fetchLeaderboard();
      set({ leaderboard });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message });
    }
  },
}));