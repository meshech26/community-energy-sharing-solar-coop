const mongoose = require('mongoose');

require('dotenv').config();

const User = require('../models/User');
const Proposal = require('../models/Proposal');

const api = process.env.TEST_API_URL || 'http://127.0.0.1:5000';
const suffix = Date.now().toString(36);
const adminEmail = `sprint1.admin.${suffix}@solarshare.test`;
const memberEmail = `sprint1.member.${suffix}@solarshare.test`;
const password = 'Sprint1Pass123';
const passed = [];
let adminId;

const check = (label, condition, detail = '') => {
  if (!condition) {
    throw new Error(`${label}${detail ? `: ${detail}` : ''}`);
  }

  passed.push(label);
};

const request = async (path, options = {}) => {
  const response = await fetch(`${api}${path}`, options);
  const text = await response.text();
  let body = {};

  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  return { status: response.status, body };
};

const jsonOptions = (method, body, token) => ({
  method,
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

const proposalBody = (title, startOffsetMinutes, deadlineOffsetMinutes) => ({
  title,
  summary: `${title} summary`,
  description: `${title} detailed description`,
  benefits: 'Lower shared energy costs',
  estimatedCost: 12500,
  householdImpact: 'Each participating household shares the projected benefit.',
  votingStartDate: new Date(Date.now() + startOffsetMinutes * 60000).toISOString(),
  votingDeadline: new Date(Date.now() + deadlineOffsetMinutes * 60000).toISOString(),
});

const createDraft = async (title, startOffsetMinutes, deadlineOffsetMinutes, token) => {
  const result = await request(
    '/api/proposals',
    jsonOptions('POST', proposalBody(title, startOffsetMinutes, deadlineOffsetMinutes), token)
  );
  check(`Admin can create draft: ${title}`, result.status === 201 && result.body.proposal.status === 'draft', JSON.stringify(result.body));
  return result.body.proposal;
};

const publish = async (proposalId, token, expectedStatus) => {
  const result = await request(`/api/proposals/${proposalId}/publish`, jsonOptions('POST', {}, token));
  check(`Admin can publish ${expectedStatus} proposal`, result.status === 200 && result.body.proposal.status === expectedStatus, JSON.stringify(result.body));
  return result.body.proposal;
};

const run = async () => {
  try {
    const noAuth = await request('/api/proposals');
    check('Unauthenticated proposal list is rejected', noAuth.status === 401, JSON.stringify(noAuth.body));

    const invalidToken = await request('/api/proposals', { headers: { Authorization: 'Bearer invalid-token' } });
    check('Invalid JWT is rejected', invalidToken.status === 401, JSON.stringify(invalidToken.body));

    const adminRegistration = await request(
      '/api/auth/register',
      jsonOptions('POST', {
        name: 'Sprint One Admin',
        email: adminEmail,
        password,
        invitationCode: 'H01-SOLAR',
      })
    );
    check('Existing authentication registration works for admin test user', adminRegistration.status === 201, JSON.stringify(adminRegistration.body));
    adminId = adminRegistration.body.user.id;

    const memberRegistration = await request(
      '/api/auth/register',
      jsonOptions('POST', {
        name: 'Sprint One Member',
        email: memberEmail,
        password,
        invitationCode: 'H02-SOLAR',
      })
    );
    check('Existing authentication registration works for member test user', memberRegistration.status === 201, JSON.stringify(memberRegistration.body));

    await mongoose.connect(process.env.MONGO_URI);
    await User.updateOne({ _id: adminId }, { $set: { isCoopAdmin: true } });
    await mongoose.disconnect();

    const adminLogin = await request('/api/auth/login', jsonOptions('POST', { email: adminEmail, password }));
    check('Existing authentication login works', adminLogin.status === 200 && Boolean(adminLogin.body.token), JSON.stringify(adminLogin.body));
    check('Login response does not expose password', adminLogin.body.user && !Object.hasOwn(adminLogin.body.user, 'password'), JSON.stringify(adminLogin.body));
    const adminToken = adminLogin.body.token;

    const memberLogin = await request('/api/auth/login', jsonOptions('POST', { email: memberEmail, password }));
    check('Member login works', memberLogin.status === 200 && Boolean(memberLogin.body.token), JSON.stringify(memberLogin.body));
    const memberToken = memberLogin.body.token;

    const me = await request('/api/auth/me', { headers: { Authorization: `Bearer ${memberToken}` } });
    check('JWT current-user endpoint works', me.status === 200 && me.body.user.email === memberEmail && !Object.hasOwn(me.body.user, 'password'), JSON.stringify(me.body));

    const initialDraft = await createDraft(`Sprint 1 Active Proposal ${suffix}`, -5, 30, adminToken);
    check('Draft records safe proposer information', initialDraft.proposer && initialDraft.proposer.name === 'Sprint One Admin' && !Object.hasOwn(initialDraft.proposer, 'email'), JSON.stringify(initialDraft));

    const adminDraftList = await request('/api/proposals/admin/mine', { headers: { Authorization: `Bearer ${adminToken}` } });
    check('Admin can view manageable draft proposals', adminDraftList.status === 200 && adminDraftList.body.proposals.some((proposal) => proposal.id === initialDraft.id && proposal.status === 'draft'), JSON.stringify(adminDraftList.body));

    const blockedAdminList = await request('/api/proposals/admin/mine', { headers: { Authorization: `Bearer ${memberToken}` } });
    check('Normal member is blocked from administrator proposal listing', blockedAdminList.status === 403, JSON.stringify(blockedAdminList.body));

    const blockedCreate = await request('/api/proposals', jsonOptions('POST', proposalBody(`Blocked proposal ${suffix}`, -5, 30), memberToken));
    check('Normal member is blocked from proposal creation', blockedCreate.status === 403, JSON.stringify(blockedCreate.body));

    const memberDraftList = await request('/api/proposals', { headers: { Authorization: `Bearer ${memberToken}` } });
    check('Draft is hidden from normal member list', memberDraftList.status === 200 && !memberDraftList.body.proposals.some((proposal) => proposal.id === initialDraft.id), JSON.stringify(memberDraftList.body));

    const memberDraftDetail = await request(`/api/proposals/${initialDraft.id}`, { headers: { Authorization: `Bearer ${memberToken}` } });
    check('Draft detail is protected from normal member', memberDraftDetail.status === 403, JSON.stringify(memberDraftDetail.body));

    const editedDraft = await request(
      `/api/proposals/${initialDraft.id}/draft`,
      jsonOptions('PATCH', { title: `Updated Sprint 1 Active Proposal ${suffix}` }, adminToken)
    );
    check('Admin can edit draft', editedDraft.status === 200 && editedDraft.body.proposal.title.startsWith('Updated'), JSON.stringify(editedDraft.body));

    const blockedEdit = await request(
      `/api/proposals/${initialDraft.id}/draft`,
      jsonOptions('PATCH', { title: 'Blocked edit' }, memberToken)
    );
    check('Normal member is blocked from draft editing', blockedEdit.status === 403, JSON.stringify(blockedEdit.body));

    const activeProposal = await publish(initialDraft.id, adminToken, 'active');
    const upcomingDraft = await createDraft(`Sprint 1 Upcoming Proposal ${suffix}`, 20, 40, adminToken);
    const upcomingProposal = await publish(upcomingDraft.id, adminToken, 'upcoming');
    const closedDraft = await createDraft(`Sprint 1 Closed Proposal ${suffix}`, -40, -20, adminToken);
    const closedProposal = await publish(closedDraft.id, adminToken, 'closed');

    const list = await request('/api/proposals', { headers: { Authorization: `Bearer ${memberToken}` } });
    const visible = list.body.proposals || [];
    const activeIndex = visible.findIndex((proposal) => proposal.id === activeProposal.id);
    const upcomingIndex = visible.findIndex((proposal) => proposal.id === upcomingProposal.id);
    const closedIndex = visible.findIndex((proposal) => proposal.id === closedProposal.id);
    check('Published proposals are visible to household members', list.status === 200 && activeIndex >= 0 && upcomingIndex >= 0 && closedIndex >= 0, JSON.stringify(list.body));
    check('Date-driven Active Upcoming Closed statuses are correct', visible[activeIndex].status === 'active' && visible[upcomingIndex].status === 'upcoming' && visible[closedIndex].status === 'closed', JSON.stringify(list.body));
    check('Proposal list prioritises Active then Upcoming then Closed', activeIndex < upcomingIndex && upcomingIndex < closedIndex, JSON.stringify(visible.map((proposal) => ({ id: proposal.id, status: proposal.status }))));

    const details = await request(`/api/proposals/${activeProposal.id}`, { headers: { Authorization: `Bearer ${memberToken}` } });
    check('Published proposal details are available to household members', details.status === 200 && details.body.proposal.description && details.body.proposal.proposer.name === 'Sprint One Admin', JSON.stringify(details.body));
    check('Proposal details proposer is safe', !Object.hasOwn(details.body.proposal.proposer, 'password') && !Object.hasOwn(details.body.proposal.proposer, 'email'), JSON.stringify(details.body));

    const protectedEdit = await request(
      `/api/proposals/${activeProposal.id}/draft`,
      jsonOptions('PATCH', { title: 'Inappropriate published edit' }, adminToken)
    );
    check('Published active proposal cannot be freely edited', protectedEdit.status === 409, JSON.stringify(protectedEdit.body));

    const invalidId = await request('/api/proposals/not-a-valid-id', { headers: { Authorization: `Bearer ${memberToken}` } });
    check('Invalid proposal ID is handled', invalidId.status === 400, JSON.stringify(invalidId.body));

    const missingReason = await request(`/api/proposals/${activeProposal.id}/cancel`, jsonOptions('POST', {}, adminToken));
    check('Cancellation requires a reason', missingReason.status === 400, JSON.stringify(missingReason.body));

    const cancelled = await request(
      `/api/proposals/${activeProposal.id}/cancel`,
      jsonOptions('POST', { cancellationReason: 'Verification cancellation reason.' }, adminToken)
    );
    check('Admin can cancel published proposal with a reason', cancelled.status === 200 && cancelled.body.proposal.status === 'cancelled' && cancelled.body.proposal.cancellationReason === 'Verification cancellation reason.', JSON.stringify(cancelled.body));

    const afterCancellation = await request('/api/proposals', { headers: { Authorization: `Bearer ${memberToken}` } });
    check('Cancelled proposal is hidden from normal active listing', afterCancellation.status === 200 && !afterCancellation.body.proposals.some((proposal) => proposal.id === activeProposal.id), JSON.stringify(afterCancellation.body));

    console.log('SPRINT_1_TESTS_PASSED');
    for (const label of passed) {
      console.log(`PASS - ${label}`);
    }
  } finally {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    if (adminId) {
      await Proposal.deleteMany({ createdBy: adminId });
    }
    await User.deleteMany({ email: { $in: [adminEmail, memberEmail] } });
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error('SPRINT_1_TEST_FAILURE:', error.message);
  process.exitCode = 1;
});
