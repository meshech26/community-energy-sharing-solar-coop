const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
  proposal: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required() { return !this.type?.startsWith('admin_transfer_'); } },
  transferRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminTransferRequest', required() { return this.type?.startsWith('admin_transfer_'); } },
  type: { type: String, enum: ['proposal_published', 'voting_deadline_reminder', 'proposal_cancelled', 'admin_transfer_request', 'admin_transfer_accepted', 'admin_transfer_declined'], required: true },
  stage: { type: String, default: 'once', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  expiresAt: { type: Date, default: null },
  isSuppressed: { type: Boolean, default: false },
}, { timestamps: true });

// One persistent record per member for each event. Household eligibility is
// shared, but read state belongs to the individual member.
notificationSchema.index({ recipient: 1, proposal: 1, type: 1, stage: 1 }, { unique: true });
notificationSchema.index({ recipient: 1, isSuppressed: 1, createdAt: -1 });
module.exports = mongoose.model('Notification', notificationSchema);
