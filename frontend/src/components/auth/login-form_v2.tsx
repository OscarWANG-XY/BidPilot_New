import { useState } from "react"   // REACT状态管理，管理组件局部状态
import { useAuth } from "@/contexts/auth-context"  // 自定义的认证HOOK，处理登录逻辑
import { useToast } from "@/hooks/use-toast"   // 自定义的Toast HOOK， 用于显示提示信息
import { Link } from "@tanstack/react-router"  // Tanstack路由的Link组件
import { cn } from "@/lib/utils"  // CSS类名合并工具函数
import { Button } from "@/components/ui/button"  // ui Button组件
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"  // ui Card组件
import { Input } from "@/components/ui/input"  // ui Input组件
import { Label } from "@/components/ui/label"  // ui label组件
import { Checkbox } from "@/components/ui/checkbox"  // ui Checkbox组件
import { Separator } from "@/components/ui/separator"  // ui Separator组件


// =========================== 登录表单组件 ==================================
export function LoginForm({
  className,   //允许外部出入类名和其他属性，用于自定义样式或行为
  ...props
}: React.ComponentPropsWithoutRef<"div">) {

  // 状态管理
  const [loginType, setLoginType] = useState<'code' | 'password'>('code') // 登录方式切换
  const [phone, setPhone] = useState("")   // 手机号
  const [email, setEmail] = useState("")   // 邮箱
  const [password, setPassword] = useState("")  // 密码
  const [verificationCode, setVerificationCode] = useState("")  // 验证码
  const [agreed, setAgreed] = useState(false)  // 协议同意
  const [isLoading, setIsLoading] = useState(false)
  
  // 自定义HOOK使用
  const { login } = useAuth()   //来自useAuth的函数，用于处理登录逻辑
  const { toast } = useToast()  //来自useToast的函数， 用于显示提示信息


  // ------------------  表单提交处理逻辑  -----------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()  //阻止表单默认提交
    setIsLoading(true)  //开始加载状态

    try {
      await login({ email, password })   // 调用login函数进行登录
      toast({
        title: "登录成功",
        description: "欢迎回来！",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "登录失败",
        description: error instanceof Error ? error.message : "请检查您的邮箱和密码",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 发送验证码
  const handleSendCode = async () => {
    // 实现发送验证码逻辑
  }

  // ----------------------------- UI 渲染 -----------------------------------
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">欢迎回来</CardTitle>
          <div className="flex border-b">
            <button
              className={cn(
                "flex-1 pb-2 text-center",
                loginType === 'code' && "border-b-2 border-primary"
              )}
              onClick={() => setLoginType('code')}
            >
              验证码登录
            </button>
            <button
              className={cn(
                "flex-1 pb-2 text-center",
                loginType === 'password' && "border-b-2 border-primary"
              )}
              onClick={() => setLoginType('password')}
            >
              密码登录
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              {loginType === 'code' ? (
                // 验证码登录表单
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">手机号</Label>
                    <div className="flex gap-2">
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
                        disabled={isLoading}
                      >
                        发送验证码
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // 密码登录表单
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="emailOrPhone">手机号/邮箱</Label>
                    <Input
                      id="emailOrPhone"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="请输入手机号或邮箱"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">密码</Label>
                      <Link
                        to="/auth/forgot-password"
                        className="text-sm text-muted-foreground hover:underline"
                      >
                        忘记密码?
                      </Link>
                    </div>
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
                </div>
              )}

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
                {isLoading ? "登录中..." : "登录"}
              </Button>

              <div className="text-center text-sm">
                <Link to="/auth/register" className="text-primary hover:underline">
                  立即注册
                </Link>
              </div>

              <Separator className="my-4" />

              <Button variant="outline" className="w-full">
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  {/* WeChat SVG icon */}
                </svg>
                使用微信扫码登录
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
