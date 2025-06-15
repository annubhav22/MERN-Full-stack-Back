const express = require('express');
const router = express.Router();

const { createOrder, fetchAllOrders, fetchOrderById, updateOrder } = require('../controller/Order');

router.post("/", createOrder);
router.get("/", fetchAllOrders);
router.get("/:id", fetchOrderById);
router.patch("/:id", updateOrder);

module.exports = router;
