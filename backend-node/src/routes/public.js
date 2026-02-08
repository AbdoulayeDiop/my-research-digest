const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Route to handle marking an issue as read from an email
// GET /:issueId/mark-as-read
router.get('/:issueId/mark-as-read', publicController.markAsReadFromEmail);

module.exports = router;
