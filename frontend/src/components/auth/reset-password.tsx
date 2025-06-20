import { useState } from "react"
import { useAuth } from "@/_hooks/auth-context"
import { cn } from "@/components/ui/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/_hooks/use-toast"
import { Link, useNavigate } from "@tanstack/react-router"
import { VerificationCodeInput } from "@/components/auth/verification-code-input"


// ============================== 重置密码组件 ==============================
export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [phone, setPhone] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { forgotPassword } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()


  // ------------------------- 表单提交 -------------------------
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('[ResetPasswordForm] 表单提交 - 开始', {
      phone,
      verificationCode,
      newPassword,
      confirmPassword,
      timestamp: new Date().toISOString()
    })
    
    if (newPassword !== confirmPassword) {
      console.log('[ResetPasswordForm] 密码不匹配')
      toast({
        variant: "destructive",
        title: "密码不匹配",
        description: "请确保两次输入的密码相同",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log('[ResetPasswordForm] 调用 forgotPassword API')
      await forgotPassword({
        phone,
        captcha: verificationCode,
        newPassword,
        confirmPassword,
      })
      
      console.log('[ResetPasswordForm] 密码重置成功')
      toast({
        title: "密码重置成功",
        description: "请使用新密码登录",
      })
      
      // 重置成功后跳转到登录页
      navigate({ to: "/auth/login" })
    } catch (error) {
      console.error('[ResetPasswordForm] 重置失败', error)
      toast({
        variant: "destructive",
        title: "重置失败",
        description: error instanceof Error ? error.message : "请检查您的输入",
      })
    } finally {
      setIsLoading(false)
      console.log('[ResetPasswordForm] 重置流程结束')
    }
  }


  // ------------------------- 渲染组件 -------------------------
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">重置密码</CardTitle>
          <CardDescription>
            请输入您的手机号和验证码来重置密码
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword}>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="phone">手机号</Label>
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-16">
                    <Input
                      value="+86"
                      disabled
                      className="text-center"
                    />
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <VerificationCodeInput
                phone={phone}
                type="resetPassword"
                disabled={isLoading}
                value={verificationCode}
                onChange={setVerificationCode}
              />

              <div className="grid gap-2">
                <Label htmlFor="newPassword">新密码</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">确认新密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入新密码"
                  disabled={isLoading}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "重置中..." : "重置密码"}
              </Button>

              <div className="text-center">
                <Link
                  to="/auth/login"
                  className="text-sm text-primary hover:underline"
                >
                  返回登录
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
