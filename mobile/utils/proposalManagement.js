// Presentation rules only. Authorization and lifecycle enforcement stay on the server.
export const adminCategories = ['Drafts', 'Published', 'Cancelled', 'History'];
export const historyFilters = ['All', 'Closed', 'Archived'];

export const getProposalManagementState = (proposal) => {
  const archived = Boolean(proposal.archivedAt);
  const closed = !archived && proposal.status === 'closed';
  const draft = !archived && proposal.status === 'draft';
  const published = !archived && ['active', 'upcoming'].includes(proposal.status);
  const cancelled = !archived && proposal.status === 'cancelled';
  return { archived, closed, draft, published, cancelled,
    category: archived || closed ? 'History' : draft ? 'Drafts' : published ? 'Published' : cancelled ? 'Cancelled' : null,
  };
};

export const selectAdminProposals = (proposals, category, historyFilter = 'All') => proposals.filter((proposal) => {
  const state = getProposalManagementState(proposal);
  return state.category === category && (category !== 'History' || historyFilter === 'All'
    || (historyFilter === 'Archived' ? state.archived : state.closed));
});

export const proposalActionCopy = {
  publish: {
    title: 'Publish proposal?', cancelLabel: 'Keep Editing', confirmLabel: 'Publish',
    message: 'Household Members will be able to view this proposal once it becomes available.',
    success: 'Proposal published successfully.', failure: 'We could not publish this proposal. Please try again.',
  },
  delete: {
    title: 'Delete draft?', cancelLabel: 'Keep Draft', confirmLabel: 'Delete Draft', destructive: true,
    message: 'This draft has not been published. Deleting it will permanently remove it.',
    success: 'Draft deleted successfully.', failure: 'We could not delete this draft. Please try again.',
  },
  archive: {
    title: 'Archive proposal?', cancelLabel: 'Cancel', confirmLabel: 'Archive',
    message: 'This proposal will be removed from the Cancelled list and kept in Proposal History as a read-only record.',
    success: 'Proposal archived successfully.', failure: 'We could not archive this proposal. Please try again.',
  },
};
