const express = require('express');
const { getOrders, createOrder, getOrder } = require('../controllers/order.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', authorize('manage_orders'), getOrders);
router.post('/', authorize('manage_orders'), createOrder);
router.get('/:id', authorize('manage_orders'), getOrder);

module.exports = router;
