const express = require('express');
const router = express.Router();

const {
  createProduct,
  fetchAllProducts,
  fetchProductById,
  updateProduct
} = require('../controller/Product'); // ✅ exact path

router.post('/', createProduct);      // <-- this is where the crash happens if createProduct is undefined
router.get('/', fetchAllProducts);
router.get('/:id', fetchProductById);
router.patch('/:id', updateProduct);

module.exports = { router };

