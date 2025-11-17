const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Get all users (admin only)
router.get('/', userController.getAllUsers);

// Get all users with newsletter count (admin only)
router.get('/with-newsletter-count', userController.getUsersWithNewsletterCount);

// Get active users count (admin only)
router.get('/active-count', userController.getActiveUsers);

// Get user count (admin only)
router.get('/count', userController.countUsers);

// Sync user
router.post('/sync', userController.syncUser);

// Get user by ID
router.get('/:userId', userController.getUserById);

// Delete user
router.delete('/:userId', userController.deleteUser);

module.exports = router;