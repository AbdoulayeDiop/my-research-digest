const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAdmin, isOwnerOrAdmin } = require('../middleware/adminMiddleware');

// Get all users (admin only)
router.get('/', isAdmin, userController.getAllUsers);

// Get user by ID (admin or owner only)
router.get('/:userId', isOwnerOrAdmin, userController.getUserById);

// Sync user
router.post('/sync', userController.syncUser);

// Delete user (admin or owner only)
router.delete('/:userId', isOwnerOrAdmin, userController.deleteUser);

// Get user count (admin only)
router.get('/count', isAdmin, userController.getUserCount);

module.exports = router;