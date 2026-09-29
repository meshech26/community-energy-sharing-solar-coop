import api from './api';

export const listNotifications = async (page = 1) => (await api.get('/notifications', { params: { page } })).data;
export const markNotificationRead = async (id) => (await api.patch(`/notifications/${id}/read`)).data.notification;
