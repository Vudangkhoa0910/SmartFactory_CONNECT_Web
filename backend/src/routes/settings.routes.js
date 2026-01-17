const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { 
  getAutoAssignSetting, 
  updateAutoAssignSetting 
} = require('../controllers/settings.controller');

// Get auto-assign setting
router.get('/auto-assign', authenticate, getAutoAssignSetting);

// Update auto-assign setting (Admin only in production)
router.patch('/auto-assign', authenticate, updateAutoAssignSetting);

module.exports = router;
