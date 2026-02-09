const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const adminOrBackendCheck = require('../middleware/adminMiddleware');

// Get all issues for the authenticated user
router.get('/', issueController.getIssuesForAuthenticatedUser);

// Get count of all issues
router.get('/count', adminOrBackendCheck, issueController.countIssues);

// Get all issues for a specific newsletter
router.get('/byNewsletterId/:newsletterId', issueController.getIssuesForNewsletter);

// Create a new issue
router.post('/', issueController.createIssue);

// Get a single issue by ID
router.get('/:id', issueController.getIssueById);

// Update an issue
router.put('/:id', issueController.updateIssue);

// Delete an issue
router.delete('/:id', issueController.deleteIssue);

// Toggle read status of an issue
router.put('/:id/read', issueController.toggleReadStatus);

// Get paper count for a specific issue
router.get('/:id/paperCount', issueController.getIssuePaperCount);

// Get read status for a specific issue for the authenticated user
router.get('/:id/readStatus', issueController.getIssueReadStatus);

module.exports = router;
