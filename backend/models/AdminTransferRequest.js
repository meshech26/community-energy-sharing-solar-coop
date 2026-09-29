const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  scope: { type: String, default: 'community', enum: ['community'], required: true },
  currentAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'cancelled'], default: 'pending', required: true },
  respondedAt: { type: Date, default: null },
}, { timestamps: true });

// One co-op, one outstanding nomination, including concurrent API requests.
schema.index({ scope: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });
module.exports = mongoose.model('AdminTransferRequest', schema);
