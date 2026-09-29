const mongoose = require('mongoose');
const invitationCodes = require('../services/invitationCode');

const householdSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    invitationCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    // Only new records get a key; no migration of existing households is needed.
    nameKey: { type: String, select: false },
  },
  {
    timestamps: true,
  }
);

householdSchema.index({ nameKey: 1 }, { unique: true, partialFilterExpression: { nameKey: { $type: 'string' } } });
householdSchema.pre('validate', function () {
  if (!this.isNew) return;
  if (this.invitationCode == null) this.invitationCode = invitationCodes.generateInvitationCode();
  if (typeof this.name === 'string') this.nameKey = this.name.trim().toLowerCase();
});

// All application/seed creation uses this bounded save-and-retry entry point.
// The unique index, not a preflight query, is the final collision authority.
householdSchema.statics.createWithInvitationCode = async function (data) {
  const generated = data.invitationCode == null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try { return await this.create(data); }
    catch (error) {
      if (!generated || error.code !== 11000 || !error.keyPattern?.invitationCode) throw error;
    }
  }
  throw Object.assign(new Error('Unable to allocate an invitation code. Please try again.'), { code: 'INVITATION_CODE_EXHAUSTED' });
};

module.exports = mongoose.model('Household', householdSchema);
