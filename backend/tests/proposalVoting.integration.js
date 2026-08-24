const mongoose = require('mongoose');

require('dotenv').config();

const Household = require('../models/Household');
const Proposal = require('../models/Proposal');
const User = require('../models/User');
const Vote = require('../models/Vote');

const api = process.env.TEST_API_URL || 'http://127.0.0.1:5000';
const suffix = Date.now().toString(36);
const password = 'ProposalVotePass123';
const testUsers = [
  { key: 'admin', name: 'Voting Test Admin', email: `vote.admin.${suffix}@solarshare.test`, invitationCode: 'H03-SOLAR' },
  { key: 'h1a', name: 'Voting H01 Member A', email: `vote.h1a.${suffix}@solarshare.test`, invitationCode: 'H01-SOLAR' },
  { key: 'h1b', name: 'Voting H01 Member B', email: `vote.h1b.${suffix}@solarshare.test`, invitationCode: 'H01-SOLAR' },
  { key: 'h2', name: 'Voting H02 Member', email: `vote.h2.${suffix}@solarshare.test`, invitationCode: 'H02-SOLAR' },
  { key: 'h3', name: 'Voting H03 Member', email: `vote.h3.${suffix}@solarshare.test`, invitationCode: 'H03-SOLAR' },
  { key: 'h4', name: 'Voting H04 Member', email: `vote.h4.${suffix}@solarshare.test`, invitationCode: 'H04-SOLAR' },
];
const passed = [];
const tokens = {};
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
  benefits: 'More resilient shared renewable energy usage',
  estimatedCost: 15000,
  householdImpact: 'The participating households share benefits and costs.',
  votingStartDate: new Date(Date.now() + startOffsetMinutes * 60000).toISOString(),
  votingDeadline: new Date(Date.now() + deadlineOffsetMinutes * 60000).toISOString(),
});

const createDraft = async (title, startOffsetMinutes, deadlineOffsetMinutes) => {
  const result = await request(
    '/api/proposals',
    jsonOptions('POST', proposalBody(title, startOffsetMinutes, deadlineOffsetMinutes), tokens.admin)
  );
  check(`Admin can create proposal for voting test: ${title}`, result.status === 201 && result.body.proposal.status === 'draft', JSON.stringify(result.body));
  return result.body.proposal;
};

const publish = async (proposal, expectedStatus) => {
  const result = await request(`/api/proposals/${proposal.id}/publish`, jsonOptions('POST', {}, tokens.admin));
  check(`Admin can publish ${expectedStatus} voting-test proposal`, result.status === 200 && result.body.proposal.status === expectedStatus, JSON.stringify(result.body));
  return result.body.proposal;
};

const submitVote = (proposalId, choice, token) => request(
  `/api/proposals/${proposalId}/vote`,
  jsonOptions('POST', { choice }, token)
);

const run = async () => {
  try {
    for (const testUser of testUsers) {
      const registration = await request(
        '/api/auth/register',
        jsonOptions('POST', {
          name: testUser.name,
          email: testUser.email,
          password,
          invitationCode: testUser.invitationCode,
        })
      );
      check(`Authentication registration works for ${testUser.key}`, registration.status === 201, JSON.stringify(registration.body));
      if (testUser.key === 'admin') {
        adminId = registration.body.user.id;
      }
    }

    await mongoose.connect(process.env.MONGO_URI);
    await User.updateOne({ _id: adminId }, { $set: { isCoopAdmin: true } });
    await Vote.createIndexes();
    await mongoose.disconnect();

    for (const testUser of testUsers) {
      const login = await request('/api/auth/login', jsonOptions('POST', { email: testUser.email, password }));
      check(`Authentication login works for ${testUser.key}`, login.status === 200 && Boolean(login.body.token), JSON.stringify(login.body));
      check(`Authentication response is password-safe for ${testUser.key}`, !Object.hasOwn(login.body.user, 'password'), JSON.stringify(login.body));
      tokens[testUser.key] = login.body.token;
    }

    const currentUser = await request('/api/auth/me', { headers: { Authorization: `Bearer ${tokens.h1a}` } });
    check('JWT current-user endpoint still works', currentUser.status === 200 && currentUser.body.user.email === testUsers[1].email, JSON.stringify(currentUser.body));

    const draft = await createDraft(`Voting Draft Proposal ${suffix}`, -10, 30);

    const unauthenticatedVote = await submitVote(draft.id, 'yes');
    check('Unauthenticated vote is rejected', unauthenticatedVote.status === 401, JSON.stringify(unauthenticatedVote.body));

    const invalidJwtVote = await submitVote(draft.id, 'yes', 'invalid-token');
    check('Invalid JWT vote is rejected', invalidJwtVote.status === 401, JSON.stringify(invalidJwtVote.body));

    const draftVote = await submitVote(draft.id, 'yes', tokens.h4);
    check('Draft proposal cannot be voted on', draftVote.status === 409, JSON.stringify(draftVote.body));

    const activeDraft = await createDraft(`Voting Active Proposal ${suffix}`, -10, 30);
    const activeProposal = await publish(activeDraft, 'active');

    const invalidIdVote = await submitVote('not-a-valid-id', 'yes', tokens.h4);
    check('Invalid proposal ID is handled for voting', invalidIdVote.status === 400, JSON.stringify(invalidIdVote.body));

    const invalidChoice = await submitVote(activeProposal.id, 'maybe', tokens.h4);
    check('Invalid voting choice is rejected', invalidChoice.status === 400, JSON.stringify(invalidChoice.body));

    const yesVote = await submitVote(activeProposal.id, 'yes', tokens.h1a);
    check('YES vote works on active proposal', yesVote.status === 201 && yesVote.body.hasVoted === true && !Object.hasOwn(yesVote.body, 'choice'), JSON.stringify(yesVote.body));

    const voteStatus = await request(`/api/proposals/${activeProposal.id}/vote/status`, { headers: { Authorization: `Bearer ${tokens.h1a}` } });
    check('Already-voted status is private and available to current household', voteStatus.status === 200 && voteStatus.body.hasVoted === true && Object.keys(voteStatus.body).length === 1, JSON.stringify(voteStatus.body));

    const sameHouseholdSecondMember = await submitVote(activeProposal.id, 'no', tokens.h1b);
    check('Second member of same household cannot vote', sameHouseholdSecondMember.status === 409, JSON.stringify(sameHouseholdSecondMember.body));

    const attemptedVoteChange = await submitVote(activeProposal.id, 'no', tokens.h1a);
    check('Submitted vote cannot be changed', attemptedVoteChange.status === 409, JSON.stringify(attemptedVoteChange.body));

    const noVote = await submitVote(activeProposal.id, 'no', tokens.h2);
    check('NO vote works from a different household', noVote.status === 201 && noVote.body.hasVoted === true, JSON.stringify(noVote.body));

    const abstainVote = await submitVote(activeProposal.id, 'abstain', tokens.h3);
    check('ABSTAIN vote works from a different household', abstainVote.status === 201 && abstainVote.body.hasVoted === true, JSON.stringify(abstainVote.body));

    const adminExtraVote = await submitVote(activeProposal.id, 'yes', tokens.admin);
    check('Co-op Admin does not receive an extra household vote', adminExtraVote.status === 409, JSON.stringify(adminExtraVote.body));

    const activeResults = await request(`/api/proposals/${activeProposal.id}/results`, { headers: { Authorization: `Bearer ${tokens.h4}` } });
    check('Results are hidden while voting is active', activeResults.status === 409 && !JSON.stringify(activeResults.body).includes('yesVotes'), JSON.stringify(activeResults.body));

    const adminActiveResults = await request(`/api/proposals/${activeProposal.id}/results`, { headers: { Authorization: `Bearer ${tokens.admin}` } });
    check('Co-op Admin cannot see live aggregate results', adminActiveResults.status === 409 && !JSON.stringify(adminActiveResults.body).includes('yesVotes'), JSON.stringify(adminActiveResults.body));

    const upcomingDraft = await createDraft(`Voting Upcoming Proposal ${suffix}`, 20, 40);
    const upcomingProposal = await publish(upcomingDraft, 'upcoming');
    const upcomingVote = await submitVote(upcomingProposal.id, 'yes', tokens.h4);
    check('Upcoming proposal cannot be voted on', upcomingVote.status === 409, JSON.stringify(upcomingVote.body));

    const closedDraft = await createDraft(`Voting Closed Proposal ${suffix}`, -40, -20);
    const closedProposal = await publish(closedDraft, 'closed');
    const closedVote = await submitVote(closedProposal.id, 'yes', tokens.h4);
    check('Closed proposal cannot be voted on', closedVote.status === 409, JSON.stringify(closedVote.body));

    const cancelledDraft = await createDraft(`Voting Cancelled Proposal ${suffix}`, -10, 30);
    const cancelledProposal = await publish(cancelledDraft, 'active');
    const cancellation = await request(
      `/api/proposals/${cancelledProposal.id}/cancel`,
      jsonOptions('POST', { cancellationReason: 'Voting integration test cancellation.' }, tokens.admin)
    );
    check('Existing Sprint 1 cancellation still works', cancellation.status === 200 && cancellation.body.proposal.status === 'cancelled', JSON.stringify(cancellation.body));
    const cancelledVote = await submitVote(cancelledProposal.id, 'yes', tokens.h4);
    check('Cancelled proposal cannot be voted on', cancelledVote.status === 409, JSON.stringify(cancelledVote.body));

    const publicProposalList = await request('/api/proposals', { headers: { Authorization: `Bearer ${tokens.h4}` } });
    check('Existing Sprint 1 published proposal listing still works', publicProposalList.status === 200 && publicProposalList.body.proposals.some((proposal) => proposal.id === activeProposal.id), JSON.stringify(publicProposalList.body));

    await mongoose.connect(process.env.MONGO_URI);
    await Proposal.updateOne(
      { _id: activeProposal.id },
      { $set: { votingDeadline: new Date(Date.now() - 60000), status: 'active' } }
    );
    const eligibleHouseholds = await Household.countDocuments();
    await mongoose.disconnect();

    const finalResults = await request(`/api/proposals/${activeProposal.id}/results`, { headers: { Authorization: `Bearer ${tokens.h4}` } });
    const results = finalResults.body.results || {};
    check('Aggregate results are available after proposal closes', finalResults.status === 200, JSON.stringify(finalResults.body));
    check('Yes No Abstain totals are correct', results.yesVotes === 1 && results.noVotes === 1 && results.abstainVotes === 1 && results.totalVotes === 3 && results.participatingHouseholds === 3, JSON.stringify(results));
    check('Participation rate is calculated at household level', results.eligibleHouseholds === eligibleHouseholds && results.participationRate === Number(((3 / eligibleHouseholds) * 100).toFixed(2)), JSON.stringify(results));
    check('Final decision follows the documented tie rule', results.finalDecision === 'Tied', JSON.stringify(results));
    check('Final results expose aggregate data only', !JSON.stringify(results).includes('submittedBy') && !JSON.stringify(results).includes('household') && !JSON.stringify(results).includes(testUsers[1].email), JSON.stringify(results));

    const adminFinalResults = await request(`/api/proposals/${activeProposal.id}/results`, { headers: { Authorization: `Bearer ${tokens.admin}` } });
    check('Co-op Admin receives only the same private aggregate results', adminFinalResults.status === 200 && !JSON.stringify(adminFinalResults.body).includes('submittedBy') && !JSON.stringify(adminFinalResults.body).includes('household'), JSON.stringify(adminFinalResults.body));

    console.log('PROPOSAL_VOTING_TESTS_PASSED');
    for (const label of passed) {
      console.log(`PASS - ${label}`);
    }
  } finally {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    if (adminId) {
      const proposalIds = await Proposal.find({ createdBy: adminId }).distinct('_id');
      if (proposalIds.length > 0) {
        await Vote.deleteMany({ proposal: { $in: proposalIds } });
        await Proposal.deleteMany({ _id: { $in: proposalIds } });
      }
    }
    await User.deleteMany({ email: { $in: testUsers.map((testUser) => testUser.email) } });
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error('PROPOSAL_VOTING_TEST_FAILURE:', error.message);
  process.exitCode = 1;
});
