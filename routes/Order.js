const express = require('express');
const router = express.Router();
const {
  getOrders,
  createOrder,
  fetchAllOrders,
  fetchOrderById,
  updateOrder,
} = require('../controller/Order');

// Routes
router.post("/", createOrder);             // Create a new order
router.get("/", fetchAllOrders);           // Get all orders
router.get("/orders", getOrders);          // Custom or filtered orders
router.get("/:id", fetchOrderById);        // Get order by ID
router.patch("/:id", updateOrder);         // Update order by ID

module.exports = router;
