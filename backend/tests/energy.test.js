const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');

// In-memory mock database store
let mockReadings = [];
let mockLimits = [];

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

// Mock the Mongoose models
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

// Mock database connection loader
jest.mock('../config/db', () => jest.fn().mockResolvedValue(true));

const app = express();
const energyRoutes = require('../routes/energyRoutes');
const errorMiddleware = require('../middleware/errorMiddleware');

app.use(cors());
app.use(express.json());
app.use('/api/energy', energyRoutes);
app.use(errorMiddleware);

const JWT_SECRET = process.env.JWT_SECRET || 'university_solar_coop_jwt_secret_key';

describe('Energy Monitoring API Tests', () => {
  let tokenHouseholdA;
  let tokenHouseholdB;
  const householdA = new mongoose.Types.ObjectId().toString();
  const householdB = new mongoose.Types.ObjectId().toString();
  const userA = new mongoose.Types.ObjectId().toString();
  const userB = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    tokenHouseholdA = jwt.sign({ id: userA, householdId: householdA }, JWT_SECRET);
    tokenHouseholdB = jwt.sign({ id: userB, householdId: householdB }, JWT_SECRET);
  });

  afterAll(async () => {
    // No-op mock cleanup
  });

  beforeEach(() => {
    // Clear mock database state
    mockReadings = [];
    mockLimits = [];
  });

  describe('GET /api/energy/dashboard', () => {
    it('should return unauthorized (401) when token is missing', async () => {
      const res = await request(app).get('/api/energy/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Access denied');
    });

    it('should retrieve empty telemetry structure successfully when database is empty', async () => {
      const res = await request(app)
        .get('/api/energy/dashboard')
        .set('Authorization', `Bearer ${tokenHouseholdA}`);

      expect(res.status).toBe(200);
      expect(res.body.solar).toBeDefined();
      expect(res.body.solar.current).toBe(0);
      expect(res.body.consumption.today).toBe(0);
      expect(res.body.limit.monthlyLimit).toBe(300); // Default fallback limit
    });

    it('should retrieve correctly calculated sums when readings exist', async () => {
      const EnergyReading = require('../models/EnergyReading');
      
      // Seed readings using mocked create
      await EnergyReading.create([
        { householdId: householdA, solarGeneration: 2.0, energyConsumption: 1.0 },
        { householdId: householdA, solarGeneration: 4.0, energyConsumption: 2.0 }
      ]);

      const res = await request(app)
        .get('/api/energy/dashboard')
        .set('Authorization', `Bearer ${tokenHouseholdA}`);

      expect(res.status).toBe(200);
      expect(res.body.solar.current).toBe(4.0); // Last reading
      expect(res.body.solar.today).toBe(6.0); // Sum (2 + 4)
      expect(res.body.consumption.today).toBe(3.0); // Sum (1 + 2)
      expect(res.body.balance.current).toBe(2.0); // 4 - 2
    });

    it('should prevent access to Household B data when using Household A credentials', async () => {
      const EnergyReading = require('../models/EnergyReading');
      
      // Seed reading belonging to household B
      await EnergyReading.create({
        householdId: householdB,
        solarGeneration: 5.0,
        energyConsumption: 1.0
      });

      // Request dashboard using household A token
      const res = await request(app)
        .get('/api/energy/dashboard')
        .set('Authorization', `Bearer ${tokenHouseholdA}`);

      expect(res.status).toBe(200);
      expect(res.body.solar.today).toBe(0); // Should be isolated from Household B data
    });
  });

  describe('POST /api/energy/limit', () => {
    it('should configure a valid monthly limit successfully', async () => {
      const res = await request(app)
        .post('/api/energy/limit')
        .set('Authorization', `Bearer ${tokenHouseholdA}`)
        .send({ monthlyLimit: 250, warningPercentage: 85 });

      expect(res.status).toBe(200);
      expect(res.body.monthlyLimit).toBe(250);
      expect(res.body.warningPercentage).toBe(85);
    });

    it('should reject a negative monthly limit with bad request (400)', async () => {
      const res = await request(app)
        .post('/api/energy/limit')
        .set('Authorization', `Bearer ${tokenHouseholdA}`)
        .send({ monthlyLimit: -50, warningPercentage: 80 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should reject an empty monthly limit with bad request (400)', async () => {
      const res = await request(app)
        .post('/api/energy/limit')
        .set('Authorization', `Bearer ${tokenHouseholdA}`)
        .send({ monthlyLimit: '', warningPercentage: 80 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('cannot be empty');
    });

    it('should reject an invalid warning percentage range', async () => {
      const res = await request(app)
        .post('/api/energy/limit')
        .set('Authorization', `Bearer ${tokenHouseholdA}`)
        .send({ monthlyLimit: 300, warningPercentage: 110 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });
});
