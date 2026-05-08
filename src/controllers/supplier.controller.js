const { Supplier, Product } = require('../models');

exports.getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.findAll({
      include: [{ model: Product, attributes: ['id'] }],
      order: [['name', 'ASC']],
    });

    const data = suppliers.map(s => ({
      ...s.toJSON(),
      _count: { products: s.Products?.length || 0 }
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id, {
      include: [Product],
    });

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

exports.createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    await supplier.update(req.body);
    res.json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    await supplier.destroy();
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (error) {
    next(error);
  }
};
