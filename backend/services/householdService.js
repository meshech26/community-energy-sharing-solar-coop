const Household = require('../models/Household');

async function createHousehold(data) {
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!name || name.length > 100) throw Object.assign(new Error('Enter a household name between 1 and 100 characters.'), { status: 400 });
  // Includes legacy records without nameKey. The partial unique nameKey index
  // additionally protects concurrent creates, without rewriting legacy data.
  const existing = await Household.findOne({ name }).collation({ locale: 'en', strength: 2 });
  if (existing) throw Object.assign(new Error('A household with this name already exists.'), { status: 409 });
  return Household.createWithInvitationCode({ name, ...(data.invitationCode == null ? {} : { invitationCode: data.invitationCode }) });
}

async function ensureSeedHousehold(data) {
  const filter = data.invitationCode == null ? { name: data.name.trim() } : { invitationCode: data.invitationCode.trim().toUpperCase() };
  const existing = await Household.findOne(filter).collation({ locale: 'en', strength: 2 });
  if (existing) return existing;
  try { return await createHousehold(data); }
  catch (error) {
    if (error.code === 11000 || error.status === 409) {
      const concurrent = await Household.findOne(filter).collation({ locale: 'en', strength: 2 });
      if (concurrent) return concurrent;
    }
    throw error;
  }
}
module.exports = { createHousehold, ensureSeedHousehold };
