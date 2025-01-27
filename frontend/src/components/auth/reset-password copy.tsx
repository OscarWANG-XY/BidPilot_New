import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
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
import { useToast } from "@/hooks/use-toast"
import { Link, useNavigate } from "@tanstack/react-router"

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [phone, setPhone] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const { forgotPassword, requestCaptcha } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  // 发送验证码
  const handleSendCode = async () => {
    if (!phone) {
      toast({
        variant: "destructive",
        title: "请输入手机号",
        description: "发送验证码前需要填写手机号",
      })
      return
    }

    try {
      setIsSendingCode(true)
      await requestCaptcha(phone, 'resetPassword')
      
      // 开始倒计时
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      toast({
        title: "验证码已发送",
        description: "请查看手机短信",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "发送失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      })
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "密码不匹配",
        description: "请确保两次输入的密码相同",
      })
      return
    }

    setIsLoading(true)

    try {
      await forgotPassword({
        phone,
        captcha: verificationCode,
        newPassword,
      })
      
      toast({
        title: "密码重置成功",
        description: "请使用新密码登录",
      })
      
      // 重置成功后跳转到登录页
      navigate({ to: "/auth/login" })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "重置失败",
        description: error instanceof Error ? error.message : "请检查您的输入",
      })
    } finally {
      setIsLoading(false)
    }
  }

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
          <form onSubmit={handleSubmit}>
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

              <div className="grid gap-2">
                <Label htmlFor="code">验证码</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="请输入验证码"
                    disabled={isLoading}
                    required
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleSendCode}
                    disabled={isLoading || isSendingCode || countdown > 0}
                    className="flex-shrink-0"
                  >
                    {countdown > 0 ? `${countdown}秒后重试` : "发送验证码"}
                  </Button>
                </div>
              </div>

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
