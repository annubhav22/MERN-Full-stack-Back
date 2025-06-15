const express = require('express');
const router = express.Router();

const ProductController = require('../controller/Product'); // <- this is an object with methods

// Define your routes here
router.post("/", ProductController.createProduct);
router.get("/", ProductController.fetchAllProducts);
router.get("/:id", ProductController.fetchProductById);
router.patch("/:id", ProductController.updateProduct);

module.exports = router;
