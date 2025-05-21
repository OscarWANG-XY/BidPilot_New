from fastapi import HTTPException, status


class AuthenticationError(HTTPException):
    """认证错误异常"""
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )


class TokenExpiredError(AuthenticationError):
    """Token过期异常"""
    def __init__(self, detail: str = "Token has expired"):
        super().__init__(detail=detail)


class PermissionDeniedError(HTTPException):
    """权限不足异常"""
    def __init__(self, detail: str = "Permission denied"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )