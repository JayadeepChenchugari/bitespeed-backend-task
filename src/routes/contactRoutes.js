const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

router.get('/', contactController.healthCheck);
router.post('/create-contact', contactController.createContact);
router.post('/identify', contactController.identifyContact);

module.exports = router;
