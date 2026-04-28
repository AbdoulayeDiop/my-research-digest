const express = require('express');
const router = express.Router();
const adminOrBackendCheck = require('../middleware/adminMiddleware');
const announcementController = require('../controllers/announcementController');

router.post('/send', adminOrBackendCheck, announcementController.sendAnnouncement);

module.exports = router;
