const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/sync', userController.syncUser);
router.get('/:id', userController.getUserById);
router.get('/count', userController.countUsers);
router.delete('/:id', userController.deleteUser);

module.exports = router;