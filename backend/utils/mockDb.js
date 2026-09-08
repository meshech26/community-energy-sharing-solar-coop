/**
 * In-Memory Mock Database for Localhost Prototyping
 * Enables the entire application to run out-of-the-box without requiring MongoDB installation.
 */

// Initial seed data: 7 days of hourly historical readings
const generateInitialReadings = (householdId) => {
  const readings = [];
  const now = new Date();
  
  for (let d = 7; d >= 0; d--) {
    for (let h = 0; h < 24; h++) {
      const timestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d, h, 0, 0);
      
      let solarGeneration = 0;
      if (h >= 6 && h <= 18) {
        const angle = ((h - 6) / 12) * Math.PI;
        solarGeneration = parseFloat((Math.sin(angle) * (3.0 + Math.random())).toFixed(2));
      }

      let energyConsumption = 0.6 + Math.random() * 0.4;
      if (h >= 7 && h <= 9) energyConsumption += 1.0;
      if (h >= 18 && h <= 21) energyConsumption += 1.5;

      readings.push({
        _id: `mock-reading-${d}-${h}`,
        householdId: householdId || '60c72b2f9b1d8b2bad6f0d22',
        solarGeneration,
        energyConsumption,
        timestamp,
        createdAt: timestamp,
      });
    }
  }
  return readings;
};

const mockDb = {
  readings: generateInitialReadings('60c72b2f9b1d8b2bad6f0d22'),
  limits: [
    {
      householdId: '60c72b2f9b1d8b2bad6f0d22',
      monthlyLimit: 300,
      warningPercentage: 80,
      updatedAt: new Date()
    }
  ],
  alerts: [],

  // Reset or clear readings
  clearReadings: (householdId) => {
    mockDb.readings = mockDb.readings.filter(r => r.householdId !== householdId);
  },

  // Save new reading
  insertReading: (reading) => {
    const newReading = {
      _id: `mock-reading-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      createdAt: new Date(),
      ...reading
    };
    mockDb.readings.push(newReading);
    return newReading;
  },

  // Save multiple readings
  insertReadings: (newReadings) => {
    const created = newReadings.map((r, i) => ({
      _id: `mock-reading-${Date.now()}-${i}`,
      timestamp: new Date(),
      createdAt: new Date(),
      ...r
    }));
    mockDb.readings.push(...created);
    return created;
  },

  // Save limit
  updateLimit: (householdId, limitObj) => {
    const idx = mockDb.limits.findIndex(l => l.householdId === householdId);
    const updated = {
      householdId,
      monthlyLimit: limitObj.monthlyLimit,
      warningPercentage: limitObj.warningPercentage || 80,
      updatedAt: new Date()
    };
    if (idx >= 0) {
      mockDb.limits[idx] = updated;
    } else {
      mockDb.limits.push(updated);
    }
    return updated;
  },

  // Get active limit
  getLimit: (householdId) => {
    let limit = mockDb.limits.find(l => l.householdId === householdId);
    if (!limit) {
      limit = {
        householdId,
        monthlyLimit: 300,
        warningPercentage: 80,
        updatedAt: new Date()
      };
      mockDb.limits.push(limit);
    }
    return limit;
  },

  // Insert Alert
  insertAlert: (alert) => {
    const newAlert = {
      _id: `mock-alert-${Date.now()}-${Math.random()}`,
      isRead: false,
      createdAt: new Date(),
      ...alert
    };
    mockDb.alerts.push(newAlert);
    return newAlert;
  },

  // Fetch Alert history
  getAlerts: (householdId) => {
    return mockDb.alerts
      .filter(a => a.householdId === householdId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  // Mark Alert read
  markAsRead: (alertId, householdId) => {
    const alert = mockDb.alerts.find(a => a._id === alertId && a.householdId === householdId);
    if (alert) alert.isRead = true;
    return alert;
  },

  // Mark all Alerts read
  markAllAsRead: (householdId) => {
    mockDb.alerts.forEach(a => {
      if (a.householdId === householdId) a.isRead = true;
    });
  },

  // Remove alert
  deleteAlert: (alertId, householdId) => {
    const idx = mockDb.alerts.findIndex(a => a._id === alertId && a.householdId === householdId);
    if (idx >= 0) return mockDb.alerts.splice(idx, 1)[0];
    return null;
  }
};

module.exports = mockDb;
