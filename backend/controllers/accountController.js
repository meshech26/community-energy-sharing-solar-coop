const bcrypt = require('bcrypt');
const User = require('../models/User');
const Household = require('../models/Household');
const resetService = require('../services/passwordResetService');
const resetEmail = require('../services/passwordResetEmail');
const generic = 'If an account exists for this email, a password reset link has been sent.';
const invalid = 'This password reset link is invalid or has expired.';
function passwordError(body) {
  if (typeof body.newPassword !== 'string' || !body.newPassword.trim() || body.newPassword.length < 8) return 'Password must be at least 8 characters long.';
  if (body.newPassword !== body.confirmPassword) return 'Passwords do not match.';
  return null;
}
exports.forgot = async (req, res) => {
  const email = req.body?.email;
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return res.status(400).json({ message: 'Please provide a valid email address.' });
  // Configuration failure is global and identical for known/unknown accounts.
  try { resetEmail.assertConfigured(); }
  catch { return res.status(503).json({ message: 'Password reset delivery is currently unavailable. Please contact support.' }); }
  try {
    const address = email.trim().toLowerCase();
    const token = await resetService.issueReset(address);
    // Do not expose SMTP latency/failure as a known-account response difference.
    // This small app uses in-process delivery rather than introducing a job queue.
    if (token) void resetEmail.sendResetLink(address, token).catch(() => {
      console.warn('Password reset request could not be completed.');
    });
  } catch {
    // Never log provider errors, recipients, links or credentials, or reveal
    // existence through a delivery-specific public error.
    console.warn('Password reset request could not be completed.');
  }
  return res.json({ message: generic });
};
exports.reset = async (req, res) => {
  const body = req.body || {};
  const error = passwordError(body);
  if (error) return res.status(400).json({ message: error });
  if (typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)) return res.status(400).json({ message: invalid });
  try {
    const password = await bcrypt.hash(body.newPassword, 12);
    // Compare-and-update atomically consumes the token, including concurrent requests.
    const user = await User.findOneAndUpdate({ passwordResetTokenHash: resetService.hashToken(body.token), passwordResetExpiresAt: { $gt: new Date() } }, {
      $set: { password }, $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 },
    });
    if (!user) return res.status(400).json({ message: invalid });
    return res.json({ message: 'Password reset successfully' });
  } catch { return res.status(500).json({ message: 'Unable to reset your password. Please try again.' }); }
};
exports.change = async (req, res) => {
  const body = req.body || {};
  const error = passwordError(body);
  if (error) return res.status(400).json({ message: error });
  if (typeof body.currentPassword !== 'string' || !body.currentPassword) return res.status(400).json({ message: 'Enter your current password.' });
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await bcrypt.compare(body.currentPassword, user.password))) return res.status(400).json({ message: 'Current password is incorrect.' });
    const password = await bcrypt.hash(body.newPassword, 12);
    const result = await User.updateOne({ _id: user._id, password: user.password }, { $set: { password }, $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 } });
    if (!result.modifiedCount) return res.status(409).json({ message: 'Your password changed. Please sign in again.' });
    return res.json({ message: 'Password updated successfully.' });
  } catch { return res.status(500).json({ message: 'Unable to update your password. Please try again.' }); }
};
exports.profile = async (req, res) => {
  try {
    const household = await Household.findById(req.user.household).select('name');
    const user = req.user;
    return res.json({ user: { id: user._id, name: user.name, email: user.email, household: user.household, householdName: household?.name || 'Household unavailable', isCoopAdmin: user.isCoopAdmin } });
  } catch { return res.status(500).json({ message: 'Unable to load your account. Please try again.' }); }
};
