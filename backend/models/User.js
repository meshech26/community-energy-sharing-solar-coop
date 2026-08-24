const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    invitationCode: {
      type: String,
    },

    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Household',
    },

    role: {
      type: String,
      enum: ['HOUSEHOLD_MEMBER', 'COOP_ADMIN'],
      default: 'HOUSEHOLD_MEMBER',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);