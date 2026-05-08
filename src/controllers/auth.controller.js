const { User, Role, Permission } = require('../models');
const { generateToken, comparePassword, hashPassword } = require('../utils/auth');
const crypto = require('crypto');
const { sendEmail } = require('../services/email.service');
const { Op } = require('sequelize');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role', include: [{ model: Permission, as: 'permissions' }] }],
    });

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is not active' });
    }

    const token = generateToken(user.id);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        permissions: (user.role?.permissions || []).map((p) => p.name),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpire = new Date(Date.now() + 3600000);
    await user.update({ resetToken, resetTokenExpire });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Token',
      message: `Reset your password here:\n\n${resetUrl}`,
    });

    res.json({ success: true, message: 'Email sent' });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      where: { resetToken: token, resetTokenExpire: { [Op.gt]: new Date() } },
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    await user.update({ password: await hashPassword(password), resetToken: null, resetTokenExpire: null });
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

// Called from the invitation email link — validates token, sets password, activates account
exports.setPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      where: { invitationToken: token },
      include: [{ model: Role, as: 'role', include: [{ model: Permission, as: 'permissions' }] }],
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invitation link' });
    }

    await user.update({
      password: await hashPassword(password),
      status: 'active',
      invitationToken: null,
    });

    // Auto-login after setting password
    const authToken = generateToken(user.id);
    res.json({
      success: true,
      token: authToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name,
        permissions: (user.role?.permissions || []).map((p) => p.name),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, as: 'role', include: [{ model: Permission, as: 'permissions' }] }],
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        permissions: (user.role?.permissions || []).map((p) => p.name),
      },
    });
  } catch (error) {
    next(error);
  }
};
