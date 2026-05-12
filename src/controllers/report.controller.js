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

exports.getStockOutReport = async (req, res, next) => {
  try {
    const transactions = await Transaction.findAll({
      where: { type: 'STOCK_OUT' },
      include: [
        { 
          model: Product, 
          as: 'product',
          include: [{ model: Category, as: 'category' }]
        },
        { model: User, as: 'user', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const data = transactions.map(t => ({
      id: t.id,
      date: t.createdAt,
      personName: t.user?.name || '—',
      productName: t.product?.name || '—',
      code: t.product?.code || '—',
      category: t.product?.category?.name || '—',
      quantity: t.quantity,
      balance: t.product?.quantity || 0,
      unitPrice: t.product?.sellingPrice || 0,
      totalCategory: (parseFloat(t.product?.sellingPrice || 0) * t.quantity).toFixed(2),
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getStatsData = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate && endDate && startDate !== 'undefined' && endDate !== 'undefined') {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const transactions = await Transaction.findAll({
      where,
      include: [{ model: Product, as: 'product' }],
      order: [['createdAt', 'ASC']]
    });

    // Group by month
    const statsMap = {};
    transactions.forEach(t => {
      const date = new Date(t.createdAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!statsMap[monthYear]) {
        statsMap[monthYear] = { month: monthYear, cost: 0, profit: 0, sales: 0 };
      }

      const cost = parseFloat(t.product?.costPrice || 0) * t.quantity;
      const selling = parseFloat(t.product?.sellingPrice || 0) * t.quantity;

      if (t.type === 'STOCK_OUT') {
        statsMap[monthYear].sales += selling;
        statsMap[monthYear].cost += cost;
        statsMap[monthYear].profit += (selling - cost);
      }
    });

    const chartData = Object.values(statsMap);
    
    // Also return items list for the range
    const itemsList = transactions.filter(t => t.type === 'STOCK_OUT').map(t => ({
      name: t.product?.name,
      code: t.product?.code,
      quantity: t.quantity,
      cost: (parseFloat(t.product?.costPrice || 0) * t.quantity).toFixed(2),
      profit: ((parseFloat(t.product?.sellingPrice || 0) - parseFloat(t.product?.costPrice || 0)) * t.quantity).toFixed(2),
      date: t.createdAt
    }));

    res.json({ success: true, data: { chartData, itemsList } });
  } catch (error) {
    next(error);
  }
};
