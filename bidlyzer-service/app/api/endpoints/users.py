from fastapi import APIRouter, Depends, Request
from typing import Dict, Any

from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/me", response_model=User)
async def read_users_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """获取当前登录用户信息"""
    return User.from_jwt_payload(current_user)


@router.get("/protected")
async def protected_route(current_user: Dict[str, Any] = Depends(get_current_user)):
    """受保护的API示例"""
    return {
        "message": "You have access to this protected resource",
        "user_id": current_user.get("user_id"),
        "username": current_user.get("username", "")
    }