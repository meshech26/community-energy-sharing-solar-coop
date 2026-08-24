const Proposal = require('../models/Proposal');

const getDateDrivenStatus = (proposal, now = new Date()) => {
  if (proposal.status === 'draft' || proposal.status === 'cancelled') {
    return proposal.status;
  }

  const start = new Date(proposal.votingStartDate);
  const deadline = new Date(proposal.votingDeadline);

  if (now < start) {
    return 'upcoming';
  }

  if (now >= deadline) {
    return 'closed';
  }

  return 'active';
};

const refreshProposalStatuses = async (now = new Date()) => {
  await Proposal.updateMany(
    { status: { $in: ['upcoming', 'active'] }, votingDeadline: { $lte: now } },
    { $set: { status: 'closed' } }
  );

  await Proposal.updateMany(
    {
      status: { $in: ['upcoming', 'active'] },
      votingStartDate: { $lte: now },
      votingDeadline: { $gt: now },
    },
    { $set: { status: 'active' } }
  );

  await Proposal.updateMany(
    {
      status: { $in: ['upcoming', 'active'] },
      votingStartDate: { $gt: now },
      votingDeadline: { $gt: now },
    },
    { $set: { status: 'upcoming' } }
  );
};

module.exports = {
  getDateDrivenStatus,
  refreshProposalStatuses,
};
