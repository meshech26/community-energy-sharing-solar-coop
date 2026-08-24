const mongoose = require('mongoose');

const Household = require('../models/Household');
const Proposal = require('../models/Proposal');
const Vote = require('../models/Vote');
const { refreshProposalStatuses } = require('../services/proposalStatusService');

const choices = new Set(['yes', 'no', 'abstain']);

const validId = (id) => mongoose.isObjectIdOrHexString(id);

const getProposal = async (id) => {
  if (!validId(id)) {
    return { error: 'invalid' };
  }

  await refreshProposalStatuses();
  const proposal = await Proposal.findById(id);
  if (!proposal) {
    return { error: 'missing' };
  }

  return { proposal };
};

const getVotingEligibilityError = (proposal, now = new Date()) => {
  if (proposal.status === 'draft') {
    return 'Voting is unavailable because this proposal has not been published.';
  }

  if (proposal.status === 'cancelled') {
    return 'Voting is unavailable because this proposal has been cancelled.';
  }

  if (proposal.status === 'closed' || now >= proposal.votingDeadline) {
    return 'Voting is closed for this proposal.';
  }

  if (proposal.status === 'upcoming' || now < proposal.votingStartDate) {
    return 'Voting has not started for this proposal.';
  }

  if (proposal.status !== 'active') {
    return 'Voting is unavailable for this proposal.';
  }

  return null;
};

const submitVote = async (req, res) => {
  try {
    const { choice } = req.body || {};
    if (!choices.has(choice)) {
      return res.status(400).json({ message: 'choice must be one of: yes, no, abstain.' });
    }

    if (!req.user.household) {
      return res.status(409).json({ message: 'Your account is not linked to a household.' });
    }

    const result = await getProposal(req.params.id);
    if (result.error === 'invalid') {
      return res.status(400).json({ message: 'Invalid proposal ID.' });
    }
    if (result.error === 'missing') {
      return res.status(404).json({ message: 'Proposal not found.' });
    }

    const eligibilityError = getVotingEligibilityError(result.proposal);
    if (eligibilityError) {
      return res.status(409).json({ message: eligibilityError });
    }

    const existingVote = await Vote.exists({
      proposal: result.proposal._id,
      household: req.user.household,
    });
    if (existingVote) {
      return res.status(409).json({ message: 'Your household has already submitted its final vote for this proposal.' });
    }

    await Vote.create({
      proposal: result.proposal._id,
      household: req.user.household,
      submittedBy: req.user._id,
      choice,
    });

    // Do not echo the submitted choice. The client only needs confirmation
    // that its household has now completed its final vote.
    return res.status(201).json({
      message: 'Your household vote has been submitted successfully.',
      hasVoted: true,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Your household has already submitted its final vote for this proposal.' });
    }

    console.error('Vote submission failed:', error.message);
    return res.status(500).json({ message: 'Unable to submit vote at this time.' });
  }
};

const getVoteStatus = async (req, res) => {
  try {
    if (!req.user.household) {
      return res.status(409).json({ message: 'Your account is not linked to a household.' });
    }

    const result = await getProposal(req.params.id);
    if (result.error === 'invalid') {
      return res.status(400).json({ message: 'Invalid proposal ID.' });
    }
    if (result.error === 'missing' || result.proposal.status === 'draft') {
      return res.status(404).json({ message: 'Proposal not found.' });
    }

    const hasVoted = Boolean(
      await Vote.exists({
        proposal: result.proposal._id,
        household: req.user.household,
      })
    );

    return res.status(200).json({ hasVoted });
  } catch (error) {
    console.error('Vote status lookup failed:', error.message);
    return res.status(500).json({ message: 'Unable to retrieve voting status at this time.' });
  }
};

const getFinalDecision = (yesVotes, noVotes) => {
  if (yesVotes > noVotes) return 'Approved';
  if (noVotes > yesVotes) return 'Rejected';
  return 'Tied';
};

const getResults = async (req, res) => {
  try {
    const result = await getProposal(req.params.id);
    if (result.error === 'invalid') {
      return res.status(400).json({ message: 'Invalid proposal ID.' });
    }
    if (result.error === 'missing' || result.proposal.status === 'draft') {
      return res.status(404).json({ message: 'Proposal not found.' });
    }
    if (result.proposal.status === 'cancelled') {
      return res.status(409).json({ message: 'Final results are unavailable for a cancelled proposal.' });
    }
    if (result.proposal.status !== 'closed') {
      return res.status(409).json({ message: 'Final results are available only after voting closes.' });
    }

    const counts = await Vote.aggregate([
      { $match: { proposal: result.proposal._id } },
      { $group: { _id: '$choice', count: { $sum: 1 } } },
    ]);
    const totals = { yes: 0, no: 0, abstain: 0 };
    for (const count of counts) {
      totals[count._id] = count.count;
    }

    const participatingHouseholds = totals.yes + totals.no + totals.abstain;
    // The current Household collection represents the participating community
    // households, so all household records are eligible for each proposal.
    const eligibleHouseholds = await Household.countDocuments();
    const participationRate = eligibleHouseholds === 0
      ? 0
      : Number(((participatingHouseholds / eligibleHouseholds) * 100).toFixed(2));

    return res.status(200).json({
      results: {
        yesVotes: totals.yes,
        noVotes: totals.no,
        abstainVotes: totals.abstain,
        totalVotes: participatingHouseholds,
        participatingHouseholds,
        eligibleHouseholds,
        participationRate,
        finalDecision: getFinalDecision(totals.yes, totals.no),
      },
    });
  } catch (error) {
    console.error('Final results lookup failed:', error.message);
    return res.status(500).json({ message: 'Unable to retrieve final results at this time.' });
  }
};

module.exports = {
  getResults,
  getVoteStatus,
  submitVote,
};
