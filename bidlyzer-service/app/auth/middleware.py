from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.auth.jwt import decode_jwt_token, get_token_from_authorization_header
from app.core.exceptions import AuthenticationError, TokenExpiredError


class JWTAuthMiddleware(BaseHTTPMiddleware):
    """JWT认证中间件，处理所有请求的认证逻辑"""
    
    async def dispatch(self, request: Request, call_next):
        # 不需要验证的路径列表
        public_paths = [
            "/docs",
            "/redoc",
            "/openapi.json",
            # 添加其他不需要认证的路径
        ]
        
        # 检查请求路径是否在公开路径列表中
        if any(request.url.path.startswith(path) for path in public_paths):
            return await call_next(request)
            
        # 尝试从请求头获取token
        auth_header = request.headers.get("Authorization")
        token = get_token_from_authorization_header(auth_header)
        
        # 如果没有从请求头找到token，尝试从URL参数获取(用于SSE连接)
        if token is None:
            token = request.query_params.get("token")
            
        # 如果没有找到token，返回认证错误
        if token is None:
            return JSONResponse(
                status_code=401,
                content={"detail": "Authentication required"}
            )
            
        try:
            # 解码并验证token
            payload = decode_jwt_token(token)
            
            # 将用户信息添加到请求状态中，以便后续访问
            request.state.user = payload
            
            # 继续处理请求
            return await call_next(request)
            
        except TokenExpiredError as e:
            return JSONResponse(
                status_code=401,
                content={"detail": str(e)}
            )
        except AuthenticationError as e:
            return JSONResponse(
                status_code=401,
                content={"detail": str(e)}
            )
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"detail": f"Internal error during authentication: {str(e)}"}
            )