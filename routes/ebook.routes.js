const express = require('express');
const router = express.Router();
const { getAllEbooks, getEbookById } = require('../controllers/ebook.controller');

// Public routes
router.get('/', getAllEbooks);
router.get('/:id', getEbookById);

module.exports = router;
