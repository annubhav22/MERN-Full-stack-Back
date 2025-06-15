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

const createOrder = async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
