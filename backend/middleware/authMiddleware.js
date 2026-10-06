const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../utils/generateToken');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          status: 'fail',
          message: 'Not authorized, token missing',
        });
      }

      const decoded = jwt.verify(token, getJwtSecret());

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          status: 'fail',
          message: 'Not authorized, user no longer exists',
        });
      }

      if (user.status !== 'ACTIVE') {
        return res.status(401).json({
          status: 'fail',
          message: 'Not authorized, user account is inactive or suspended',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'fail',
          message: 'Not authorized, token has expired',
        });
      }
      return res.status(401).json({
        status: 'fail',
        message: 'Not authorized, invalid token',
      });
    }
  } else {
    return res.status(401).json({
      status: 'fail',
      message: 'Not authorized, no bearer token provided',
    });
  }
};

module.exports = { protect };
