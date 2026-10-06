const express = require('express');
const router = express.Router();
const { register, login, getMe, googleAuth } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);

// Protected route
router.get('/me', protect, getMe);

// RBAC helpers — never exposed in production
if (process.env.NODE_ENV !== 'production') {
  router.get('/admin-only', protect, authorize('FPO_ADMIN'), (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Access granted to FPO Admin protected route',
      user: req.user,
    });
  });

  router.get('/farmer-only', protect, authorize('FARMER'), (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Access granted to Farmer protected route',
      user: req.user,
    });
  });
}

module.exports = router;
