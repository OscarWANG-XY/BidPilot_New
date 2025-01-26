"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../config");
const crypto_1 = __importDefault(require("crypto"));
class VerificationService {
    static generateCode() {
        return crypto_1.default.randomInt(100000, 999999).toString();
    }
    static async saveCode(phone, code) {
        await this.redis.set(`sms:${phone}`, code, 'EX', 300); // 5分钟过期
    }
    static async verifyCode(phone, code) {
        const savedCode = await this.redis.get(`sms:${phone}`);
        return savedCode === code;
    }
    static async checkSmsFrequency(phone) {
        const key = `sms:count:${phone}`;
        const count = await this.redis.incr(key);
        if (count === 1) {
            await this.redis.expire(key, 86400); // 24小时后重置
        }
        return count <= config_1.Config.MAX_SMS_PER_DAY;
    }
}
exports.VerificationService = VerificationService;
VerificationService.redis = new ioredis_1.default(config_1.Config.REDIS_URL);
