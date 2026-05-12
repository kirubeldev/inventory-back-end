const express = require('express');
const { getDashboardStats, getInventoryReport, getStockOutReport, getStatsData } = require('../controllers/report.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/dashboard', authorize('view_dashboard'), getDashboardStats);
router.get('/inventory', authorize('view_reports'), getInventoryReport);
router.get('/stockout', authorize('view_stockout_report'), getStockOutReport);
router.get('/stats', authorize('view_business_stats'), getStatsData);

module.exports = router;
