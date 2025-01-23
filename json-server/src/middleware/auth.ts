import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-secret-key';

// 定义接口，与原始 JS 版本保持一致
interface User {
  id: number;
  phone: string;
  email?: string;
  password?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// JWT payload 只包含必要的用户信息，不包含敏感信息
interface JwtPayload {
  id: number;
  phone: string;
  email?: string;
  role: string;
  code?: string;  // 为微信登录临时 token 准备
}

// 扩展 Express 的 Request 接口
declare module 'express' {
  interface Request {
    user?: User;
  }
}

function generateToken(user: Partial<User> & { code?: string }): string {
  const payload: JwtPayload = {
    id: user.id!,
    phone: user.phone!,
    email: user.email,
    role: user.role || 'temporary',
    code: (user as any).code
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

function authMiddleware(req: Request, res: Response, next: NextFunction): void {
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
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(403).json({ message: 'Invalid token' });
    return;
  }

  // 将解码后的用户信息添加到请求对象中
  req.user = decoded as User;
  next();
}

export {
  generateToken,
  verifyToken,
  authMiddleware,
  User,
  JwtPayload
};
