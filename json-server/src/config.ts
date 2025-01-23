interface IConfig {
    ALIYUN_ACCESS_KEY_ID: string;
    ALIYUN_ACCESS_KEY_SECRET: string;
    SMS_SIGN_NAME: string;
    SMS_TEMPLATE_CODE: string;
    REDIS_URL: string;
    MAX_SMS_PER_DAY: number;
    MAX_SMS_PER_MINUTE: number;
    MAX_LOGIN_ATTEMPTS: number;
    TENCENT_SECRET_ID: string;
    TENCENT_SECRET_KEY: string;
    TENCENT_SMS_SDK_APP_ID: string;
  }
  
  export const Config: IConfig = {
    ALIYUN_ACCESS_KEY_ID: process.env.ALIYUN_ACCESS_KEY_ID || '',
    ALIYUN_ACCESS_KEY_SECRET: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
    SMS_SIGN_NAME: process.env.SMS_SIGN_NAME || '',
    SMS_TEMPLATE_CODE: process.env.SMS_TEMPLATE_CODE || '',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    MAX_SMS_PER_DAY: parseInt(process.env.MAX_SMS_PER_DAY || '10', 10),
    MAX_SMS_PER_MINUTE: parseInt(process.env.MAX_SMS_PER_MINUTE || '3', 10),
    MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    TENCENT_SECRET_ID: process.env.TENCENT_SECRET_ID || '',
    TENCENT_SECRET_KEY: process.env.TENCENT_SECRET_KEY || '',
    TENCENT_SMS_SDK_APP_ID: process.env.TENCENT_SMS_SDK_APP_ID || '',
  };