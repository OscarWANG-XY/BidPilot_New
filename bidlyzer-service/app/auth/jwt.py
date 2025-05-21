import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
from datetime import datetime, timedelta
from typing import Dict, Optional, Any

from app.core.config import settings
from app.core.exceptions import AuthenticationError, TokenExpiredError


def decode_jwt_token(token: str) -> Dict[str, Any]:
    """
    解码JWT token并验证其有效性
    
    使用与Django SimpleJWT相同的验证参数和配置
    """
    try:
        # 与Django SimpleJWT使用相同的解码参数
        payload = jwt.decode(
            token,
            settings.JWT_SIGNING_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={
                'verify_signature': True,
                'verify_exp': True,
                'verify_aud': settings.JWT_AUDIENCE is not None,
                'verify_iss': settings.JWT_ISSUER is not None,
                'require_exp': True,
            },
            audience=settings.JWT_AUDIENCE,
            issuer=settings.JWT_ISSUER,
        )
        
        # SimpleJWT使用token_type区分access和refresh token
        # 只接受access token
        if payload.get('token_type') != 'access':
            raise AuthenticationError("Not an access token")
            
        # 验证必要的payload字段
        if 'user_id' not in payload:
            raise AuthenticationError("Invalid token payload: missing user_id")
            
        return payload
        # 解码后的 payload 是一个字典，包含：
            # user_id: 用户标识符(代码中验证了此字段必须存在)
            # token_type: token类型(验证为"access")
            # 过期时间信息
            # 可能存在的其他用户相关信息(如角色、权限等)
    
            
    except ExpiredSignatureError:
        raise TokenExpiredError("Token has expired")
    except InvalidTokenError as e:
        raise AuthenticationError(f"Invalid token: {str(e)}")
    except Exception as e:
        raise AuthenticationError(f"Token validation error: {str(e)}")


def get_token_from_authorization_header(auth_header: Optional[str]) -> Optional[str]:
    """从Authorization头中提取token"""
    if not auth_header:
        return None
        
    parts = auth_header.split()
    
    if len(parts) != 2:
        return None
        
    if parts[0] != settings.JWT_AUTH_HEADER_PREFIX:
        return None
        
    return parts[1]