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
router.get('/:id', getProposalDetails);

module.exports = router;
