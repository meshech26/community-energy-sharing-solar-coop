const express = require('express');

const {
  cancelProposal,
  createProposal,
  getProposalDetails,
  listAdminProposals,
  listPublishedProposals,
  publishProposal,
  updateDraft,
} = require('../controllers/proposalController');
const { getResults, getVoteStatus, submitVote } = require('../controllers/voteController');
const requireAuth = require('../middleware/authMiddleware');
const requireCoopAdmin = require('../middleware/requireCoopAdmin');

const router = express.Router();

router.use(requireAuth);

router.get('/', listPublishedProposals);
router.get('/admin/mine', requireCoopAdmin, listAdminProposals);
router.post('/', requireCoopAdmin, createProposal);
router.patch('/:id/draft', requireCoopAdmin, updateDraft);
router.post('/:id/publish', requireCoopAdmin, publishProposal);
router.post('/:id/cancel', requireCoopAdmin, cancelProposal);
router.post('/:id/vote', submitVote);
router.get('/:id/vote/status', getVoteStatus);
router.get('/:id/results', getResults);
router.get('/:id', getProposalDetails);

module.exports = router;
