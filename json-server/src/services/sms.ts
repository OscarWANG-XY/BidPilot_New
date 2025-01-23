import * as tencentcloud from 'tencentcloud-sdk-nodejs';
import { Config } from '../config';

export class SmsService {
  private static client: any;

  private static getClient() {
    if (!this.client) {
      // 导入 SMS 模块的 client
      const smsClient = tencentcloud.sms.v20210111.Client;
      
      // 实例化 SMS 的 client 对象
      this.client = new smsClient({
        credential: {
          secretId: Config.TENCENT_SECRET_ID,
          secretKey: Config.TENCENT_SECRET_KEY,
        },
        region: "ap-guangzhou",
        profile: {
          signMethod: "HmacSHA256",
          httpProfile: {
            reqMethod: "POST",
            reqTimeout: 30,
            endpoint: "sms.tencentcloudapi.com"
          },
        },
      });
    }
    return this.client;
  }

  static async sendSms(phone: string, code: string): Promise<boolean> {
    try {
      const params = {
        SmsSdkAppId: Config.TENCENT_SMS_SDK_APP_ID,
        SignName: Config.SMS_SIGN_NAME,
        TemplateId: Config.SMS_TEMPLATE_CODE,
        TemplateParamSet: [code],
        PhoneNumberSet: [`+86${phone}`], // 注意：腾讯云需要带上国际区号
      };

      const response = await this.getClient().SendSms(params);
      
      // 检查发送结果
      return response.SendStatusSet?.[0]?.Code === 'Ok';
    } catch (error) {
      console.error('发送短信失败:', { phone, code, error });
      return false;
    }
  }
}