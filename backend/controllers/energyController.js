const energyService = require('../services/energyService');
const EnergyReading = require('../models/EnergyReading');
const mockDb = require('../utils/mockDb');

/**
 * Controller to handle energy monitoring HTTP endpoints
 */
const getDashboard = async (req, res, next) => {
  try {
    const householdId = req.user.householdId;
    const userId = req.user.id;

    if (!householdId) {
      return res.status(400).json({ error: 'User does not belong to any household' });
    }

    const data = await energyService.getDashboardData(householdId, userId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const getGeneration = async (req, res, next) => {
  try {
    const householdId = req.user.householdId;
    const range = req.query.range || '7d';

    if (!householdId) {
      return res.status(400).json({ error: 'User does not belong to any household' });
    }

    const history = await energyService.getEnergyHistory(householdId, range);
    
    // Format specifically for solar generation
    const data = history.map(h => ({
      timestamp: h.timestamp,
      solarGeneration: h.solarGeneration,
      formattedTime: h.formattedTime
    }));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const getConsumption = async (req, res, next) => {
  try {
    const householdId = req.user.householdId;
    const range = req.query.range || '7d';

    if (!householdId) {
      return res.status(400).json({ error: 'User does not belong to any household' });
    }

    const history = await energyService.getEnergyHistory(householdId, range);
    
    // Format specifically for energy consumption
    const data = history.map(h => ({
      timestamp: h.timestamp,
      energyConsumption: h.energyConsumption,
      formattedTime: h.formattedTime
    }));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const householdId = req.user.householdId;
    const range = req.query.range || '7d';

    if (!householdId) {
      return res.status(400).json({ error: 'User does not belong to any household' });
    }

    const history = await energyService.getEnergyHistory(householdId, range);
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

const getLimit = async (req, res, next) => {
  try {
    const householdId = req.user.householdId;

    if (!householdId) {
      return res.status(400).json({ error: 'User does not belong to any household' });
    }

    const limit = await energyService.getLimit(householdId);
    res.status(200).json(limit);
  } catch (error) {
    next(error);
  }
};

const saveLimit = async (req, res, next) => {
  try {
    const householdId = req.user.householdId;
    const { monthlyLimit, warningPercentage } = req.body;

    if (!householdId) {
      return res.status(400).json({ error: 'User does not belong to any household' });
    }

    // Input Validation
    if (monthlyLimit === undefined || monthlyLimit === null || monthlyLimit === '') {
      return res.status(400).json({ error: 'Monthly limit cannot be empty' });
    }

    const limitNum = Number(monthlyLimit);
    if (isNaN(limitNum)) {
      return res.status(400).json({ error: 'Monthly limit must be a valid number' });
    }

    if (limitNum <= 0) {
      return res.status(400).json({ error: 'Monthly limit must be greater than zero' });
    }

    if (warningPercentage !== undefined && warningPercentage !== null) {
      const warningNum = Number(warningPercentage);
      if (isNaN(warningNum) || warningNum < 1 || warningNum > 100) {
        return res.status(400).json({ error: 'Warning percentage must be between 1 and 100' });
      }
    }

    const limit = await energyService.updateLimit(householdId, limitNum, warningPercentage);
    res.status(200).json(limit);
  } catch (error) {
    next(error);
  }
};

const simulateData = async (req, res, next) => {
  try {
    const householdId = req.user.householdId;
    const days = req.body.days ? Number(req.body.days) : 30;

    if (!householdId) {
      return res.status(400).json({ error: 'User does not belong to any household' });
    }

    // Clear existing readings for clean simulation if requested
    if (req.body.clearExisting) {
      if (global.dbOffline) {
        mockDb.clearReadings(householdId);
      } else {
        await EnergyReading.deleteMany({ householdId }).exec();
      }
    }

    const now = new Date();
    const readings = [];

    // Simulate hourly readings for the last X days
    for (let d = days; d >= 0; d--) {
      for (let h = 0; h < 24; h++) {
        // Calculate timestamp in the past
        const timestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d, h, 0, 0);
        
        // Solar Generation Logic:
        // Peak is midday (12:00 - 14:00). Zero at night (18:00 to 06:00).
        let solarGeneration = 0;
        if (h >= 6 && h <= 18) {
          // Sinusoidal curve peaking at 12:00
          const angle = ((h - 6) / 12) * Math.PI;
          const peak = 3.5 + Math.random() * 1.5; // Peak between 3.5kW and 5.0kW
          solarGeneration = parseFloat((Math.sin(angle) * peak).toFixed(2));
        }

        // Energy Consumption Logic:
        // Peaks in morning (07:00 - 09:00) and evening (18:00 - 21:00).
        // Base consumption at night.
        let energyConsumption = 0.5 + Math.random() * 0.4; // Base: 0.5kW to 0.9kW
        if (h >= 7 && h <= 9) {
          energyConsumption += 1.2 + Math.random() * 0.8; // Breakfast peak: +1.2kW to 2.0kW
        } else if (h >= 18 && h <= 21) {
          energyConsumption += 1.8 + Math.random() * 1.2; // Dinner peak: +1.8kW to 3.0kW
        } else if (h >= 10 && h <= 17) {
          energyConsumption += 0.4 + Math.random() * 0.5; // Midday usage: +0.4kW to 0.9kW
        }

        // Add anomaly if requested for unusual usage demonstration
        if (req.body.triggerAnomaly && d === 0 && h === now.getHours()) {
          energyConsumption = 6.5; // High abnormal usage
        }

        readings.push({
          householdId,
          solarGeneration: parseFloat(solarGeneration.toFixed(2)),
          energyConsumption: parseFloat(energyConsumption.toFixed(2)),
          timestamp
        });
      }
    }

    if (global.dbOffline) {
      const createdReadings = mockDb.insertReadings(readings);
      return res.status(201).json({
        message: `Successfully simulated ${createdReadings.length} hourly energy readings over ${days} days in OFFLINE mode.`,
        count: createdReadings.length
      });
    }

    // Insert all readings into the database
    const createdReadings = await EnergyReading.insertMany(readings);

    res.status(201).json({
      message: `Successfully simulated ${createdReadings.length} hourly energy readings over ${days} days.`,
      count: createdReadings.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getGeneration,
  getConsumption,
  getHistory,
  getLimit,
  saveLimit,
  simulateData
};
