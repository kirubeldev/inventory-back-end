const { Product, Category, Supplier, Transaction } = require('../models');
const { Op } = require('sequelize');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [totalProducts, lowStock, outOfStock, recentTransactions, categoryStats] = await Promise.all([
      Product.count(),
      Product.count({ where: { stockStatus: 'low_stock' } }),
      Product.count({ where: { stockStatus: 'out_of_stock' } }),
      Transaction.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [
          { model: Product, as: 'product', attributes: ['name'] },
          { model: require('../models').User, as: 'user', attributes: ['name'] }
        ]
      }),
      Category.findAll({
        include: [{ 
          model: Product, 
          attributes: ['id'] 
        }],
      })
    ]);

    // Format category stats to match expected frontend structure
    const formattedCategoryStats = categoryStats.map(c => ({
      name: c.name,
      _count: { products: c.Products?.length || 0 }
    }));

    res.json({
      success: true,
      data: {
        totalProducts,
        lowStock,
        outOfStock,
        recentTransactions,
        categoryStats: formattedCategoryStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getInventoryReport = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' }
      ]
    });

    const data = products.map(p => ({
      ...p.toJSON(),
      totalRetailValue: (parseFloat(p.sellingPrice) * p.quantity).toFixed(2),
      status: p.stockStatus,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
