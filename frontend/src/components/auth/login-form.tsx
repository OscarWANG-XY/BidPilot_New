// 导入 React 和相关的依赖
import { useState } from "react"; // React 的状态管理钩子
import { useAuth } from "@/contexts/auth-context"; // 自定义的认证上下文钩子，用于处理登录逻辑
import { useToast } from "@/hooks/use-toast"; // 自定义的 Toast 提示钩子，用于显示成功或错误消息
import { Link } from "@tanstack/react-router"; // 路由链接组件，用于页面跳转
import { cn } from "@/lib/utils"; // 工具函数，用于动态生成 CSS 类名
import { Button } from "@/components/ui/button"; // 自定义的按钮组件
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // 自定义的卡片组件
import { Input } from "@/components/ui/input"; // 自定义的输入框组件
import { Label } from "@/components/ui/label"; // 自定义的标签组件
import { Checkbox } from "@/components/ui/checkbox"; // 自定义的复选框组件
import { Separator } from "@/components/ui/separator"; // 自定义的分隔线组件
import { LoginMethod } from "@/types/auth_dt_stru"; // 枚举类型，定义了登录方式（如验证码、密码、微信登录）


// ============================== 定义登录表单组件 ==============================
export function LoginForm({
  className, // 外部传入的类名，用于自定义样式
  ...props // 其他属性，用于扩展组件功能
}: React.ComponentPropsWithoutRef<"div">) {
  // 状态管理
  const [loginType, setLoginType] = useState<'code' | 'password'>('code'); // 当前登录方式，默认为验证码登录
  const [formState, setFormState] = useState({
    phone: '', // 手机号
    email: '', // 邮箱
    password: '', // 密码
    verificationCode: '', // 验证码
    agreed: false, // 是否同意协议
  });
  const [isLoading, setIsLoading] = useState(false); // 是否正在加载中

  // 依赖注入
  const { login, requestCaptcha } = useAuth(); // 从认证上下文中获取登录和请求验证码的方法
  const { toast } = useToast(); // 获取 Toast 提示方法


  // 处理表单字段更新
  const handleChange = (field: keyof typeof formState, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value })); // 更新表单字段的值
  };

  // -------------------  字段的非空校验和格式校验 -------------------
  const validateForm = () => {
    if (loginType === 'code' && !formState.phone) {
      toast({ variant: "destructive", title: "错误", description: "请输入手机号" });
      return false;
    }
    if (loginType === 'password' && !formState.email && !formState.phone) {
      toast({ variant: "destructive", title: "错误", description: "请输入手机号或邮箱" });
      return false;
    }
    if (!formState.agreed) {
      toast({ variant: "destructive", title: "错误", description: "请同意用户协议和隐私政策" });
      return false;
    }
    return true;
  };


  // -------------------  处理表单提交  -------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 阻止默认表单提交行为
    if (!validateForm()) return; // 如果表单验证失败，直接返回
    setIsLoading(true); // 开始加载

    try {
      await performLogin(); // 将登录逻辑抽离到单独的函数
    } catch (error) {
      toast({ variant: "destructive", title: "登录失败", description: error instanceof Error ? error.message : "请检查您的输入" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const performLogin = async () => {
    if (loginType === 'code') {
      await login(LoginMethod.CAPTCHA, {
        phone: formState.phone,
        captcha: formState.verificationCode,
        agreeToTerms: formState.agreed,
      });
    } else {
      console.log('准备密码登录');
      console.log('手机或邮箱：', formState.email);
      console.log('密码：', formState.password);
      console.log('同意协议：', formState.agreed);
      await login(LoginMethod.PASSWORD, {
        phoneOrEmail: formState.email,
        password: formState.password,
        agreeToTerms: formState.agreed,
      });
    }
    toast({ title: "登录成功", description: "欢迎回来！" });
  };


   // -------------------  发送验证码  （已测试通过） -------------------
  const handleSendCode = async () => {
    if (!formState.phone) {
      // 如果手机号为空，提示错误
      toast({
        variant: "destructive",
        title: "错误",
        description: "请输入手机号",
      });
      return;
    }

    try {
      // 请求验证码
      await requestCaptcha(formState.phone, 'login');
      // 验证码发送成功提示
      toast({
        title: "验证码已发送",
        description: "请注意查收短信",
      });
    } catch (error) {
      // 验证码发送失败提示
      toast({
        variant: "destructive",
        title: "验证码发送失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      });
    }
  };

   // -------------------  微信登录 -------------------
  const handleWechatLogin = async () => {
    try {
      // 调用微信登录 API
      const response = await login(LoginMethod.WECHAT, { code: '微信授权码' });

      // 从微信授权回调中获取 code (getWechatCode() 未实现)
      // const wechatCode = await getWechatCode(); // 从微信授权回调中获取 code
      // const response = await login(LoginMethod.WECHAT, { code: wechatCode });
      
      if ('tempToken' in response) {
        // 如果返回临时 token，提示绑定手机号
        toast({
          title: "微信登录成功",
          description: "请绑定手机号",
        });
        // 跳转到绑定手机号页面（此处未实现）
      }
    } catch (error) {
      // 微信登录失败提示
      toast({
        variant: "destructive",
        title: "微信登录失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      });
    }
  };

// ------------------------------ 渲染表单 ------------------------------
return (
  <div className={cn("flex flex-col gap-6", className)} {...props}>
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">欢迎回来</CardTitle>
        {/* 登录方式切换按钮 */}
        <div className="flex border-b">
          <button
            className={cn(
              "flex-1 pb-2 text-center",
              loginType === 'code' && "border-b-2 border-primary"
            )}
            onClick={() => setLoginType('code')} // 切换到验证码登录
          >
            验证码登录
          </button>
          <button
            className={cn(
              "flex-1 pb-2 text-center",
              loginType === 'password' && "border-b-2 border-primary"
            )}
            onClick={() => setLoginType('password')} // 切换到密码登录
          >
            密码登录
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {/* 表单 */}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            {/* 动态渲染登录表单 */}
            {loginType === 'code' ? (
              // 验证码登录表单
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">手机号</Label>
                  <div className="flex gap-2">
                    <Input
                      id="phone"
                      type="tel"
                      value={formState.phone}
                      onChange={(e) => handleChange('phone', e.target.value)} // 更新手机号
                      placeholder="请输入手机号"
                      disabled={isLoading} // 加载时禁用
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="code">验证码</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={formState.verificationCode}
                      onChange={(e) => handleChange('verificationCode', e.target.value)} // 更新验证码
                      placeholder="请输入验证码"
                      disabled={isLoading} // 加载时禁用
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendCode} // 发送验证码
                      disabled={isLoading} // 加载时禁用
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
                    value={formState.email}
                    onChange={(e) => handleChange('email', e.target.value)} // 更新邮箱或手机号
                    placeholder="请输入手机号或邮箱"
                    disabled={isLoading} // 加载时禁用
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
                    value={formState.password}
                    onChange={(e) => handleChange('password', e.target.value)} // 更新密码
                    placeholder="请输入密码"
                    disabled={isLoading} // 加载时禁用
                    required
                  />
                </div>
              </div>
            )}

            {/* 协议复选框 */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formState.agreed}
                onCheckedChange={(checked) => handleChange('agreed', checked as boolean)} // 更新协议状态
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                我已阅读并同意
                <Link
                  to="/auth/service-term"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  用户协议
                </Link>
                与
                <Link
                  to="/auth/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  隐私政策
                </Link>
              </label>
            </div>

            {/* 登录按钮 */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !formState.agreed}
              onClick={() => {
                if (!formState.agreed) {
                  toast({ variant: "destructive", title: "错误", description: "请同意用户协议和隐私政策" });
                }
              }}             
              >
              {isLoading ? "登录中..." : "登录"}
            </Button>

            {/* 注册链接 */}
            <div className="text-center text-sm">
              <Link to="/auth/register" className="text-primary hover:underline">
                立即注册
              </Link>
            </div>

            {/* 分隔线 */}
            <Separator className="my-4" />

            {/* 微信登录按钮 */}
            <Button variant="outline" className="w-full" onClick={handleWechatLogin}>
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
);
}