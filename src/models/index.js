const User = require('./user.model');
const Role = require('./role.model');
const Permission = require('./permission.model');
const Category = require('./category.model');
const Supplier = require('./supplier.model');
const Product = require('./product.model');
const Transaction = require('./transaction.model');
const Order = require('./order.model');
const OrderItem = require('./order-item.model');
const AuditLog = require('./audit-log.model');

// Role - Permission (Many-to-Many)
Role.belongsToMany(Permission, { 
  through: '_PermissionToRole',
  foreignKey: 'B',
  otherKey: 'A',
  as: 'permissions',
  timestamps: false 
});
Permission.belongsToMany(Role, { 
  through: '_PermissionToRole',
  foreignKey: 'A',
  otherKey: 'B',
  as: 'roles',
  timestamps: false
});

// User - Role (Many-to-One)
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
Role.hasMany(User, { foreignKey: 'roleId' });

// Product - Category (Many-to-One)
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product, { foreignKey: 'categoryId' });

// Product - Supplier (Many-to-One)
Product.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
Supplier.hasMany(Product, { foreignKey: 'supplierId' });

// Transaction - Product & User (Many-to-One)
Transaction.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(Transaction, { foreignKey: 'productId' });

Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Transaction, { foreignKey: 'userId' });

// Order - User (Many-to-One)
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Order, { foreignKey: 'userId' });

// Order - OrderItem (One-to-Many)
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// OrderItem - Product (Many-to-One)
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(OrderItem, { foreignKey: 'productId' });

// AuditLog - User (Many-to-One)
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(AuditLog, { foreignKey: 'userId' });

module.exports = {
  User,
  Role,
  Permission,
  Category,
  Supplier,
  Product,
  Transaction,
  Order,
  OrderItem,
  AuditLog,
};
