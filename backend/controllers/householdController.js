const Household = require('../models/Household');
const { createHousehold } = require('../services/householdService');
const safeHousehold = (item) => ({ id: item._id, name: item.name, invitationCode: item.invitationCode });

exports.list = async (req, res) => {
  try {
    const households = await Household.find().select('name invitationCode').sort({ createdAt: -1, _id: -1 });
    res.json({ households: households.map(safeHousehold) });
  } catch { res.status(500).json({ message: 'Unable to load households. Please try again.' }); }
};
exports.create = async (req, res) => {
  try {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'invitationCode')) {
      return res.status(400).json({ message: 'Invitation codes are generated automatically. Enter only the household name.' });
    }
    const household = await createHousehold({ name: req.body?.name });
    res.status(201).json({ household: safeHousehold(household) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    if (error.code === 11000 && error.keyPattern?.nameKey) return res.status(409).json({ message: 'A household with this name already exists.' });
    if (error.code === 'INVITATION_CODE_EXHAUSTED') return res.status(503).json({ message: 'Unable to create an invitation code right now. Please try again.' });
    return res.status(500).json({ message: 'Unable to create the household. Please try again.' });
  }
};
