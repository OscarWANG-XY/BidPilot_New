import { useState } from "react";
import { useAuth } from "@/contexts/auth-context_v2";
import { useToast } from "@/hooks/use-toast";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { LoginMethod } from "@/types/auth_dt_stru";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [loginType, setLoginType] = useState<'code' | 'password'>('code');
  const [formState, setFormState] = useState({
    phone: '',
    email: '',
    password: '',
    verificationCode: '',
    agreed: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const { login, requestCaptcha } = useAuth();
  const { toast } = useToast();

  const handleChange = (field: keyof typeof formState, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (loginType === 'code') {
        await login(LoginMethod.CAPTCHA, {
          phone: formState.phone,
          captcha: formState.verificationCode,
          agreeToTerms: formState.agreed,
        });
      } else {
        await login(LoginMethod.PASSWORD, {
          phoneOrEmail: formState.email,
          password: formState.password,
          agreeToTerms: formState.agreed,
        });
      }

      toast({
        title: "登录成功",
        description: "欢迎回来！",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "登录失败",
        description: error instanceof Error ? error.message : "请检查您的输入",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!formState.phone) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "请输入手机号",
      });
      return;
    }

    try {
      await requestCaptcha(formState.phone, 'login');
      toast({
        title: "验证码已发送",
        description: "请注意查收短信",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "验证码发送失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      });
    }
  };

  const handleWechatLogin = async () => {
    try {
      const response = await login(LoginMethod.WECHAT, { code: '微信授权码' });
      if ('tempToken' in response) {
        toast({
          title: "微信登录成功",
          description: "请绑定手机号",
        });
        // 跳转到绑定手机号页面
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "微信登录失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      });
    }
  };

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
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">手机号</Label>
                    <div className="flex gap-2">
                      <Input
                        id="phone"
                        type="tel"
                        value={formState.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
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
                        value={formState.verificationCode}
                        onChange={(e) => handleChange('verificationCode', e.target.value)}
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
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="emailOrPhone">手机号/邮箱</Label>
                    <Input
                      id="emailOrPhone"
                      type="text"
                      value={formState.email}
                      onChange={(e) => handleChange('email', e.target.value)}
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
                      value={formState.password}
                      onChange={(e) => handleChange('password', e.target.value)}
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
                  checked={formState.agreed}
                  onCheckedChange={(checked) => handleChange('agreed', checked as boolean)}
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

              <Button type="submit" className="w-full" disabled={isLoading || !formState.agreed}>
                {isLoading ? "登录中..." : "登录"}
              </Button>

              <div className="text-center text-sm">
                <Link to="/auth/register" className="text-primary hover:underline">
                  立即注册
                </Link>
              </div>

              <Separator className="my-4" />

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