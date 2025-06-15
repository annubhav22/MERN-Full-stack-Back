const express = require('express');
const router = express.Router();

const { fetchCategories, createCategory } = require('../controller/Category');

router.get("/", fetchCategories);
router.post("/", createCategory);

module.exports = router;
