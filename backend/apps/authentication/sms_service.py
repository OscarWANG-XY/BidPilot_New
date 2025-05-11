# sms_service.py

import json
import logging
from typing import Dict, Any, List, Optional

from tencentcloud.common import credential
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException
from tencentcloud.common.profile.client_profile import ClientProfile
from tencentcloud.common.profile.http_profile import HttpProfile
from tencentcloud.sms.v20210111 import sms_client, models

from django.conf import settings

# 配置日志
logger = logging.getLogger('apps.sms')

class TencentSmsService:
    """腾讯云短信服务封装类"""
    
    @staticmethod
    def send_verification_code(phone: str, code: str) -> Dict[str, Any]:
        """
        发送验证码短信
        
        Args:
            phone: 手机号码，不带国家代码
            code: 验证码
            
        Returns:
            Dict: 短信发送结果
            
        Raises:
            ValueError: 短信发送失败时抛出的异常
        """
        try:
            logger.info("=== 开始发送短信验证码 sms_service.py/send_verification_code ===")
            logger.info("- 手机号: %s", phone)
            logger.info("- 验证码: %s", code)

             # 检查必要的配置是否存在
            if not all([
                settings.TENCENT_CLOUD_SECRET_ID,
                settings.TENCENT_CLOUD_SECRET_KEY,
                settings.TENCENT_SMS_REGION,
                settings.TENCENT_SMS_SDK_APP_ID,
                settings.TENCENT_SMS_TEMPLATE_ID,
                settings.TENCENT_SMS_SIGN_NAME
            ]):
                error_msg = "腾讯云短信服务配置不完整"
                logger.error(error_msg)
                raise ValueError(error_msg)

            # 实例化一个认证对象
            cred = credential.Credential(
                settings.TENCENT_CLOUD_SECRET_ID, 
                settings.TENCENT_CLOUD_SECRET_KEY
            )
            
            # 实例化一个http选项
            httpProfile = HttpProfile()
            httpProfile.endpoint = "sms.tencentcloudapi.com"
            
            # 实例化一个client选项
            clientProfile = ClientProfile()
            clientProfile.httpProfile = httpProfile
            
            # 实例化要请求产品的client对象
            # 注意：这里使用南京区域(ap-nanjing)，应与你的腾讯云账号设置匹配
            client = sms_client.SmsClient(cred, settings.TENCENT_SMS_REGION, clientProfile)
            
            # 实例化一个请求对象
            req = models.SendSmsRequest()
            
            # 构造请求参数，使用你实际的应用信息
            params = {
                "PhoneNumberSet": [f"+86{phone}"],  # 国际号码格式，+86前缀
                "SmsSdkAppId": settings.TENCENT_SMS_SDK_APP_ID,  # 你的实际应用ID
                "TemplateId": settings.TENCENT_SMS_TEMPLATE_ID,  # 你的实际模板ID
                "SignName": settings.TENCENT_SMS_SIGN_NAME,  # 你的实际签名
                "TemplateParamSet": [code]  # 模板参数，这里只有验证码
            }
            req.from_json_string(json.dumps(params))
            
            # 发送短信请求
            resp = client.SendSms(req)
            
            # 解析响应
            response_json = resp.to_json_string()
            logger.info("腾讯云短信发送响应: %s", response_json)
            response_data = json.loads(response_json)
            
            # 检查发送结果
            send_status = response_data.get("SendStatusSet", [{}])[0]
            if send_status.get("Code") != "Ok":
                logger.error("短信发送失败: %s", send_status.get("Message", "未知错误"))
                raise ValueError(f'短信发送失败: {send_status.get("Message", "未知错误")}')
                
            logger.info("短信发送成功")
            return response_data
            
        except TencentCloudSDKException as err:
            error_msg = f"腾讯云SDK异常: {err}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        except Exception as e:
            error_msg = f"短信发送过程中发生未知错误: {str(e)}"
            logger.error(error_msg)
            raise ValueError(error_msg)