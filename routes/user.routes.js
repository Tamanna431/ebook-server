const express = require('express');
const router = express.Router();
const { getTopWriters } = require('../controllers/user.controller');

// Public routes
router.get('/top-writers', getTopWriters);

module.exports = router;