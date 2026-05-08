const express = require('express');
const { getDashboardStats, getInventoryReport } = require('../controllers/report.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/dashboard', authorize('view_dashboard'), getDashboardStats);
router.get('/inventory', authorize('view_reports'), getInventoryReport);

module.exports = router;
