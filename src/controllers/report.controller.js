const { Product, Category, Supplier, Transaction, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

exports.getDashboardStats = async (req, res, next) => {
  try {
    // Last 7 days range
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      lowStock,
      outOfStock,
      recentTransactions,
      categoryStats,
      allProducts,
      last30Transactions,
    ] = await Promise.all([
      Product.count(),
      Product.count({ where: { stockStatus: 'low_stock' } }),
      Product.count({ where: { stockStatus: 'out_of_stock' } }),
      Transaction.findAll({
        limit: 20,
        order: [['createdAt', 'DESC']],
        include: [
          { model: Product, as: 'product', attributes: ['name', 'quantity', 'receivedDate'] },
          { model: User, as: 'user', attributes: ['name'] }
        ]
      }),
      Category.findAll({
        include: [{ model: Product, attributes: ['id', 'quantity', 'stockStatus'] }],
      }),
      Product.findAll({
        attributes: ['id', 'name', 'quantity', 'stockStatus', 'sellingPrice', 'costPrice'],
        include: [{ model: Category, as: 'category', attributes: ['name'] }],
        order: [['quantity', 'ASC']],
        limit: 10,
      }),
      Transaction.findAll({
        where: {
          createdAt: { [Op.gte]: sevenDaysAgo }
        },
        order: [['createdAt', 'ASC']],
        include: [
          { model: Product, as: 'product', attributes: ['name', 'quantity'] },
          { model: User, as: 'user', attributes: ['name'] }
        ]
      }),
    ]);

    // Format category stats
    const formattedCategoryStats = categoryStats.map(c => ({
      name: c.name,
      totalProducts: c.Products?.length || 0,
      totalQuantity: c.Products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0,
      inStock: c.Products?.filter(p => p.stockStatus === 'in_stock').length || 0,
      lowStock: c.Products?.filter(p => p.stockStatus === 'low_stock').length || 0,
      outOfStock: c.Products?.filter(p => p.stockStatus === 'out_of_stock').length || 0,
      _count: { products: c.Products?.length || 0 }
    }));

    // Stock status pie data
    const inStockCount = await Product.count({ where: { stockStatus: 'in_stock' } });
    const stockStatusData = [
      { name: 'In Stock', value: inStockCount },
      { name: 'Low Stock', value: lowStock },
      { name: 'Out of Stock', value: outOfStock },
    ];

    // Category quantity pie data (top 6)
    const categoryPieData = formattedCategoryStats
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 6)
      .map(c => ({ name: c.name, value: c.totalQuantity }));

    // Daily stock in/out for last 7 days
    const dailyMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyMap[key] = { date: key, stockIn: 0, stockOut: 0 };
    }
    last30Transactions.forEach((t) => {
      const key = new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyMap[key]) {
        if (t.type === 'STOCK_IN') dailyMap[key].stockIn += t.quantity;
        else if (t.type === 'STOCK_OUT' || t.type === 'TRANSFER') dailyMap[key].stockOut += t.quantity;
      }
    });
    const dailyStockTrend = Object.values(dailyMap);

    // Top 5 products by quantity
    const topProductsByQty = [...allProducts]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map((p) => ({ name: p.name, quantity: p.quantity, category: p.category?.name || '' }));

    // Low stock products (bottom 5)
    const lowStockProducts = allProducts
      .slice(0, 5)
      .map((p) => ({ name: p.name, quantity: p.quantity, category: p.category?.name || '' }));

    // Stock movement table (recent 20 transactions)
    const stockMovementTable = recentTransactions.map((t) => ({
      id: t.id,
      productName: t.product?.name || '—',
      type: t.type,
      quantity: t.quantity,
      byWho: t.user?.name || '—',
      receivedBy: t.receivedBy || '—',
      remainingQty: t.product?.quantity ?? '—',
      receivedDate: t.product?.receivedDate || '—',
      date: t.createdAt,
      notes: t.notes || '',
    }));

    res.json({
      success: true,
      data: {
        totalProducts,
        lowStock,
        outOfStock,
        recentTransactions,
        categoryStats: formattedCategoryStats,
        stockStatusData,
        categoryPieData,
        dailyStockTrend,
        topProductsByQty,
        lowStockProducts,
        stockMovementTable,
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
