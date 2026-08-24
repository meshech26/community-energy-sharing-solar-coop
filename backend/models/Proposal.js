const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    benefits: {
      type: String,
      required: true,
      trim: true,
    },
    estimatedCost: {
      type: Number,
      required: true,
      min: 0,
    },
    householdImpact: {
      type: String,
      required: true,
      trim: true,
    },
    votingStartDate: {
      type: Date,
      required: true,
    },
    votingDeadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'upcoming', 'active', 'closed', 'cancelled'],
      default: 'draft',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

proposalSchema.index({ status: 1, votingStartDate: 1, votingDeadline: 1 });

module.exports = mongoose.model('Proposal', proposalSchema);
