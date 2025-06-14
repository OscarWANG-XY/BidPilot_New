from fastapi import Depends, Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any

from app.auth.jwt import decode_jwt_token
from app.core.exceptions import AuthenticationError, TokenExpiredError

from app.clients.django.client import DjangoClient

# OAuth2 Bearer token实现
security = HTTPBearer()

# 异步依赖函数
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    获取当前认证用户
    
    用于常规HTTP请求的认证依赖函数
    """
    try:
        # 验证token
        token = credentials.credentials
        payload = decode_jwt_token(token)
        return payload
    # 如果token过期，抛出TokenExpiredError异常
    except TokenExpiredError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )
    # 如果token无效，抛出AuthenticationError异常
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )
    # 如果其他异常，抛出AuthenticationError异常
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )


async def get_current_user_from_request(request: Request) -> Dict[str, Any]:
    """
    从Request状态获取当前用户
    
    用于SSE连接等需要从请求状态获取用户的情况
    """
    if not hasattr(request.state, "user"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    return request.state.user



async def permitted_projects( 
    project_id: str, 
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:  # 返回项目信息而不是bool
    """验证项目权限的依赖函数"""
    
    # 安全获取 user_id，如果不存在则抛出异常
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing user_id")
    
    django_client = DjangoClient()
    data = {
        "user_id": user_id
    }
    
    endpoint = f"api/internal/projects/{project_id}/has_project_permission/"
    response = await django_client._make_request(endpoint, data=data, method='post')
    
    if not response:  # 如果没有权限
        raise HTTPException(status_code=403, detail="No permission for this project")
    
    return response  # 返回项目信息或权限详情
