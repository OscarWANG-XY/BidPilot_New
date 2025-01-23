import Redis from 'ioredis';
import { Config } from '../config';
import crypto from 'crypto';

export class VerificationService {
  private static redis: Redis = new Redis(Config.REDIS_URL);

  static generateCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  static async saveCode(phone: string, code: string): Promise<void> {
    await this.redis.set(`sms:${phone}`, code, 'EX', 300); // 5分钟过期
  }

  static async verifyCode(phone: string, code: string): Promise<boolean> {
    const savedCode = await this.redis.get(`sms:${phone}`);
    return savedCode === code;
  }

  static async checkSmsFrequency(phone: string): Promise<boolean> {
    const key = `sms:count:${phone}`;
    const count = await this.redis.incr(key);
    
    if (count === 1) {
      await this.redis.expire(key, 86400); // 24小时后重置
    }
    
    return count <= Config.MAX_SMS_PER_DAY;
  }
}