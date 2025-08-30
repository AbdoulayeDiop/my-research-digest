const express = require('express');
const router = express.Router();
const paperController = require('../controllers/paperController');
const { isAdmin, isOwnerOfPaperOrAdmin, isOwnerOfIssueOrAdmin } = require('../middleware/adminMiddleware');

// POST /api/papers (Create multiple papers)
router.post('/', paperController.createPapers);

// GET /api/papers/count (Count all papers) - Admin only
router.get('/count', paperController.countPapers);

// GET /api/papers/byIssue/:issueId (Get papers by issue ID)
router.get('/byIssue/:issueId', paperController.getPapersByIssueId);

// POST /api/papers/batch (Fetch multiple papers by their IDs)
router.post('/batch', paperController.getPapersByIds);

// GET /api/papers?issueId=... (Get all papers for a specific issue - generic, should be last)
router.get('/', paperController.getPapersByIssue);

module.exports = router;