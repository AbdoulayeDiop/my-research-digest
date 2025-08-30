const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access newsletterId from parent route
const issueController = require('../controllers/issueController');
const { isOwnerOfIssueOrAdmin, isAdmin, isOwnerOfNewsletterOrAdmin } = require('../middleware/adminMiddleware');

// Create a new issue for a newsletter (owner of newsletter or admin only)
router.post('/', issueController.createIssue);

// Get count of all issues (admin only)
router.get('/count', isAdmin, issueController.countIssues);

// Get all issues for a specific newsletter
router.get('/', issueController.getIssuesByNewsletter);

// Get a single issue by ID (owner of issue or admin only)
router.get('/:id', isOwnerOfIssueOrAdmin, issueController.getIssueById);

// Update an issue (owner of issue or admin only)
router.put('/:id', isOwnerOfIssueOrAdmin, issueController.updateIssue);

// Delete an issue (owner of issue or admin only)
router.delete('/:id', isOwnerOfIssueOrAdmin, issueController.deleteIssue);

module.exports = router;