const { User, Role, Permission } = require('../models');
const { hashPassword } = require('../utils/auth');
const crypto = require('crypto');
const { sendEmail } = require('../services/email.service');

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      include: [{ model: Role, as: 'role' }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, roleId } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const invitationToken = crypto.randomBytes(20).toString('hex');
    const tempPassword = await hashPassword(crypto.randomBytes(10).toString('hex'));

    const user = await User.create({
      name,
      email,
      password: tempPassword,
      roleId,
      status: 'pending',
      invitationToken,
    });

    const invitationUrl = `${process.env.FRONTEND_URL}/set-password/${invitationToken}`;
    const message = `Hello ${name},\n\nYou have been invited to the Inventory Management System. Please set your password using the link below:\n\n${invitationUrl}`;

    try {
      await sendEmail({
        email,
        subject: 'Invitation to Inventory System',
        message,
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError.message);
      // We still want to return success since the user was created.
    }

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, roleId, status } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await user.update({ name, email, roleId, status });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.getRoles = async (req, res, next) => {
  try {
    const roles = await Role.findAll({
      include: [{ model: Permission, as: 'permissions' }],
    });
    res.json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

exports.createRole = async (req, res, next) => {
  try {
    const { name, permissionIds } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Role name is required' });

    const role = await Role.create({ name });

    if (permissionIds && permissionIds.length > 0) {
      const permissions = await Permission.findAll({ where: { id: permissionIds } });
      await role.setPermissions(permissions);
    }

    const full = await Role.findByPk(role.id, { include: [{ model: Permission, as: 'permissions' }] });
    res.status(201).json({ success: true, data: full });
  } catch (error) {
    next(error);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const { name, permissionIds } = req.body;
    const role = await Role.findByPk(req.params.id, { include: [{ model: Permission, as: 'permissions' }] });
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

    if (name) await role.update({ name });

    if (permissionIds !== undefined) {
      const permissions = await Permission.findAll({ where: { id: permissionIds } });
      await role.setPermissions(permissions);
    }

    const full = await Role.findByPk(role.id, { include: [{ model: Permission, as: 'permissions' }] });
    res.json({ success: true, data: full });
  } catch (error) {
    next(error);
  }
};

exports.getPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, data: permissions });
  } catch (error) {
    next(error);
  }
};
