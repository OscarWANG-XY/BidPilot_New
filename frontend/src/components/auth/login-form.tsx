import { useState } from "react"   // REACT状态管理，管理组件局部状态
import { useAuth } from "@/contexts/auth-context"  // 自定义的认证HOOK，处理登录逻辑
import { useToast } from "@/hooks/use-toast"   // 自定义的Toast HOOK， 用于显示提示信息
import { Link } from "@tanstack/react-router"  // Tanstack路由的Link组件
import { cn } from "@/lib/utils"  // CSS类名合并工具函数
import { Button } from "@/components/ui/button"  // ui Button组件
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"  // ui Card组件
import { Input } from "@/components/ui/input"  // ui Input组件
import { Label } from "@/components/ui/label"  // ui label组件


// =========================== 登录表单组件 ==================================
export function LoginForm({
  className,   //允许外部出入类名和其他属性，用于自定义样式或行为
  ...props
}: React.ComponentPropsWithoutRef<"div">) {

  // 状态管理
  const [email, setEmail] = useState("")   // 存储用户邮箱，状态更新
  const [password, setPassword] = useState("")  // 存储用户密码，状态更新
  const [isLoading, setIsLoading] = useState(false)  // 控制登录按钮的加载状态
  
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

  // ----------------------------- UI 渲染 -----------------------------------
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">欢迎回来</CardTitle>
          <CardDescription>
            使用您的账号登录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <Button variant="outline" className="w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor"
                    />
                  </svg>
                  使用Apple登录
                </Button>
                <Button variant="outline" className="w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  使用Google登录
                </Button>
              </div>
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  或继续使用邮箱
                </span>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">密码</Label>
                    <Link
                      to="/auth/forgot-password"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      忘记密码?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "登录中..." : "登录"}
                </Button>
              </div>
              <div className="text-center text-sm">
                还没有账号?{" "}
                <Link to="/auth/register" className="underline underline-offset-4">
                  注册
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        点击继续即表示您同意我们的{" "}
        <Link to="/terms">服务条款</Link>和
        <Link to="/privacy">隐私政策</Link>。
      </div>
    </div>
  )
}
