const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', authorize('view_products'), getProducts);
router.get('/:id', authorize('view_products'), getProduct);
router.post('/', authorize('create_products'), createProduct);
router.put('/:id', authorize('edit_products'), updateProduct);
router.delete('/:id', authorize('delete_products'), deleteProduct);

module.exports = router;
