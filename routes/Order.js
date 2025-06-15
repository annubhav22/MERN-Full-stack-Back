const express = require('express');
const router = express.Router();
const {
  getOrders,
  createOrder,
  fetchAllOrders,
  fetchOrderById,
  updateOrder
} = require('../controller/Order');

// Routes
router.get('/orders', getOrders);
router.post('/', createOrder);
router.get('/', fetchAllOrders);
router.get('/:id', fetchOrderById);
router.patch('/:id', updateOrder);

module.exports = router;
