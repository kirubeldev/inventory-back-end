const { Product, Category, Supplier, Transaction, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, supplier, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (category) where.categoryId = category;
    if (supplier) where.supplierId = supplier;
    if (status) where.stockStatus = status;

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' }
      ],
      order: [['updatedAt', 'DESC']],
    });

    res.json({
      success: true,
      data: products,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' },
        { 
          model: Transaction, 
          as: 'Transactions',
          limit: 5, 
          order: [['createdAt', 'DESC']] 
        }
      ],
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  console.log('Create Product Request Body:', req.body);
  console.log('User from request:', req.user?.id);
  
  const t = await sequelize.transaction();

  try {
    const {
      name,
      sku,
      categoryId,
      supplierId,
      quantity,
      costPrice,
      sellingPrice,
      description,
      imageUrl,
      lowStockThreshold,
    } = req.body;

    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const qty = parseInt(quantity) || 0;
    const threshold = parseInt(lowStockThreshold) || 10;
    const stockStatus = qty === 0 ? 'out_of_stock' : qty <= threshold ? 'low_stock' : 'in_stock';

    const product = await Product.create({
      name,
      sku,
      categoryId,
      supplierId: supplierId || null,
      quantity: qty,
      costPrice: parseFloat(costPrice),
      sellingPrice: parseFloat(sellingPrice),
      description,
      imageUrl,
      lowStockThreshold: threshold,
      stockStatus,
    }, { transaction: t });

    // Log transaction
    await Transaction.create({
      productId: product.id,
      quantity: qty,
      type: 'STOCK_IN',
      userId: req.user.id,
      notes: 'Initial stock',
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      categoryId,
      supplierId,
      quantity,
      costPrice,
      sellingPrice,
      description,
      imageUrl,
      lowStockThreshold,
    } = req.body;

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const newQuantity = quantity !== undefined ? parseInt(quantity) : product.quantity;
    const threshold = lowStockThreshold !== undefined ? parseInt(lowStockThreshold) : product.lowStockThreshold;
    const stockStatus = newQuantity === 0 ? 'out_of_stock' : newQuantity <= threshold ? 'low_stock' : 'in_stock';

    await product.update({
      name,
      sku,
      categoryId,
      supplierId: supplierId || null,
      quantity: newQuantity,
      costPrice: costPrice !== undefined ? parseFloat(costPrice) : product.costPrice,
      sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : product.sellingPrice,
      description,
      imageUrl,
      lowStockThreshold: threshold,
      stockStatus,
    });

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await product.destroy();
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};
