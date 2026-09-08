const EnergyReading = require('../models/EnergyReading');
const EnergyLimit = require('../models/EnergyLimit');
const energyCalculator = require('../utils/energyCalculator');
const alertService = require('./alertService');
const mockDb = require('../utils/mockDb');

/**
 * Service to manage energy monitoring operations
 */
class EnergyService {
  /**
   * Fetch all information needed for the household dashboard
   */
  async getDashboardData(householdId, userId) {
    if (global.dbOffline) {
      // In-Memory Offline Handler
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeekly = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfMonthly = new Date(now.getFullYear(), now.getMonth(), 1);

      // Latest reading
      const readings = mockDb.readings.filter(r => r.householdId === householdId);
      const latestReading = readings[readings.length - 1] || null;

      // Aggregates
      const todayTotals = await this.getAggregatedTotals(householdId, startOfToday, now);
      const weeklyTotals = await this.getAggregatedTotals(householdId, startOfWeekly, now);
      const monthlyTotals = await this.getAggregatedTotals(householdId, startOfMonthly, now);

      // Limit config
      const limitConfig = mockDb.getLimit(householdId);

      const currentSolar = latestReading ? parseFloat(latestReading.solarGeneration.toFixed(1)) : 0;
      const currentCons = latestReading ? parseFloat(latestReading.energyConsumption.toFixed(1)) : 0;

      const solarToday = parseFloat(todayTotals.solar.toFixed(1));
      const consToday = parseFloat(todayTotals.consumption.toFixed(1));

      const solarWeekly = parseFloat(weeklyTotals.solar.toFixed(1));
      const consWeekly = parseFloat(weeklyTotals.consumption.toFixed(1));

      const solarMonthly = parseFloat(monthlyTotals.solar.toFixed(1));
      const consMonthly = parseFloat(monthlyTotals.consumption.toFixed(1));

      const currentBalance = energyCalculator.calculateBalance(currentSolar, currentCons);
      const todayBalance = energyCalculator.calculateBalance(solarToday, consToday);

      const percentageUsed = limitConfig.monthlyLimit > 0
        ? Math.round((consMonthly / limitConfig.monthlyLimit) * 100)
        : 0;

      // Run threshold alarm checks asynchronously
      if (latestReading && userId) {
        alertService.checkThresholds(householdId, userId, consMonthly, limitConfig)
          .catch(err => console.error('Error checking thresholds:', err));

        this.checkUnusualUsage(householdId, userId, latestReading.energyConsumption)
          .catch(err => console.error('Error checking unusual usage:', err));
      }

      return {
        solar: { current: currentSolar, today: solarToday, weekly: solarWeekly, monthly: solarMonthly },
        consumption: { current: currentCons, today: consToday, weekly: consWeekly, monthly: consMonthly },
        balance: { current: currentBalance, today: todayBalance },
        limit: { monthlyLimit: limitConfig.monthlyLimit, currentUsage: consMonthly, percentageUsed }
      };
    }

    // Real MongoDB Handler
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeekly = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonthly = new Date(now.getFullYear(), now.getMonth(), 1);

    const latestReading = await EnergyReading.findOne({ householdId })
      .sort({ timestamp: -1 })
      .exec();

    const [todayTotals, weeklyTotals, monthlyTotals] = await Promise.all([
      this.getAggregatedTotals(householdId, startOfToday, now),
      this.getAggregatedTotals(householdId, startOfWeekly, now),
      this.getAggregatedTotals(householdId, startOfMonthly, now)
    ]);

    let limitConfig = await EnergyLimit.findOne({ householdId }).exec();
    if (!limitConfig) {
      limitConfig = new EnergyLimit({ householdId, monthlyLimit: 300, warningPercentage: 80 });
      await limitConfig.save();
    }

    const currentSolar = latestReading ? parseFloat(latestReading.solarGeneration.toFixed(1)) : 0;
    const currentCons = latestReading ? parseFloat(latestReading.energyConsumption.toFixed(1)) : 0;

    const solarToday = parseFloat(todayTotals.solar.toFixed(1));
    const consToday = parseFloat(todayTotals.consumption.toFixed(1));

    const solarWeekly = parseFloat(weeklyTotals.solar.toFixed(1));
    const consWeekly = parseFloat(weeklyTotals.consumption.toFixed(1));

    const solarMonthly = parseFloat(monthlyTotals.solar.toFixed(1));
    const consMonthly = parseFloat(monthlyTotals.consumption.toFixed(1));

    const currentBalance = energyCalculator.calculateBalance(currentSolar, currentCons);
    const todayBalance = energyCalculator.calculateBalance(solarToday, consToday);

    const percentageUsed = limitConfig.monthlyLimit > 0
      ? Math.round((consMonthly / limitConfig.monthlyLimit) * 100)
      : 0;

    if (latestReading && userId) {
      alertService.checkThresholds(householdId, userId, consMonthly, limitConfig)
        .catch(err => console.error('Error checking thresholds:', err));

      this.checkUnusualUsage(householdId, userId, latestReading.energyConsumption)
        .catch(err => console.error('Error checking unusual usage:', err));
    }

    return {
      solar: { current: currentSolar, today: solarToday, weekly: solarWeekly, monthly: solarMonthly },
      consumption: { current: currentCons, today: consToday, weekly: consWeekly, monthly: consMonthly },
      balance: { current: currentBalance, today: todayBalance },
      limit: { monthlyLimit: limitConfig.monthlyLimit, currentUsage: consMonthly, percentageUsed }
    };
  }

  /**
   * Helper to aggregate solar and consumption readings
   */
  async getAggregatedTotals(householdId, startDate, endDate) {
    if (global.dbOffline) {
      // In-Memory aggregation
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const filtered = mockDb.readings.filter(
        r => r.householdId === householdId && r.timestamp >= start && r.timestamp <= end
      );

      const totalSolar = filtered.reduce((sum, r) => sum + r.solarGeneration, 0);
      const totalConsumption = filtered.reduce((sum, r) => sum + r.energyConsumption, 0);

      return { solar: totalSolar, consumption: totalConsumption };
    }

    // Real MongoDB aggregation
    const results = await EnergyReading.aggregate([
      {
        $match: {
          householdId: householdId,
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSolar: { $sum: '$solarGeneration' },
          totalConsumption: { $sum: '$energyConsumption' },
          count: { $sum: 1 }
        }
      }
    ]).exec();

    if (results.length === 0) {
      return { solar: 0, consumption: 0 };
    }

    return {
      solar: results[0].totalSolar,
      consumption: results[0].totalConsumption
    };
  }

  /**
   * Fetch historical trend data for charts
   */
  async getEnergyHistory(householdId, range = '7d') {
    const now = new Date();
    let startDate;

    if (range === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === '1m') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    if (global.dbOffline) {
      // In-Memory history
      const filtered = mockDb.readings
        .filter(r => r.householdId === householdId && r.timestamp >= startDate)
        .sort((a, b) => a.timestamp - b.timestamp);

      return filtered.map(r => ({
        timestamp: r.timestamp,
        solarGeneration: r.solarGeneration,
        energyConsumption: r.energyConsumption,
        formattedTime: r.timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      }));
    }

    // Real MongoDB query
    const readings = await EnergyReading.find({
      householdId,
      timestamp: { $gte: startDate, $lte: now }
    })
    .sort({ timestamp: 1 })
    .exec();

    return readings.map(r => ({
      timestamp: r.timestamp,
      solarGeneration: r.solarGeneration,
      energyConsumption: r.energyConsumption,
      formattedTime: r.timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));
  }

  /**
   * Get limits configuration for a household
   */
  async getLimit(householdId) {
    if (global.dbOffline) {
      return mockDb.getLimit(householdId);
    }

    let limit = await EnergyLimit.findOne({ householdId }).exec();
    if (!limit) {
      limit = new EnergyLimit({ householdId, monthlyLimit: 300, warningPercentage: 80 });
      await limit.save();
    }
    return limit;
  }

  /**
   * Update limits configuration
   */
  async updateLimit(householdId, monthlyLimit, warningPercentage) {
    if (global.dbOffline) {
      return mockDb.updateLimit(householdId, { monthlyLimit, warningPercentage });
    }

    let limit = await EnergyLimit.findOne({ householdId }).exec();
    if (!limit) {
      limit = new EnergyLimit({ householdId });
    }

    limit.monthlyLimit = Number(monthlyLimit);
    limit.warningPercentage = Number(warningPercentage || 80);
    await limit.save();
    return limit;
  }

  /**
   * Internal helper to compare current usage with last 25 readings average
   */
  async checkUnusualUsage(householdId, userId, currentConsumption) {
    const listReadings = global.dbOffline 
      ? mockDb.readings.filter(r => r.householdId === householdId)
      : await EnergyReading.find({ householdId }).sort({ timestamp: -1 }).limit(20).exec();

    const lastReadings = global.dbOffline ? listReadings.slice(-20) : listReadings;

    if (lastReadings.length < 5) return;

    const avgConsumption = lastReadings.reduce((sum, r) => sum + r.energyConsumption, 0) / lastReadings.length;

    if (energyCalculator.isUnusualConsumption(currentConsumption, avgConsumption)) {
      await alertService.createUnusualConsumptionAlert(
        householdId,
        userId,
        currentConsumption,
        avgConsumption
      );
    }
  }
}

module.exports = new EnergyService();
