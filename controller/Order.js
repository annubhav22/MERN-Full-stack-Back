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

const fetchAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// FETCH a single order by ID
const fetchOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE order
const updateOrder = async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedOrder);
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
