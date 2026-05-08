const express = require('express');
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplier.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', authorize('manage_suppliers'), getSuppliers);
router.post('/', authorize('manage_suppliers'), createSupplier);
router.put('/:id', authorize('manage_suppliers'), updateSupplier);
router.delete('/:id', authorize('manage_suppliers'), deleteSupplier);

module.exports = router;
