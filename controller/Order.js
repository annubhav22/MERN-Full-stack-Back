const { Order } = require('../model/Order');
const express = require('express');
const { getAllOrders } = require('../controller/Order');


const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({});
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { id } = req.user;
    const order = await Order.create({ 
      items: req.body.items,
      totalAmount: req.body.totalAmount,
      totalItems: req.body.totalItems,
      user: id,
      paymentMethod: req.body.paymentMethod,
      selectedAddress: req.body.selectedAddress
    });

    res.json(order);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.fetchOrders = async (req, res) => {
  try {
    const { id } = req.user;
    const orders = await Order.find({ user: id }).populate('items.productId');
    res.json(orders);
  } catch (err) {
    res.status(400).json(err);
  }
};
module.exports = {
  getOrders,
  createOrder,
  fetchAllOrders,
  fetchOrderById,
  updateOrder
};
