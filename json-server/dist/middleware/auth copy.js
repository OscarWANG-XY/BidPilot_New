"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = 'your-secret-key';
function generateToken(user) {
    const payload = {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role || 'temporary',
        code: user.code
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
function authMiddleware(req, res, next) {
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
    req.user = decoded;
    next();
}
