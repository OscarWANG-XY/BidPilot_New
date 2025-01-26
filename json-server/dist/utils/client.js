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
exports.CaptchaClient = void 0;
const captcha20230305_1 = __importStar(require("@alicloud/captcha20230305")), $Captcha20230305 = captcha20230305_1;
const $OpenApi = __importStar(require("@alicloud/openapi-client"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
class CaptchaClient {
    static getInstance() {
        if (!this.instance) {
            const config = new $OpenApi.Config({
                accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
                accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
                endpoint: "captcha.cn-shanghai.aliyuncs.com",
                connectTimeout: 5000,
                readTimeout: 5000,
            });
            this.instance = new captcha20230305_1.default(config);
        }
        return this.instance;
    }
    static async verifyCaptcha(captchaVerifyParam) {
        var _a, _b;
        try {
            const client = this.getInstance();
            const request = new $Captcha20230305.VerifyCaptchaRequest({});
            request.captchaVerifyParam = captchaVerifyParam;
            const resp = await client.verifyCaptcha(request);
            return (_b = (_a = resp.body.result) === null || _a === void 0 ? void 0 : _a.verifyResult) !== null && _b !== void 0 ? _b : false;
        }
        catch (error) {
            console.error('验证码验证出错:', error);
            // 出现异常时返回 true，确保业务可用性
            return true;
        }
    }
}
exports.CaptchaClient = CaptchaClient;
