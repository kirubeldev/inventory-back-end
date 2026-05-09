const { Transaction, Product, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

exports.getTransactions = async (req, res, next) => {
  try {
    const { productId, type, startDate, endDate } = req.query;

    const where = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const transactions = await Transaction.findAll({
      where,
      include: [
        { model: Product, as: 'product' },
        { model: User, as: 'user', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};

exports.createTransaction = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { productId, quantity, type, notes } = req.body;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let newQuantity = product.quantity;
    const qty = parseInt(quantity);
    if (type === 'STOCK_IN') newQuantity += qty;
    else if (type === 'STOCK_OUT' || type === 'TRANSFER') newQuantity -= qty;
    else if (type === 'ADJUSTMENT') newQuantity = qty;

    if (newQuantity < 0) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    const stockStatus = newQuantity === 0 ? 'out_of_stock' : newQuantity < product.lowStockThreshold ? 'low_stock' : 'in_stock';

    const transaction = await Transaction.create({
      productId,
      quantity: qty,
      type,
      userId: req.user.id,
      notes,
    }, { transaction: t });

    await product.update({ quantity: newQuantity, stockStatus }, { transaction: t });

    await t.commit();
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};
