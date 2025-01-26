"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginLimiter = exports.smsLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("../config");
exports.smsLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1分钟
    max: config_1.Config.MAX_SMS_PER_MINUTE,
    message: { message: '请求过于频繁，请稍后再试' },
});
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: config_1.Config.MAX_LOGIN_ATTEMPTS,
    message: { message: '登录尝试次数过多，请稍后再试' },
});
