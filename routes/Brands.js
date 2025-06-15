const express = require('express');
const router = express.Router();

const { fetchBrands, createBrand } = require('../controller/Brand');

router.get("/", fetchBrands);
router.post("/", createBrand);

module.exports = router;
