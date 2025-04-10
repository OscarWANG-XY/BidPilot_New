import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/_hooks/use-toast"
import { useNavigate } from "@tanstack/react-router"

export function LogoutComponent() {
  const { logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logout();
        toast({
          title: "已退出登录",
          description: "期待您的再次访问",
        })
        // 退出后跳转到登录页
        navigate({ to: "/auth/login" })
      } catch (error) {
        toast({
          variant: "destructive",
          title: "退出失败",
          description: error instanceof Error ? error.message : "请稍后重试",
        })
        // 发生错误时也跳转到登录页
        navigate({ to: "/auth/login" })
      }
    }

    handleLogout()
  }, [logout, toast, navigate])

  // 返回 null 因为这是一个无UI的功能组件
  return null
}
