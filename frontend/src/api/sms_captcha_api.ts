import axios from 'axios';

interface SMSVerifyResult {
  success: boolean;
  message?: string;
}

export const sendSMSCaptcha = async (phone: string, scene: string): Promise<void> => {
  try {
    await axios.post('/api/auth/sms/send', {
      phone,
      scene
    });
  } catch (error) {
    console.error('发送短信验证码失败:', error);
    throw error;
  }
};

export const verifySMSCaptcha = async (
  phone: string,
  code: string
): Promise<SMSVerifyResult> => {
  try {
    const response = await axios.post('/api/auth/sms/verify', {
      phone,
      code
    });
    return response.data;
  } catch (error) {
    console.error('验证短信验证码失败:', error);
    throw error;
  }
};
