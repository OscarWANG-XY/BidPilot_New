from fastapi import APIRouter, Depends, Request
from typing import Dict, Any

from app.auth.dependencies import get_current_user, permitted_projects
from app.models.user import User

router = APIRouter()


@router.get("/{project_id}/test-project-permission")
async def test_project_permission(
    permission_check: bool = Depends(permitted_projects)  # 直接获取项目信息
):
    # 如果到达这里，说明权限验证已通过
    return permission_check