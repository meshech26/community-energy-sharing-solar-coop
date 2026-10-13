const { test, before, after, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Listing = require('../models/EnergyListing');
const Order = require('../models/EnergyOrder');

// Real HTTP, routers, middleware and controllers; fake persistence and Stripe.
// No .env, real database, credentials, payments or external network calls.
const stripePath = require.resolve('stripe');
const originalStripe = require.cache[stripePath];
const checkout = mock.fn(async () => ({ url: 'https://checkout.example.test/session' }));
require.cache[stripePath] = { id: stripePath, filename: stripePath, loaded: true, exports: () => ({ checkout: { sessions: { create: checkout } } }) };
const energyRoutes = require('../routes/energyRoutes');
const paymentRoutes = require('../routes/paymentRoutes');
if (originalStripe) require.cache[stripePath] = originalStripe;
else delete require.cache[stripePath];
const oldSecret = process.env.JWT_SECRET;
let server, base;
before(async () => {
  process.env.JWT_SECRET = 'energy-flow-tests-only';
  const app = express();
  app.use(express.json());
  app.use('/api/energy', energyRoutes);
  app.use('/api/payments', paymentRoutes);
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  base = `http://127.0.0.1:${server.address().port}/api`;
});
afterEach(() => { mock.restoreAll(); checkout.mock.resetCalls(); });
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (oldSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = oldSecret;
});
async function request(path, body, user = 'buyer', method = 'POST') {
  const result = await fetch(base + path, { method, headers: {
    'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ userId: user }, process.env.JWT_SECRET)}`,
  }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: result.status, body: await result.json() };
}
function users() {
  mock.method(User, 'findById', async id => ({ _id: id, household: 'home-' + id, isCoopAdmin: id === 'admin' }));
}

test('sell coordinates survive approval and marketplace retrieval; prototype buy reduces stock', async () => {
  users();
  let listing;
  mock.method(Listing, 'create', async data => {
    listing = { ...data, _id: 'offer', save: async () => {}, toObject() { const { save, toObject, ...data } = this; return data; } };
    return listing;
  });
  mock.method(Listing, 'findById', async () => listing);
  mock.method(Listing, 'find', () => ({ populate: async () => [listing] }));
  mock.method(Order, 'create', async data => ({ _id: 'order', ...data }));
  const location = { latitude: 6.9271, longitude: 79.8612 };
  const sell = await request('/energy/listings', { quantity: 10, unitPrice: 45, location }, 'seller');
  assert.equal(sell.status, 201);
  assert.equal(sell.body.data.status, 'PENDING_APPROVAL');
  assert.deepEqual(sell.body.data.location, location);
  const denied = await request('/energy/admin/listings/offer/approve', {}, 'buyer', 'PUT');
  assert.equal(denied.status, 403);
  const approved = await request('/energy/admin/listings/offer/approve', {}, 'admin', 'PUT');
  assert.equal(approved.status, 200);
  const market = await request('/energy/listings', null, 'buyer', 'GET');
  assert.equal(market.status, 200);
  assert.deepEqual(market.body.data[0].location, location);
  const buy = await request('/energy/orders', { listingId: 'offer', quantity: 4 });
  assert.equal(buy.status, 201);
  assert.equal(buy.body.data.totalAmount, 180);
  assert.equal(listing.availableQuantity, 6);
  assert.equal(listing.listedQuantity, 10);
  const tooMuch = await request('/energy/orders', { listingId: 'offer', quantity: 7 });
  assert.equal(tooMuch.status, 400);
  assert.equal(listing.availableQuantity, 6);
  // Current prototype completes without Stripe proof; this is NOT payment verification.
  assert.equal(buy.body.data.status, 'COMPLETED');
  assert.equal(checkout.mock.callCount(), 0);
});

test('checkout HTTP route passes amount and return URL to Stripe adapter', async () => {
  const result = await request('/payments/create-checkout-session', { amount: 450, currency: 'lkr', success_url: 'https://app.example.test/payment-complete' });
  assert.equal(result.status, 200);
  assert.equal(result.body.url, 'https://checkout.example.test/session');
  const params = checkout.mock.calls[0].arguments[0];
  assert.equal(params.line_items[0].price_data.unit_amount, 45000);
  assert.equal(params.line_items[0].price_data.currency, 'lkr');
  assert.equal(params.success_url, 'https://app.example.test/payment-complete');
  assert.equal(params.mode, 'payment');
});

test('missing checkout amount is rejected before calling Stripe', async () => {
  const result = await request('/payments/create-checkout-session', {});
  assert.equal(result.status, 400);
  assert.equal(checkout.mock.callCount(), 0);
});

test('Stripe adapter failure becomes HTTP 500', async () => {
  checkout.mock.mockImplementationOnce(async () => { throw new Error('Stripe unavailable'); });
  mock.method(console, 'error', () => {});
  const result = await request('/payments/create-checkout-session', { amount: 450 });
  assert.equal(result.status, 500);
  assert.equal(result.body.error, 'Stripe unavailable');
});
