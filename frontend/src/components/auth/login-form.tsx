import { useEffect } from "react"; // 引入 React 的 useEffect 钩子，用于处理副作用

import { useAuth } from "@/contexts/auth-context"; // 引入自定义的 Auth 上下文，用于处理登录逻辑
import { useToast } from "@/hooks/use-toast"; // 引入自定义的 Toast 钩子，用于显示提示信息


import { Link } from "@tanstack/react-router"; // 引入路由链接组件，用于页面跳转
import { cn } from "@/lib/utils"; // 引入工具函数 cn，用于合并 class 名称

import { Button } from "@/components/ui/button"; // 引入自定义的 Button 组件
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // 引入自定义的 Card 组件
import { Separator } from "@/components/ui/separator"; // 引入自定义的 Separator 组件

import { LoginMethod } from "@/types/auth_dt_stru"; // 引入登录方法的枚举类型

import { CodeLoginForm } from "./login_components/CodeLoginForm"; // 引入验证码登录表单组件
import { PasswordLoginForm } from "./login_components/PasswordLoginForm"; // 引入密码登录表单组件
import { AgreementCheckbox } from "./login_components/AgreementCheckbox"; // 引入用户协议复选框组件

import { useGphCaptcha } from "@/components/auth/login_components/useGraphicalCaptcha"; // 引入图形验证码的钩子
import { useLoginFormState } from "./login_components/useLoginFormState"; // 引入登录表单状态的钩子
import { useWechatLogin } from "./login_components/useWeChatLogin"; // 引入微信登录的钩子


// =========================== 定义 LoginForm 组件，接收 className 和其他 props ===========================
// 定义 LoginForm 组件，接收 className 和其他 props
// React.ComponentPropsWithoutRef<"div"> 表示组件接收所有 div 元素的属性
export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {

  // 使用 useAuth 钩子获取登录和请求验证码的函数
  const { login, requestCaptcha } = useAuth();
  
  // 使用 useToast 钩子获取显示 Toast 提示的函数
  const { toast } = useToast();
  
  // 使用 useWechatLogin 钩子获取微信登录的处理函数
  const { handleWechatLogin } = useWechatLogin();

  // 使用 useLoginFormState 钩子获取登录表单的状态和处理函数
  // loginType: 当前登录类型（验证码登录或密码登录）
  // setLoginType: 设置登录类型的函数
  // formState: 表单数据（如手机号、邮箱、验证码、密码等）
  // handleChange: 处理表单数据变化的函数
  // isLoading: 是否正在加载中
  // setIsLoading: 设置加载状态的函数
  const { loginType, setLoginType, formState, handleChange, isLoading, setIsLoading } = useLoginFormState();



  // ----------------------------------- 处理短信验证 ----------------------------------
  // 定义发送短信验证码的函数
  const handleSendSMSCode = async () => {
    if (!formState.phone) { // 如果手机号为空，显示错误提示
      toast({ variant: "destructive", title: "错误", description: "请输入手机号" });
      return;
    }
    try {
      // 请求短信验证码，传入手机号和登录类型
      // requestCaptcha是来自auth-context.tsx的useAuth钩子里的requestCaptcha函数
      await requestCaptcha(formState.phone, 'login');
      toast({ title: "验证码已发送", description: "请注意查收短信" }); // 显示成功提示
    } catch (error) {
      // 如果请求失败，显示错误提示
      toast({ variant: "destructive", title: "验证码发送失败", description: error instanceof Error ? error.message : "请稍后重试" });
    }
  };



  //------------------------------------- 处理 图形验证 ---------------------------------------------------
  // 使用 useGraphicalCaptcha 钩子获取图形验证码的初始化和显示函数
  // 当图形验证码验证成功时，执行 handleSendSMSCode 函数， 
  // 详见 function useGphCaptcha(onSuccess: () => void) {} 函数的定义。
  const { initGphCaptcha, showGphCaptcha } = useGphCaptcha(handleSendSMSCode);

  // 使用 useEffect 钩子在LoginForm组件挂载(包含首次挂载，)后初始化图形验证码
  // 用于使用了useEffect, initGphCaptcha会先于handleSendSMSCode执行
  useEffect(() => {
    // setTimeout 是 JavaScript 的定时器函数，用于在指定的时间后执行代码。
    // 这里，在组件挂载后，延迟 100ms 初始化图形验证码。  
    const timer = setTimeout(() => initGphCaptcha(), 100); // 延迟 100ms 初始化图形验证码

    //clearTimeout(timer) 是一个 JavaScript 函数，用于清除之前通过 setTimeout 设置的定时器
    return () => clearTimeout(timer); // 清除定时器，防止内存泄漏

  }, [initGphCaptcha]);


  // ------------------------ 以下处理‘短信验证码登录’和‘密码登录’的表单提交------------------------------------
  // 验证码登录，指的是用户已经收到了短信验证码，录入进行登录的操作。微信登录不在这段代码里，其逻辑处理被放在了useWechatLogin.tsx里

  // 定义表单验证函数
  const validateForm = () => {
    if (loginType === 'code' && !formState.phone) { // 如果是验证码登录且手机号为空，显示错误提示
      toast({ variant: "destructive", title: "错误", description: "请输入手机号" });
      return false;
    }
    if (loginType === 'password' && !formState.email && !formState.phone) { // 如果是密码登录且手机号和邮箱都为空，显示错误提示
      toast({ variant: "destructive", title: "错误", description: "请输入手机号或邮箱" });
      return false;
    }
    if (!formState.agreed) { // 如果未同意用户协议，显示错误提示
      toast({ variant: "destructive", title: "错误", description: "请同意用户协议和隐私政策" });
      return false;
    }
    return true; // 表单验证通过
  };

  // 定义表单提交处理函数
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 阻止表单默认提交行为
    if (!validateForm()) return; // 如果表单验证不通过，直接返回
    setIsLoading(true); // 设置加载状态为 true
    try {
      if (loginType === 'code') { // 如果是验证码登录
        await login(LoginMethod.CAPTCHA, {
          phone: formState.phone,
          captcha: formState.verificationCode,
          agreeToTerms: formState.agreed,
        });
      } else { // 如果是密码登录
        await login(LoginMethod.PASSWORD, {
          phoneOrEmail: formState.phone || formState.email,
          password: formState.password,
          agreeToTerms: formState.agreed,
        });
      }
      toast({ title: "登录成功", description: "欢迎回来！" }); // 显示登录成功提示
    } catch (error) { // 如果登录失败，显示错误提示
      toast({ variant: "destructive", title: "登录失败", description: error instanceof Error ? error.message : "请检查您的输入" });
    } finally {
      setIsLoading(false); // 无论成功或失败，都设置加载状态为 false
    }
  };



  // ----------------------------------- 组件渲染 -------------------------------------------
  // 返回渲染登录表单的 JSX
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>

        {/* -----------------卡片头部，包含标题和登录方式选择 -----------------------------*/}
        <CardHeader className="text-center">
          <CardTitle className="text-xl">欢迎回来</CardTitle>
          <div className="flex border-b">
            {/* 验证码登录按钮 */}
            <button
              className={cn("flex-1 pb-2 text-center", loginType === 'code' && "border-b-2 border-primary")}
              onClick={() => setLoginType('code')}  // 在useLoginFormState.tsx里定义的setLoginType函数, code是枚举LoginMethod的值
            >
              验证码登录
            </button>
            {/* 密码登录按钮 */}
            <button
              className={cn("flex-1 pb-2 text-center", loginType === 'password' && "border-b-2 border-primary")}
              onClick={() => setLoginType('password')}
            >
              密码登录
            </button>
          </div>
        </CardHeader>

        {/* ---------------------------------  登录表单  ------------------------------------*/}
        <CardContent>
          <form onSubmit={handleSubmit}>
            
            {/* ------------图形验证码容器---------- */}

            {/*top:'-9999px'意味着放在视图之外，这两个容器因为阿里云图形验证码的SDK技术要求*/}
            <div id="captcha-container" style={{ position: 'fixed', top: '-9999px' }}></div>
            <div id="captcha-button" style={{ position: 'fixed', top: '-9999px' }}></div>

            <div className="grid gap-6">
              {/* -------- 根据登录类型显示不同的登录表单 --------- */}
              {loginType === 'code' ? (
                <CodeLoginForm
                  phone={formState.phone}
                  verificationCode={formState.verificationCode}
                  isLoading={isLoading}
                  onPhoneChange={(value) => handleChange('phone', value)}
                  onCodeChange={(value) => handleChange('verificationCode', value)}
                  onSendCode={showGphCaptcha}
                />
              ) : (
                <PasswordLoginForm
                  email={formState.email}
                  password={formState.password}
                  isLoading={isLoading}
                  onEmailChange={(value) => handleChange('email', value)}
                  onPasswordChange={(value) => handleChange('password', value)}
                />
              )}

              {/* ------------ 用户协议复选框 ------------ */}
              <AgreementCheckbox
                agreed={formState.agreed}
                onAgreedChange={(checked) => handleChange('agreed', checked)}
              />

              {/* ------------ 登录按钮 ------------   */}
              <Button type="submit" className="w-full" disabled={isLoading || !formState.agreed}>
                {isLoading ? "登录中..." : "登录"}
              </Button>

              {/* --------------注册链接 ------------ */}
              <div className="text-center text-sm">
                <Link to="/auth/register" className="text-primary hover:underline">
                  立即注册
                </Link>
              </div>

              <Separator className="my-4" />

              {/* -------------微信登录按钮------------ */}
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