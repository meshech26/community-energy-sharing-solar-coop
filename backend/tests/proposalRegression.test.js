const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { spawn } = require('node:child_process');
const path = require('node:path');
const mongoose = require('mongoose');
const express = require('express');
const Household = require('../models/Household');
const User = require('../models/User');
const Proposal = require('../models/Proposal');
const Vote = require('../models/Vote');
const Notification = require('../models/Notification');

// Run the existing, unmodified end-to-end scripts against a disposable database
// and an ephemeral API server, never against the developer's normal solarshare DB.
test('existing proposal management and voting end-to-end regressions', async (t) => {
  const database = `solarshare_proposal_regression_${randomUUID().replaceAll('-', '')}`;
  const uri = `mongodb://127.0.0.1:27017/${database}`;
  const secret = 'proposal-regression-test-only';
  process.env.JWT_SECRET = secret;
  let server;
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    await Promise.all([Household.init(), User.init(), Proposal.init(), Vote.init(), Notification.init()]);
    await Household.create([1, 2, 3, 4].map((number) => ({ name: `Test household ${number}`, invitationCode: `H0${number}-SOLAR` })));
    const app = express(); app.use(express.json());
    app.use('/api/auth', require('../routes/authRoutes'));
    app.use('/api/proposals', require('../routes/proposalRoutes'));
    server = await new Promise((resolve) => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)); });
    for (const file of ['proposalManagement.integration.js', 'proposalVoting.integration.js']) {
      await t.test(file, async () => {
        const result = await new Promise((resolve, reject) => {
          const child = spawn(process.execPath, [path.join(__dirname, file)], {
            cwd: path.join(__dirname, '..'),
            env: { ...process.env, MONGO_URI: uri, JWT_SECRET: secret, TEST_API_URL: `http://127.0.0.1:${server.address().port}`, DOTENV_CONFIG_QUIET: 'true' },
            windowsHide: true,
          });
          let output = '';
          child.stdout.on('data', (chunk) => { output += chunk; });
          child.stderr.on('data', (chunk) => { output += chunk; });
          child.on('error', reject);
          child.on('close', (code) => resolve({ code, output }));
        });
        // Do not relay raw assertion payloads: legacy scripts may include login tokens.
        assert.equal(result.code, 0, `${file} failed in the isolated regression database.`);
        t.diagnostic(`${file}: ${result.output.split(/\r?\n/).filter((line) => line.startsWith('PASS - ')).length} checks passed.`);
      });
    }
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === database) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
