const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      required: true,
    },
    household: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Household',
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    choice: {
      type: String,
      enum: ['yes', 'no', 'abstain'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// This is the authoritative one-final-vote-per-household rule. It prevents
// concurrent requests from separate users in the same household bypassing an
// application-level duplicate check.
voteSchema.index({ proposal: 1, household: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
