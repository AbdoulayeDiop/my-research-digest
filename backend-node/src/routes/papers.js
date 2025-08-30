const express = require('express');
const router = express.Router();
const paperController = require('../controllers/paperController');
const { isAdmin, isOwnerOfPaperOrAdmin, isOwnerOfIssueOrAdmin } = require('../middleware/adminMiddleware');

// POST /api/papers (Create multiple papers) - Admin or owner of the issue only
router.post('/', isOwnerOfIssueOrAdmin, paperController.createPapers);

// GET /api/papers/count (Count all papers) - Admin only
router.get('/count', isAdmin, paperController.countPapers);

// GET /api/papers/byIssue/:issueId (Get papers by issue ID) - Owner of the issue or admin only
router.get('/byIssue/:issueId', isOwnerOfIssueOrAdmin, paperController.getPapersByIssueId);

// POST /api/papers/batch (Fetch multiple papers by their IDs) - Owner of the paper or admin only
router.post('/batch', isOwnerOfPaperOrAdmin, paperController.getPapersByIds);

// GET /api/papers?issueId=... (Get all papers for a specific issue - generic, should be last) - Owner of the issue or admin only
router.get('/', isOwnerOfIssueOrAdmin, paperController.getPapersByIssue);

module.exports = router;