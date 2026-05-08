const { Order, OrderItem, Product, Transaction, User } = require('../models');
const { sequelize } = require('../config/database');

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: User, as: 'user', attributes: ['name'] },
        { 
          model: OrderItem, 
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

exports.createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { items } = req.body; // Array of { productId, quantity, price }

    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (!product || product.quantity < item.quantity) {
        throw new Error(`Insufficient stock for product: ${product ? product.name : item.productId}`);
      }

      totalAmount += parseFloat(item.price) * parseInt(item.quantity);
      
      const newQuantity = product.quantity - parseInt(item.quantity);
      const stockStatus = newQuantity === 0 ? 'out_of_stock' : newQuantity <= product.lowStockThreshold ? 'low_stock' : 'in_stock';

      // Update product quantity
      await product.update({ quantity: newQuantity, stockStatus }, { transaction: t });

      // Log transaction
      await Transaction.create({
        productId: item.productId,
        quantity: parseInt(item.quantity),
        type: 'STOCK_OUT',
        userId: req.user.id,
        notes: 'Order sale',
      }, { transaction: t });

      orderItemsData.push({
        productId: item.productId,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
      });
    }

    const order = await Order.create({
      userId: req.user.id,
      totalAmount,
      status: 'completed',
    }, { transaction: t });

    // Create order items
    await OrderItem.bulkCreate(
      orderItemsData.map(item => ({ ...item, orderId: order.id })),
      { transaction: t }
    );

    const fullOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t
    });

    await t.commit();
    res.status(201).json({ success: true, data: fullOrder });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['name'] },
        { 
          model: OrderItem, 
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ],
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
