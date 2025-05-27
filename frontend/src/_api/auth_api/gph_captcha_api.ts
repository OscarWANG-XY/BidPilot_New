// api/captcha_api.ts

// 导入axios库，用于发送HTTP请求
import axios from 'axios';

// 定义一个接口VerifyResult，用于描述验证结果的类型
interface VerifyResult {
    captchaResult: boolean; // 图形验证码验证结果，true表示验证成功，false表示验证失败
    bizResult: boolean;     // 业务逻辑验证结果，true表示业务逻辑验证成功，false表示业务逻辑验证失败
}

// ================  导出一个异步函数verifyGphCaptcha，用于验证图形验证码  =============
export const verifyGphCaptcha = async (
    captchaVerifyParam: string, // 图形验证码的验证参数，通常是一个字符串
    bizParams: any              // 业务逻辑参数，可以是任意类型，具体取决于业务需求
): Promise<VerifyResult> => {   // 返回一个Promise，其解析值为VerifyResult类型
    try {
        // 使用axios发送POST请求到后端验证接口
        await axios.post(`/api/auth/graphical_captcha/verify`, {
            captchaVerifyParam, // 传递图形验证码的验证参数
            ...bizParams        // 展开业务逻辑参数，将其合并到请求体中
        }, {
            headers: {
                'Content-Type': 'application/json', // 设置请求头，指定请求体为JSON格式
            }
        });

        // 如果后端暂时没有实现验证逻辑，返回一个模拟的成功响应
        // 这里返回的captchaResult和bizResult都为true，表示验证成功
        return {
            captchaResult: true,
            bizResult: true
        };
    } catch (error) {
        // 如果请求失败，捕获错误并打印错误信息
        console.error('验证码验证请求失败:', error);

        // 临时返回成功，以便继续开发
        // 这里返回的captchaResult和bizResult都为true，表示验证成功
        return {
            captchaResult: true,
            bizResult: true
        };
    }
};