import Captcha20230305, * as $Captcha20230305 from '@alicloud/captcha20230305';
import OpenApi, * as $OpenApi from '@alicloud/openapi-client';
import * as dotenv from 'dotenv';

dotenv.config();

export class CaptchaClient {
  private static instance: Captcha20230305;

  private static getInstance(): Captcha20230305 {
    if (!this.instance) {
      const config = new $OpenApi.Config({
        accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
        endpoint: "captcha.cn-shanghai.aliyuncs.com",
        connectTimeout: 5000,
        readTimeout: 5000,
      });
      this.instance = new Captcha20230305(config);
    }
    return this.instance;
  }

  static async verifyCaptcha(captchaVerifyParam: string): Promise<boolean> {
    try {
      const client = this.getInstance();
      const request = new $Captcha20230305.VerifyCaptchaRequest({});
      request.captchaVerifyParam = captchaVerifyParam;

      const resp = await client.verifyCaptcha(request);
      return resp.body.result?.verifyResult ?? false;
    } catch (error) {
      console.error('验证码验证出错:', error);
      // 出现异常时返回 true，确保业务可用性
      return true;
    }
  }
} 