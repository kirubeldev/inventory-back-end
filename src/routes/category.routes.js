const express = require('express');
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/category.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', authorize('view_products'), getCategories);
router.post('/', authorize('manage_categories'), createCategory);
router.put('/:id', authorize('manage_categories'), updateCategory);
router.delete('/:id', authorize('manage_categories'), deleteCategory);

module.exports = router;
