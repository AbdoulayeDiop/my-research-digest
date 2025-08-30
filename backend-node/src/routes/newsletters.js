const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { isAdmin, isOwnerOfNewsletterOrAdmin } = require('../middleware/adminMiddleware');

// Create a new newsletter
router.post('/', newsletterController.createNewsletter);

// Get count of all newsletters (admin only)
router.get('/count', isAdmin, newsletterController.countNewsletters);

// Get all newsletters (admin only)
router.get('/', isAdmin, newsletterController.getAllNewsletters);

// Get all newsletters for a user
router.post('/user', newsletterController.getNewslettersByUser);

// Get a single newsletter by ID (owner or admin only)
router.get('/:id', isOwnerOfNewsletterOrAdmin, newsletterController.getNewsletterById);

// Update a newsletter (owner or admin only)
router.put('/:id', isOwnerOfNewsletterOrAdmin, newsletterController.updateNewsletter);

// Delete a newsletter (owner or admin only)
router.delete('/:id', isOwnerOfNewsletterOrAdmin, newsletterController.deleteNewsletter);

module.exports = router;