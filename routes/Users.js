const express = require('express');
const router = express.Router();

const { fetchAllUsers, fetchUserById, updateUser } = require('../controller/User');

router.get('/', fetchAllUsers);
router.get("/:id", fetchUserById);
router.patch("/:id", updateUser);

module.exports = router;
