const express = require('express');
const router = express.Router();

const { addToCart, fetchCart, updateCart, deleteFromCart } = require('../controller/Cart');
const authenticate = require('../middleware/auth');  

// All routes require authentication first
router.post("/", authenticate, addToCart);
router.get("/", authenticate, fetchCart);
router.patch("/:id", authenticate, updateCart);
router.delete("/:id", authenticate, deleteFromCart);

module.exports = router;
