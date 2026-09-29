import api from './api';

export const getAdminTransferSummary = async () => (await api.get('/admin-transfers')).data;
export const getEligibleAdminMembers = async () => (await api.get('/admin-transfers/members')).data.members;
export const nominateAdministrator = async (targetUserId) => (await api.post('/admin-transfers', { targetUserId })).data.request;
export const getAdminTransfer = async (id) => (await api.get(`/admin-transfers/${id}`)).data.request;
export const respondToAdminTransfer = async (id, action) => {
  if (!['accept', 'decline', 'cancel'].includes(action)) throw new Error('Invalid transfer action');
  return (await api.post(`/admin-transfers/${id}/${action}`)).data.request;
};
