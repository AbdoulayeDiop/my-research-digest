const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const adminOrBackendCheck = require('../middleware/adminMiddleware');

// Create a new newsletter
router.post('/', newsletterController.createNewsletter);

// Get count of all newsletters (admin only)
router.get('/count', adminOrBackendCheck, newsletterController.countNewsletters);

// Get all newsletters (authenticated user)
router.get('/', newsletterController.getAuthenticatedUserNewsletters);

// Get all newsletters (admin only)
router.get('/all', adminOrBackendCheck, newsletterController.getAllNewsletters);



// Get a single newsletter by ID
router.get('/:id', newsletterController.getNewsletterById);

// Update a newsletter
router.put('/:id', newsletterController.updateNewsletter);

// Delete a newsletter
router.delete('/:id', newsletterController.deleteNewsletter);

module.exports = router;