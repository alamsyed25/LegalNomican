const express = require('express');
const router = express.Router();
const { submitDemoForm } = require('../controllers/demoController');
const { validateDemoSubmission } = require('../utils/validators');

// Demo form submission route
router.post('/submit-form', validateDemoSubmission, submitDemoForm);

module.exports = router;
