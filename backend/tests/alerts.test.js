const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');

// In-memory mock database store
let mockReadings = [];
let mockLimits = [];
let mockAlerts = [];

// Mock Mongoose connection and client operations
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue(true),
    connection: {
      readyState: 1,
      close: jest.fn().mockResolvedValue(true),
      db: {
        dropDatabase: jest.fn().mockResolvedValue(true),
        collection: jest.fn().mockReturnValue({
          deleteMany: jest.fn().mockResolvedValue(true),
        }),
      },
    },
  };
});

// Mock Mongoose models
jest.mock('../models/EnergyReading', () => {
  const mockFind = jest.fn().mockImplementation((query) => {
    let filtered = [...mockReadings];
    if (query && query.householdId) {
      filtered = filtered.filter(r => r.householdId === query.householdId);
    }
    return {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(filtered)
    };
  });

  const mockFindOne = jest.fn().mockImplementation((query) => {
    let filtered = [...mockReadings];
    if (query && query.householdId) {
      filtered = filtered.filter(r => r.householdId === query.householdId);
    }
    return {
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(filtered[filtered.length - 1] || null)
    };
  });

  const mockCreate = jest.fn().mockImplementation((data) => {
    const arr = Array.isArray(data) ? data : [data];
    const created = arr.map(item => ({
      _id: 'mock-reading-id-' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date(),
      ...item
    }));
    mockReadings.push(...created);
    return Array.isArray(data) ? created : created[0];
  });

  const mockAggregate = jest.fn().mockImplementation((pipeline) => {
    const matchStep = pipeline.find(p => p.$match);
    let filtered = [...mockReadings];
    if (matchStep && matchStep.$match.householdId) {
      filtered = filtered.filter(r => r.householdId === matchStep.$match.householdId);
    }

    const totalSolar = filtered.reduce((sum, r) => sum + r.solarGeneration, 0);
    const totalConsumption = filtered.reduce((sum, r) => sum + r.energyConsumption, 0);

    return {
      exec: jest.fn().mockResolvedValue(
        filtered.length === 0 ? [] : [{
          _id: null,
          totalSolar,
          totalConsumption,
          count: filtered.length
        }]
      )
    };
  });

  return {
    find: mockFind,
    findOne: mockFindOne,
    create: mockCreate,
    insertMany: mockCreate,
    aggregate: mockAggregate,
  };
});

jest.mock('../models/EnergyLimit', () => {
  const mockFindOne = jest.fn().mockImplementation((query) => {
    const limit = mockLimits.find(l => l.householdId === query.householdId);
    return {
      exec: jest.fn().mockResolvedValue(limit || null)
    };
  });

  const mockLimitModel = jest.fn().mockImplementation(function (data) {
    this.householdId = data.householdId;
    this.monthlyLimit = data.monthlyLimit;
    this.warningPercentage = data.warningPercentage;
    this.save = jest.fn().mockImplementation(async () => {
      const idx = mockLimits.findIndex(l => l.householdId === this.householdId);
      const limitObj = {
        householdId: this.householdId,
        monthlyLimit: this.monthlyLimit,
        warningPercentage: this.warningPercentage || 80,
        updatedAt: new Date()
      };
      if (idx >= 0) {
        mockLimits[idx] = limitObj;
      } else {
        mockLimits.push(limitObj);
      }
      return limitObj;
    });
    return this;
  });

  mockLimitModel.findOne = mockFindOne;
  return mockLimitModel;
});

jest.mock('../models/Alert', () => {
  const mockFind = jest.fn().mockImplementation((query) => {
    let filtered = [...mockAlerts];
    if (query && query.householdId) {
      filtered = filtered.filter(a => a.householdId === query.householdId);
    }
    return {
      sort: jest.fn().mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(filtered.reverse()) // newest first
      })),
      exec: jest.fn().mockResolvedValue(filtered)
    };
  });

  const mockFindOne = jest.fn().mockImplementation((query) => {
    let filtered = [...mockAlerts];
    if (query && query.householdId) {
      filtered = filtered.filter(a => a.householdId === query.householdId);
    }
    if (query && query.type) {
      filtered = filtered.filter(a => a.type === query.type);
    }
    if (query && query.createdAt && query.createdAt.$gte) {
      filtered = filtered.filter(a => new Date(a.createdAt) >= query.createdAt.$gte);
    }
    return {
      exec: jest.fn().mockResolvedValue(filtered[0] || null)
    };
  });

  const mockCount = jest.fn().mockImplementation((query) => {
    let filtered = [...mockAlerts];
    if (query && query.householdId) {
      filtered = filtered.filter(a => a.householdId === query.householdId);
    }
    if (query && query.isRead !== undefined) {
      filtered = filtered.filter(a => a.isRead === query.isRead);
    }
    return {
      exec: jest.fn().mockResolvedValue(filtered.length)
    };
  });

  const mockFindAndUpdate = jest.fn().mockImplementation((query, update) => {
    const alert = mockAlerts.find(a => a._id === query._id && a.householdId === query.householdId);
    if (alert) {
      if (update.isRead !== undefined) alert.isRead = update.isRead;
    }
    return {
      exec: jest.fn().mockResolvedValue(alert || null)
    };
  });

  const mockFindAndDelete = jest.fn().mockImplementation((query) => {
    const idx = mockAlerts.findIndex(a => a._id === query._id && a.householdId === query.householdId);
    let deleted = null;
    if (idx >= 0) {
      deleted = mockAlerts.splice(idx, 1)[0];
    }
    return {
      exec: jest.fn().mockResolvedValue(deleted)
    };
  });

  const mockUpdateMany = jest.fn().mockImplementation((query, update) => {
    mockAlerts.forEach(a => {
      if (a.householdId === query.householdId && a.isRead === query.isRead) {
        if (update.isRead !== undefined) a.isRead = update.isRead;
      }
    });
    return {
      exec: jest.fn().mockResolvedValue({ modifiedCount: mockAlerts.length })
    };
  });

  const mockCreate = jest.fn().mockImplementation((data) => {
    const arr = Array.isArray(data) ? data : [data];
    const created = arr.map(item => ({
      _id: 'mock-alert-id-' + Math.random().toString(36).substring(2, 11),
      createdAt: new Date(),
      isRead: false,
      ...item
    }));
    mockAlerts.push(...created);
    return Array.isArray(data) ? created : created[0];
  });

  // Constructor mock for creating new Alert instances
  const mockAlertModel = jest.fn().mockImplementation(function (data) {
    this._id = 'mock-alert-id-' + Math.random().toString(36).substring(2, 11);
    this.userId = data.userId;
    this.householdId = data.householdId;
    this.type = data.type;
    this.severity = data.severity;
    this.message = data.message;
    this.threshold = data.threshold;
    this.currentValue = data.currentValue;
    this.isRead = data.isRead || false;
    this.createdAt = new Date();

    this.save = jest.fn().mockImplementation(async () => {
      const alertObj = {
        _id: this._id,
        userId: this.userId,
        householdId: this.householdId,
        type: this.type,
        severity: this.severity,
        message: this.message,
        threshold: this.threshold,
        currentValue: this.currentValue,
        isRead: this.isRead,
        createdAt: this.createdAt
      };
      mockAlerts.push(alertObj);
      return alertObj;
    });
    return this;
  });

  mockAlertModel.find = mockFind;
  mockAlertModel.findOne = mockFindOne;
  mockAlertModel.countDocuments = mockCount;
  mockAlertModel.findOneAndUpdate = mockFindAndUpdate;
  mockAlertModel.findOneAndDelete = mockFindAndDelete;
  mockAlertModel.updateMany = mockUpdateMany;
  mockAlertModel.create = mockCreate;

  return mockAlertModel;
});

// Mock database connection loader
jest.mock('../config/db', () => jest.fn().mockResolvedValue(true));

const app = express();
const alertRoutes = require('../routes/alertRoutes');
const energyRoutes = require('../routes/energyRoutes');
const errorMiddleware = require('../middleware/errorMiddleware');

app.use(cors());
app.use(express.json());
app.use('/api/alerts', alertRoutes);
app.use('/api/energy', energyRoutes);
app.use(errorMiddleware);

const JWT_SECRET = process.env.JWT_SECRET || 'university_solar_coop_jwt_secret_key';

describe('Energy Alerts & Thresholds API Tests', () => {
  let tokenHouseholdA;
  const householdA = new mongoose.Types.ObjectId().toString();
  const userA = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    tokenHouseholdA = jwt.sign({ id: userA, householdId: householdA }, JWT_SECRET);
  });

  afterAll(async () => {
    // No-op cleanup
  });

  beforeEach(() => {
    mockReadings = [];
    mockLimits = [];
    mockAlerts = [];
  });

  describe('Alert Threshold Checking Logic', () => {
    it('should trigger an 80% THRESHOLD_WARNING when usage reaches 80% of limit', async () => {
      // 1. Configure limit = 100 kWh, warning = 80%
      await request(app)
        .post('/api/energy/limit')
        .set('Authorization', `Bearer ${tokenHouseholdA}`)
        .send({ monthlyLimit: 100, warningPercentage: 80 });

      const EnergyReading = require('../models/EnergyReading');
      // 2. Seed readings summing to 82 kWh (> 80% warning threshold)
      await EnergyReading.create({
        householdId: householdA,
        solarGeneration: 0,
        energyConsumption: 82
      });

      // 3. Requesting dashboard triggers the checking logic
      await request(app)
        .get('/api/energy/dashboard')
        .set('Authorization', `Bearer ${tokenHouseholdA}`);

      // 4. Query alerts database to confirm warning was logged
      const resAlerts = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${tokenHouseholdA}`);

      expect(resAlerts.status).toBe(200);
      expect(resAlerts.body.length).toBe(1);
      expect(resAlerts.body[0].type).toBe('THRESHOLD_WARNING');
      expect(resAlerts.body[0].severity).toBe('warning');
      expect(resAlerts.body[0].currentValue).toBe(82);
    });

    it('should trigger a 90% HIGH_USAGE warning when usage reaches 90% of limit', async () => {
      await request(app)
        .post('/api/energy/limit')
        .set('Authorization', `Bearer ${tokenHouseholdA}`)
        .send({ monthlyLimit: 100, warningPercentage: 80 });

      const EnergyReading = require('../models/EnergyReading');
      await EnergyReading.create({
        householdId: householdA,
        solarGeneration: 0,
        energyConsumption: 92 // 92% usage
      });

      await request(app)
        .get('/api/energy/dashboard')
        .set('Authorization', `Bearer ${tokenHouseholdA}`);

      const resAlerts = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${tokenHouseholdA}`);

      const highUsageAlert = resAlerts.body.find(a => a.type === 'HIGH_USAGE');
      expect(highUsageAlert).toBeDefined();
      expect(highUsageAlert.severity).toBe('critical');
    });

    it('should trigger a 100% LIMIT_EXCEEDED alert when usage exceeds limit', async () => {
      await request(app)
        .post('/api/energy/limit')
        .set('Authorization', `Bearer ${tokenHouseholdA}`)
        .send({ monthlyLimit: 100, warningPercentage: 80 });

      const EnergyReading = require('../models/EnergyReading');
      await EnergyReading.create({
        householdId: householdA,
        solarGeneration: 0,
        energyConsumption: 105 // 105% usage
      });

      await request(app)
        .get('/api/energy/dashboard')
        .set('Authorization', `Bearer ${tokenHouseholdA}`);

      const resAlerts = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${tokenHouseholdA}`);

      const limitExceededAlert = resAlerts.body.find(a => a.type === 'LIMIT_EXCEEDED');
      expect(limitExceededAlert).toBeDefined();
      expect(limitExceededAlert.severity).toBe('critical');
    });

    it('should prevent creating duplicate alerts of the same type within the same month', async () => {
      await request(app)
        .post('/api/energy/limit')
        .set('Authorization', `Bearer ${tokenHouseholdA}`)
        .send({ monthlyLimit: 100, warningPercentage: 80 });

      const EnergyReading = require('../models/EnergyReading');
      
      // Add first reading (exceeds warning threshold)
      await EnergyReading.create({
        householdId: householdA,
        solarGeneration: 0,
        energyConsumption: 82
      });

      // Dashboard request 1 -> creates alert
      await request(app)
        .get('/api/energy/dashboard')
        .set('Authorization', `Bearer ${tokenHouseholdA}`);

      // Add another reading (still in warning zone)
      await EnergyReading.create({
        householdId: householdA,
        solarGeneration: 0,
        energyConsumption: 3
      });

      // Dashboard request 2 -> checks again
      await request(app)
        .get('/api/energy/dashboard')
        .set('Authorization', `Bearer ${tokenHouseholdA}`);

      const resAlerts = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${tokenHouseholdA}`);

      // Should only contain 1 alert because duplicate check blocked the second warning
      expect(resAlerts.body.length).toBe(1);
    });
  });

  describe('Alert Management (Read Status, Badges)', () => {
    let testAlertId;

    beforeEach(async () => {
      // Seed a test alert directly into the mock array
      const Alert = require('../models/Alert');
      const alert = await Alert.create({
        userId: userA,
        householdId: householdA,
        type: 'THRESHOLD_WARNING',
        severity: 'warning',
        message: 'Test limit warning message',
        threshold: 80,
        currentValue: 85,
        isRead: false
      });
      testAlertId = alert._id.toString();
    });

    it('should fetch alert history successfully', async () => {
      const res = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${tokenHouseholdA}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0]._id).toBe(testAlertId);
    });

    it('should fetch the correct unread count', async () => {
      const res = await request(app)
        .get('/api/alerts/unread-count')
        .set('Authorization', `Bearer ${tokenHouseholdA}`);

      expect(res.status).toBe(200);
      expect(res.body.unreadCount).toBe(1);
    });

    it('should allow user to mark an alert as read', async () => {
      const res = await request(app)
        .patch(`/api/alerts/${testAlertId}/read`)
        .set('Authorization', `Bearer ${tokenHouseholdA}`);

      expect(res.status).toBe(200);
      expect(res.body.isRead).toBe(true);

      const resCount = await request(app)
        .get('/api/alerts/unread-count')
        .set('Authorization', `Bearer ${tokenHouseholdA}`);
      expect(resCount.body.unreadCount).toBe(0);
    });
  });
});
