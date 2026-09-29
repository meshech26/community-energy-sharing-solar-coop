const mongoose = require('mongoose');

const Proposal = require('../models/Proposal');
const Vote = require('../models/Vote');
const Household = require('../models/Household');
const { createPublicationNotifications, createCancellationNotifications } = require('../services/notificationService');
const { getDateDrivenStatus, refreshProposalStatuses } = require('../services/proposalStatusService');

const editableFields = [
  'title',
  'summary',
  'description',
  'benefits',
  'estimatedCost',
  'householdImpact',
  'votingStartDate',
  'votingDeadline',
];

const proposalSelect = 'title summary description benefits estimatedCost householdImpact votingStartDate votingDeadline status createdBy publishedAt cancellationReason archivedAt createdAt updatedAt';

const toSafeProposer = (createdBy) => {
  if (!createdBy || !createdBy._id) {
    return createdBy || null;
  }

  return {
    id: createdBy._id,
    name: createdBy.name,
  };
};

const toSafeProposal = (proposal) => ({
  id: proposal._id,
  title: proposal.title,
  summary: proposal.summary,
  description: proposal.description,
  benefits: proposal.benefits,
  estimatedCost: proposal.estimatedCost,
  householdImpact: proposal.householdImpact,
  votingStartDate: proposal.votingStartDate,
  votingDeadline: proposal.votingDeadline,
  status: proposal.status,
  proposer: toSafeProposer(proposal.createdBy),
  publishedAt: proposal.publishedAt,
  cancellationReason: proposal.cancellationReason,
  archivedAt: proposal.archivedAt || null,
  createdAt: proposal.createdAt,
  updatedAt: proposal.updatedAt,
});

const validId = (id) => mongoose.isObjectIdOrHexString(id);

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

const validateProposalData = (data) => {
  for (const field of ['title', 'summary', 'description', 'benefits', 'householdImpact']) {
    if (!hasText(data[field])) {
      return `${field} is required.`;
    }
  }

  if (data.estimatedCost === '' || !Number.isFinite(Number(data.estimatedCost)) || Number(data.estimatedCost) < 0) {
    return 'estimatedCost must be a non-negative number.';
  }

  const start = new Date(data.votingStartDate);
  const deadline = new Date(data.votingDeadline);
  if (Number.isNaN(start.getTime()) || Number.isNaN(deadline.getTime())) {
    return 'votingStartDate and votingDeadline must be valid dates.';
  }

  if (start >= deadline) {
    return 'votingDeadline must be after votingStartDate.';
  }

  return null;
};

const normalizeProposalData = (data) => ({
  title: data.title.trim(),
  summary: data.summary.trim(),
  description: data.description.trim(),
  benefits: data.benefits.trim(),
  estimatedCost: Number(data.estimatedCost),
  householdImpact: data.householdImpact.trim(),
  votingStartDate: new Date(data.votingStartDate),
  votingDeadline: new Date(data.votingDeadline),
});

const getProposalForAdmin = async (id, userId) => {
  if (!validId(id)) {
    return { error: 'invalid' };
  }

  const proposal = await Proposal.findById(id).select(proposalSelect);
  if (!proposal) {
    return { error: 'missing' };
  }

  // Routes require current DB-backed admin permission; creator is audit history.
  return { proposal };
};

const createProposal = async (req, res) => {
  try {
    const validationError = validateProposalData(req.body || {});
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const proposal = await Proposal.create({
      ...normalizeProposalData(req.body),
      status: 'draft',
      createdBy: req.user._id,
    });
    await proposal.populate('createdBy', 'name');

    return res.status(201).json({ proposal: toSafeProposal(proposal) });
  } catch (error) {
    console.error('Proposal creation failed:', error.message);
    return res.status(500).json({ message: 'Unable to create proposal at this time.' });
  }
};

const listAdminProposals = async (req, res) => {
  try {
    await refreshProposalStatuses();
    const proposals = await Proposal.find({})
      .select(proposalSelect)
      .populate('createdBy', 'name')
      .sort({ updatedAt: -1 });

    return res.status(200).json({ proposals: proposals.map(toSafeProposal) });
  } catch (error) {
    console.error('Admin proposal listing failed:', error.message);
    return res.status(500).json({ message: 'Unable to retrieve proposals at this time.' });
  }
};

const updateDraft = async (req, res) => {
  try {
    const result = await getProposalForAdmin(req.params.id, req.user._id);
    if (result.error === 'invalid') {
      return res.status(400).json({ message: 'Invalid proposal ID.' });
    }
    if (result.error === 'missing') {
      return res.status(404).json({ message: 'Proposal not found.' });
    }
    if (result.error === 'forbidden') {
      return res.status(403).json({ message: 'You cannot manage this proposal.' });
    }

    const proposal = result.proposal;
    if (proposal.status !== 'draft') {
      return res.status(409).json({ message: 'Only draft proposals can be edited.' });
    }

    const updates = {};
    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        updates[field] = req.body[field];
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Provide at least one editable proposal field.' });
    }

    const mergedData = { ...proposal.toObject(), ...updates };
    const validationError = validateProposalData(mergedData);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    Object.assign(proposal, normalizeProposalData(mergedData));
    await proposal.save();
    await proposal.populate('createdBy', 'name');

    return res.status(200).json({ proposal: toSafeProposal(proposal) });
  } catch (error) {
    console.error('Draft update failed:', error.message);
    return res.status(500).json({ message: 'Unable to update proposal at this time.' });
  }
};

const publishProposal = async (req, res) => {
  try {
    const result = await getProposalForAdmin(req.params.id, req.user._id);
    if (result.error === 'invalid') return res.status(400).json({ message: 'Invalid proposal ID.' });
    if (result.error === 'missing') return res.status(404).json({ message: 'Proposal not found.' });
    if (result.error === 'forbidden') return res.status(403).json({ message: 'You cannot manage this proposal.' });

    const proposal = result.proposal;
    if (proposal.status !== 'draft') {
      return res.status(409).json({ message: 'Only draft proposals can be published.' });
    }

    const validationError = validateProposalData(proposal);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    proposal.status = getDateDrivenStatus({ ...proposal.toObject(), status: 'upcoming' });
    proposal.publishedAt = new Date();
    proposal.publicationNotificationsPending = true;
    await proposal.save();
    // A notification outage must not turn a successful publish into a failure.
    // The worker retries any pending fan-out with unique recipient event keys.
    try { await createPublicationNotifications(proposal); }
    catch (error) { console.error('Publication notifications pending retry:', error.message); }
    await proposal.populate('createdBy', 'name');

    return res.status(200).json({ proposal: toSafeProposal(proposal) });
  } catch (error) {
    console.error('Proposal publishing failed:', error.message);
    return res.status(500).json({ message: 'Unable to publish proposal at this time.' });
  }
};

const cancelProposal = async (req, res) => {
  try {
    const result = await getProposalForAdmin(req.params.id, req.user._id);
    if (result.error === 'invalid') return res.status(400).json({ message: 'Invalid proposal ID.' });
    if (result.error === 'missing') return res.status(404).json({ message: 'Proposal not found.' });
    if (result.error === 'forbidden') return res.status(403).json({ message: 'You cannot manage this proposal.' });

    const proposal = result.proposal;
    const cancellationReason = req.body?.cancellationReason;
    if (!hasText(cancellationReason)) {
      return res.status(400).json({ message: 'A cancellation reason is required.' });
    }
    if (proposal.status === 'draft') {
      return res.status(409).json({ message: 'Draft proposals cannot be cancelled. Edit or leave the draft instead.' });
    }
    if (proposal.status === 'cancelled') {
      return res.status(409).json({ message: 'This proposal is already cancelled.' });
    }

    proposal.status = 'cancelled';
    proposal.cancellationReason = cancellationReason.trim();
    proposal.cancellationNotificationsPending = Boolean(proposal.publishedAt);
    await proposal.save();
    try { await createCancellationNotifications(proposal); }
    catch (error) { console.error('Cancellation notifications pending retry:', error.message); }
    await proposal.populate('createdBy', 'name');

    return res.status(200).json({ proposal: toSafeProposal(proposal) });
  } catch (error) {
    console.error('Proposal cancellation failed:', error.message);
    return res.status(500).json({ message: 'Unable to cancel proposal at this time.' });
  }
};

const archiveProposal = async (req, res) => {
  try {
    const result = await getProposalForAdmin(req.params.id, req.user._id);
    if (result.error === 'invalid') return res.status(400).json({ message: 'Invalid proposal ID.' });
    if (result.error === 'missing') return res.status(404).json({ message: 'Proposal not found.' });
    if (result.error === 'forbidden') return res.status(403).json({ message: 'You cannot manage this proposal.' });
    if (result.proposal.archivedAt) return res.status(409).json({ message: 'This proposal is already archived.' });
    if (result.proposal.status !== 'cancelled') return res.status(409).json({ message: 'Only cancelled proposals can be archived.' });

    // Compare-and-set prevents duplicate requests from changing the audit timestamp.
    // Null also matches legacy records without archive fields. Lifecycle stays cancelled.
    const proposal = await Proposal.findOneAndUpdate(
      { _id: req.params.id, status: 'cancelled', archivedAt: null },
      { $set: { archivedAt: new Date(), archivedBy: req.user._id } },
      { returnDocument: 'after' }
    ).select(proposalSelect).populate('createdBy', 'name');
    if (!proposal) return res.status(409).json({ message: 'This proposal has changed or is already archived. Please refresh and try again.' });
    return res.status(200).json({ proposal: toSafeProposal(proposal) });
  } catch (error) {
    console.error('Proposal archiving failed:', error.message);
    return res.status(500).json({ message: 'Unable to archive proposal at this time.' });
  }
};

const deleteDraft = async (req, res) => {
  try {
    const result = await getProposalForAdmin(req.params.id, req.user._id);
    if (result.error === 'invalid') return res.status(400).json({ message: 'Invalid proposal ID.' });
    if (result.error === 'missing') return res.status(404).json({ message: 'Proposal not found.' });
    if (result.error === 'forbidden') return res.status(403).json({ message: 'You cannot manage this proposal.' });

    if (result.proposal.status !== 'draft') {
      return res.status(409).json({ message: 'Only draft proposals can be permanently deleted.' });
    }

    await Proposal.deleteOne({ _id: result.proposal._id });
    return res.status(200).json({ message: 'Draft proposal deleted successfully.', deletedProposalId: req.params.id });
  } catch (error) {
    console.error('Draft deletion failed:', error.message);
    return res.status(500).json({ message: 'Unable to delete draft proposal at this time.' });
  }
};

const listPublishedProposals = async (req, res) => {
  try {
    await refreshProposalStatuses();
    const proposals = await Proposal.find({ status: { $in: ['active', 'upcoming', 'closed'] }, archivedAt: null })
      .select(proposalSelect)
      .populate('createdBy', 'name');

    const statusOrder = { active: 0, upcoming: 1, closed: 2 };
    proposals.sort((left, right) => {
      const orderDifference = statusOrder[left.status] - statusOrder[right.status];
      if (orderDifference !== 0) return orderDifference;
      return new Date(left.votingStartDate) - new Date(right.votingStartDate);
    });

    const validHousehold = req.user.household && await Household.exists({ _id: req.user.household });
    const voted = validHousehold ? await Vote.distinct('proposal', {
      household: req.user.household, proposal: { $in: proposals.map((item) => item._id) },
    }) : [];
    const votedIds = new Set(voted.map(String));
    return res.status(200).json({ proposals: proposals.map((item) => ({ ...toSafeProposal(item),
      householdHasVoted: validHousehold ? votedIds.has(String(item._id)) : null,
    })) });
  } catch (error) {
    console.error('Proposal listing failed:', error.message);
    return res.status(500).json({ message: 'Unable to retrieve proposals at this time.' });
  }
};

const getProposalDetails = async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid proposal ID.' });
    }

    await refreshProposalStatuses();
    const proposal = await Proposal.findById(req.params.id)
      .select(proposalSelect)
      .populate('createdBy', 'name');
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found.' });
    }

    const isOwnerAdmin = req.user.isCoopAdmin === true;
    if (proposal.status === 'draft' && !isOwnerAdmin) {
      return res.status(403).json({ message: 'You are not authorised to view this draft proposal.' });
    }

    return res.status(200).json({ proposal: toSafeProposal(proposal) });
  } catch (error) {
    console.error('Proposal detail lookup failed:', error.message);
    return res.status(500).json({ message: 'Unable to retrieve proposal at this time.' });
  }
};

module.exports = {
  archiveProposal,
  cancelProposal,
  createProposal,
  deleteDraft,
  getProposalDetails,
  listAdminProposals,
  listPublishedProposals,
  publishProposal,
  toSafeProposal,
  updateDraft,
};
