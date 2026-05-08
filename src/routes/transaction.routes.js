const express = require('express');
const { getTransactions, createTransaction } = require('../controllers/transaction.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', authorize('manage_inventory'), getTransactions);
router.post('/', authorize('manage_inventory'), createTransaction);

module.exports = router;
