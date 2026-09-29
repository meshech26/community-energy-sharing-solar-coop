import api from './api';
export const listHouseholds = async () => (await api.get('/households')).data.households;
export const createHousehold = async (name) => (await api.post('/households', { name })).data.household;
