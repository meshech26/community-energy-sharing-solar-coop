const { test, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const EnergyListing = require('../models/EnergyListing');
const controller = require('../controllers/energyListingController');

// Controller unit tests: all persistence is mocked; no real records are touched.
afterEach(() => mock.restoreAll());
function response() {
  return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}
function mockListings(rows) {
  return mock.method(EnergyListing, 'find', () => ({ populate: async (field, select) => {
    assert.equal(field, 'sellerId');
    assert.equal(select, 'name email');
    return rows.map(row => ({ toObject: () => ({ ...row }) }));
  } }));
}

test('marketplace query restricts status, quantity and excludes the buyer', async () => {
  const find = mockListings([]);
  const res = response();
  await controller.getActiveListings({ user: { id: 'buyer' }, query: {} }, res);
  assert.deepEqual(find.mock.calls[0].arguments[0], {
    status: { $in: ['ACTIVE', 'PARTIALLY_SOLD'] },
    $or: [{ availableQuantity: { $gt: 0 } }, { approvedQuantity: { $gt: 0 } }],
    sellerId: { $ne: 'buyer' },
  });
  assert.equal(res.code, 200);
  assert.deepEqual(res.body, { success: true, count: 0, data: [] });
});

test('includeOwn=true omits seller exclusion', async () => {
  const find = mockListings([]);
  await controller.getActiveListings({ user: { id: 'buyer' }, query: { includeOwn: 'true' } }, response());
  assert.equal(find.mock.calls[0].arguments[0].sellerId, undefined);
});

test('legacy quantity fallback does not replace explicit zero available stock', async () => {
  mockListings([{ approvedQuantity: 8, pendingQuantity: 10 }, { approvedQuantity: 8, availableQuantity: 0, listedQuantity: 12 }]);
  const res = response();
  await controller.getActiveListings({ user: { id: 'buyer' }, query: {} }, res);
  assert.equal(res.body.count, 2);
  assert.equal(res.body.data[0].listedQuantity, 10);
  assert.equal(res.body.data[0].availableQuantity, 8);
  assert.equal(res.body.data[1].availableQuantity, 0);
  assert.equal(res.body.data[1].listedQuantity, 12);
});

test('marketplace database failure returns an error response', async () => {
  mock.method(EnergyListing, 'find', () => { throw new Error('DB offline'); });
  const res = response();
  await controller.getActiveListings({ user: { id: 'buyer' }, query: {} }, res);
  assert.equal(res.code, 500);
  assert.deepEqual(res.body, { success: false, error: 'DB offline' });
});

test('new offers await approval and have no available stock', async () => {
  const create = mock.method(EnergyListing, 'create', async data => ({ _id: 'new', ...data }));
  const res = response();
  await controller.createListing({ user: { id: 'seller', householdId: 'home' }, body: { quantity: 10, unitPrice: 40, availableDate: '2026-10-20', description: 'Surplus' } }, res);
  assert.equal(res.code, 201);
  const saved = create.mock.calls[0].arguments[0];
  assert.equal(saved.sellerId, 'seller');
  assert.equal(saved.status, 'PENDING_APPROVAL');
  assert.equal(saved.pendingQuantity, 10);
  assert.equal(saved.pendingUnitPrice, 40);
  assert.equal(saved.availableQuantity, 0);
  assert.equal(saved.approvedQuantity, 0);
});

test('missing listing returns 404', async () => {
  mock.method(EnergyListing, 'findById', () => ({ populate: async () => null }));
  const res = response();
  await controller.getListingById({ params: { id: 'missing' } }, res);
  assert.equal(res.code, 404);
  assert.equal(res.body.error, 'Listing not found');
});

test('another member cannot edit an offer', async () => {
  const save = mock.fn();
  mock.method(EnergyListing, 'findById', async () => ({ sellerId: 'owner', save }));
  const res = response();
  await controller.updateListing({ user: { id: 'other', isCoopAdmin: false }, params: { id: 'offer' }, body: { quantity: 99 } }, res);
  assert.equal(res.code, 403);
  assert.equal(save.mock.callCount(), 0);
});

test('approval copies pending terms into available stock', async () => {
  const listing = { pendingQuantity: 10, pendingUnit: 'kWh', pendingUnitPrice: 40, save: mock.fn(async () => {}) };
  mock.method(EnergyListing, 'findById', async () => listing);
  const res = response();
  await controller.approveListing({ user: { id: 'admin' }, params: { id: 'offer' } }, res);
  assert.equal(res.code, 200);
  assert.equal(listing.status, 'ACTIVE');
  assert.equal(listing.availableQuantity, 10);
  assert.equal(listing.approvedUnitPrice, 40);
  assert.equal(listing.approvedBy, 'admin');
  assert.equal(listing.save.mock.callCount(), 1);
});
