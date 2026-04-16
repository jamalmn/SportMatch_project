'use strict';

const { Router } = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  getNotifications,
  markAllRead,
  markOneRead,
  deleteNotification,
} = require('../controllers/notificationController');

const router = Router();

// IMPORTANTE: /read-all debe ir antes de /:notificationId/read
router.get('/',                        verifyToken, getNotifications);
router.patch('/read-all',              verifyToken, markAllRead);
router.patch('/:notificationId/read',  verifyToken, markOneRead);
router.delete('/:notificationId',      verifyToken, deleteNotification);

module.exports = router;
