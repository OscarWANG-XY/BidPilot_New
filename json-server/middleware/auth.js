const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      phone: user.phone,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  // 不需要验证的路由
  const publicPaths = [
    '/auth/login/captcha',
    '/auth/login/password',
    '/auth/login/wechat',
    '/auth/register',
    '/auth/captcha',
    '/auth/forgot-password',
  ];
  if (publicPaths.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Invalid token' });
  }

  req.user = decoded;
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
};