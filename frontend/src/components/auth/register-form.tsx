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
import { useToast } from "@/_hooks/use-toast"
import { Link } from "@tanstack/react-router"
import { Checkbox } from "@/components/ui/checkbox"
import { VerificationCodeInput } from "@/components/auth/verification-code-input"


// ========================= 注册表单组件 =========================
export function RegisterForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {


  // -------------- 表单状态 ---------------
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { register} = useAuth()
  const { toast } = useToast()

  // -------------- 表单提交 ---------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "密码不匹配",
        description: "请确保两次输入的密码相同",
      })
      return
    }

    setIsLoading(true)

    try {

      // ******  添加控制台日志  ******
      console.log('[RegisterForm] 注册开始...', {
        phone,
        password,
        captcha: verificationCode,
        confirmPassword,
        agreeToTerms: agreed,
        timestamp: new Date().toISOString()
      });
      
      await register({ 
        phone, 
        password,
        captcha: verificationCode,
        confirmPassword,
        agreeToTerms: agreed 
      })

      // ******  添加成功日志  ******
      console.log('[RegisterForm] 注册成功');

      toast({
        title: "注册成功",
        description: "欢迎加入我们！",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "注册失败",
        description: error instanceof Error ? error.message : "请检查您的输入",
      })
    } finally {
      setIsLoading(false)
    }
  }


  //------------------------ 组件渲染 --------------------------
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">创建账号</CardTitle>
          <CardDescription>
            请输入您的手机号、密码和验证码，创建账号。
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
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  disabled={isLoading}
                  required
                />
              </div>

              <VerificationCodeInput
                phone={phone}
                type="register"
                disabled={isLoading}
                value={verificationCode}
                onChange={setVerificationCode}
              />

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  我已阅读并同意
                  <Link 
                    to="/auth/service-term" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  > 用户协议 </Link>
                  与
                  <Link 
                    to="/auth/privacy-policy" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  > 隐私政策</Link>
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !agreed}>
                {isLoading ? "注册中..." : "注册"}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <Link
                  to="/auth/forgot-password"
                  className="text-muted-foreground hover:underline"
                >
                  忘记密码?
                </Link>
                <Link
                  to="/auth/login"
                  className="text-primary hover:underline"
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
