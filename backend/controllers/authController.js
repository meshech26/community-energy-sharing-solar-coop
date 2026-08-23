const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Household = require('../models/Household');
const User = require('../models/User');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const toSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  household: user.household,
  isCoopAdmin: user.isCoopAdmin,
});

const isValidText = (value) => typeof value === 'string' && value.trim().length > 0;

const register = async (req, res) => {
  try {
    const { name, email, password, invitationCode } = req.body || {};

    if (![name, email, password, invitationCode].every(isValidText)) {
      return res.status(400).json({ message: 'Name, email, password, and invitation code are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedInvitationCode = invitationCode.trim().toUpperCase();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const household = await Household.findOne({ invitationCode: normalizedInvitationCode });
    if (!household) {
      return res.status(400).json({ message: 'The household invitation code is invalid.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      household: household._id,
      isCoopAdmin: false,
    });

    const token = createToken(user._id.toString());

    return res.status(201).json({
      token,
      user: toSafeUser(user),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    console.error('Registration failed:', error.message);
    return res.status(500).json({ message: 'Unable to register at this time.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (![email, password].every(isValidText)) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = createToken(user._id.toString());

    return res.status(200).json({
      token,
      user: toSafeUser(user),
    });
  } catch (error) {
    console.error('Login failed:', error.message);
    return res.status(500).json({ message: 'Unable to log in at this time.' });
  }
};

const getCurrentUser = (req, res) => res.status(200).json({ user: toSafeUser(req.user) });

module.exports = {
  register,
  login,
  getCurrentUser,
};
