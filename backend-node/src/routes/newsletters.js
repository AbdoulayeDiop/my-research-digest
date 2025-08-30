const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { isAdmin, isOwnerOfNewsletterOrAdmin, isOwnerOrAdmin } = require('../middleware/adminMiddleware');

// Create a new newsletter
router.post('/', newsletterController.createNewsletter);

// Get count of all newsletters (admin only)
router.get('/count', newsletterController.countNewsletters);

// Get all newsletters (admin only)
router.get('/', newsletterController.getAllNewsletters);

// Get all newsletters for a user
router.post('/user', newsletterController.getNewslettersByUser);

// Get a single newsletter by ID
router.get('/:id', newsletterController.getNewsletterById);

// Update a newsletter
router.put('/:id', newsletterController.updateNewsletter);

// Delete a newsletter
router.delete('/:id', newsletterController.deleteNewsletter);

module.exports = router;