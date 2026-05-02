const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Route to handle marking an issue as read from an email
// GET /:issueId/mark-as-read
router.get('/issues/:issueId/mark-as-read', publicController.markAsReadFromEmail);
router.get('/issues/:issueId/feedback', publicController.submitFeedbackFromEmail);
router.get('/newsletters/:newsletterId/reactivate', publicController.reactivateNewsletterFromEmail);

module.exports = router;
