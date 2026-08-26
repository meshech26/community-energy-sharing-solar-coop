const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const SustainabilityGoal = require("../models/SustainabilityGoal");
const { createGoal } = require("../controllers/sustainabilityController");
const { logProgress } = require("../controllers/progressController");

let mongoServer;
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
afterEach(async () => { await SustainabilityGoal.deleteMany({}); });

test("createGoal rejects a duplicate goal for the same user", async () => {
  const userId = new mongoose.Types.ObjectId();
  const res1 = mockRes();
  await createGoal({ user: { id: userId }, body: { targetPercentReduction: 15 } }, res1);
  expect(res1.status).toHaveBeenCalledWith(201);

  const res2 = mockRes();
  await createGoal({ user: { id: userId }, body: { targetPercentReduction: 20 } }, res2);
  expect(res2.status).toHaveBeenCalledWith(409);
});

test("logProgress rejects a duplicate month", async () => {
  const userId = new mongoose.Types.ObjectId();
  await SustainabilityGoal.create({ user: userId, targetPercentReduction: 15 });

  const res1 = mockRes();
  await logProgress({ user: { id: userId }, body: { month: "2026-08", usageKwh: 100 } }, res1);
  expect(res1.status).toHaveBeenCalledWith(201);

  const res2 = mockRes();
  await logProgress({ user: { id: userId }, body: { month: "2026-08", usageKwh: 90 } }, res2);
  expect(res2.status).toHaveBeenCalledWith(409);
});