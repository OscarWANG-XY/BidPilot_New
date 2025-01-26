"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const tencentcloud = __importStar(require("tencentcloud-sdk-nodejs"));
const config_1 = require("../config");
class SmsService {
    static getClient() {
        if (!this.client) {
            // 导入 SMS 模块的 client
            const smsClient = tencentcloud.sms.v20210111.Client;
            // 实例化 SMS 的 client 对象
            this.client = new smsClient({
                credential: {
                    secretId: config_1.Config.TENCENT_SECRET_ID,
                    secretKey: config_1.Config.TENCENT_SECRET_KEY,
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
    static async sendSms(phone, code) {
        var _a, _b;
        try {
            const params = {
                SmsSdkAppId: config_1.Config.TENCENT_SMS_SDK_APP_ID,
                SignName: config_1.Config.SMS_SIGN_NAME,
                TemplateId: config_1.Config.SMS_TEMPLATE_CODE,
                TemplateParamSet: [code],
                PhoneNumberSet: [`+86${phone}`], // 注意：腾讯云需要带上国际区号
            };
            const response = await this.getClient().SendSms(params);
            // 检查发送结果
            return ((_b = (_a = response.SendStatusSet) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.Code) === 'Ok';
        }
        catch (error) {
            console.error('发送短信失败:', { phone, code, error });
            return false;
        }
    }
}
exports.SmsService = SmsService;
