const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../models');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = await User.findByPk(decoded.id, {
      include: [{
        model: Role,
        as: 'role',
        include: [{
          model: Permission,
          as: 'permissions'
        }]
      }]
    });

    if (!req.user) {
      console.warn('Auth Middleware: User not found for ID:', decoded.id);
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const userPermissions = (req.user.role?.permissions || []).map((p) => p.name);
    req.user.permissionsList = userPermissions; // Store for authorize middleware

    console.log('Auth Middleware: User authorized:', req.user.email);
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

exports.authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    
    const userPermissions = req.user.permissionsList || [];
    const hasPermission = permissions.every((p) => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
    }

    next();
  };
};
