const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access newsletterId from parent route
const issueController = require('../controllers/issueController');

// Create a new issue for a newsletter
router.post('/', issueController.createIssue);

// Get count of all issues (admin only)
router.get('/count', issueController.countIssues);

// Get all issues for a specific newsletter
router.get('/', issueController.getIssuesByNewsletter);

// Get a single issue by ID
router.get('/:id', issueController.getIssueById);

// Update an issue
router.put('/:id', issueController.updateIssue);

// Delete an issue
router.delete('/:id', issueController.deleteIssue);

// Toggle read status of an issue
router.put('/:id/read', issueController.toggleReadStatus);

module.exports = router;