const { Category, Product } = require('../models');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Product, attributes: ['id'] }],
      order: [['name', 'ASC']],
    });

    const data = categories.map(c => ({
      ...c.toJSON(),
      _count: { products: c.Products?.length || 0 }
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    await category.update(req.body);
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    await category.destroy();
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};
