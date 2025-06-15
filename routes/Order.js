const express = require('express');
const router = express.Router();
const { getOrders } = require('../controller/Order');
const { createOrder, fetchAllOrders, fetchOrderById, updateOrder } = require('../controller/Order');

router.post("/", createOrder);
router.get("/", fetchAllOrders);

router.get('/orders', getOrders);
router.patch("/:id", updateOrder);

module.exports = router;
