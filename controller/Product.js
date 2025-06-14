const { Product } = require('../model/Product');

// ✅ CREATE PRODUCT
exports.createProduct = async (req, res) => {
  const product = new Product(req.body);
  product.discountPrice = Math.round(product.price * (1 - product.discountPercentage / 100));
  try {
    const doc = await product.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json(err);
  }
};

// ✅ FETCH ALL PRODUCTS
exports.fetchAllProducts = async (req, res) => {
  const condition = {};

  if (!req.query.admin) {
    condition.$or = [
      { deleted: { $exists: false } },
      { deleted: false }
    ];
  }

  let query = Product.find(condition);
  let totalProductsQuery = Product.find(condition);

  if (req.query.category) {
    query = query.find({ category: { $in: req.query.category.split(',') } });
    totalProductsQuery = totalProductsQuery.find({ category: { $in: req.query.category.split(',') } });
  }
  if (req.query.brand) {
    query = query.find({ brand: { $in: req.query.brand.split(',') } });
    totalProductsQuery = totalProductsQuery.find({ brand: { $in: req.query.brand.split(',') } });
  }
  if (req.query._sort && req.query._order) {
    query = query.sort({ [req.query._sort]: req.query._order });
  }

  const totalDocs = await totalProductsQuery.count().exec();

  if (req.query._page && req.query._limit) {
    const pageSize = req.query._limit;
    const page = req.query._page;
    query = query.skip(pageSize * (page - 1)).limit(pageSize);
  }

  try {
    const docs = await query.exec();
    res.set('X-Total-Count', totalDocs);
    res.status(200).json(docs);
  } catch (err) {
    res.status(400).json(err);
  }
};

// ✅ FETCH SINGLE PRODUCT BY ID
exports.fetchProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.status(200).json(product);
  } catch (err) {
    res.status(404).json({ error: 'Product not found' });
  }
};

// ✅ UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    updated.discountPrice = Math.round(updated.price * (1 - updated.discountPercentage / 100));
    const saved = await updated.save();
    res.status(200).json(saved);
  } catch (err) {
    res.status(400).json(err);
  }
};
