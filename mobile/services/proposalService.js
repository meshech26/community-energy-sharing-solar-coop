import api from './api';

export const listPublishedProposals = async () => (await api.get('/proposals')).data.proposals;
export const getProposal = async (proposalId) => (await api.get(`/proposals/${proposalId}`)).data.proposal;
export const listMyProposals = async () => (await api.get('/proposals/admin/mine')).data.proposals;
export const createProposal = async (payload) => (await api.post('/proposals', payload)).data.proposal;
export const updateDraft = async (proposalId, payload) => (await api.patch(`/proposals/${proposalId}/draft`, payload)).data.proposal;
export const deleteDraft = async (proposalId) => (await api.delete(`/proposals/${proposalId}/draft`)).data;
export const publishProposal = async (proposalId) => (await api.post(`/proposals/${proposalId}/publish`)).data.proposal;
export const cancelProposal = async (proposalId, cancellationReason) => (
  await api.post(`/proposals/${proposalId}/cancel`, { cancellationReason })
).data.proposal;
export const getVoteStatus = async (proposalId) => (await api.get(`/proposals/${proposalId}/vote/status`)).data;
export const submitVote = async (proposalId, choice) => (await api.post(`/proposals/${proposalId}/vote`, { choice })).data;
export const getResults = async (proposalId) => (await api.get(`/proposals/${proposalId}/results`)).data.results;
