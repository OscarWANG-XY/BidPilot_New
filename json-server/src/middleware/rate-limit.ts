import rateLimit from 'express-rate-limit';
import { Config } from '../config';

export const smsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: Config.MAX_SMS_PER_MINUTE,
  message: { message: '请求过于频繁，请稍后再试' },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: Config.MAX_LOGIN_ATTEMPTS,
  message: { message: '登录尝试次数过多，请稍后再试' },
});