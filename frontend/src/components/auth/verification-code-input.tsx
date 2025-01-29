import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { CaptchaRequest } from "@/types/auth_dt_stru"
import { useCaptchaCountdown } from "@/components/auth/use-captcha-countdown"

interface VerificationCodeInputProps {
  phone: string
  type: CaptchaRequest['type']  //三种类型：'register' | 'login' | 'resetPassword'
  disabled?: boolean
  value: string
  onChange: (value: string) => void
  className?: string
}

//=========================================== 验证码输入组件 ===========================================
export function VerificationCodeInput({
  phone,
  type,
  disabled = false,
  value,
  onChange,
  className
}: VerificationCodeInputProps) {
  const [isSendingCode, setIsSendingCode] = useState(false)
  const { countdowns, startCountdown } = useCaptchaCountdown()
  const { requestCaptcha } = useAuth()
  const { toast } = useToast()

  // 获取当前手机号的倒计时
  const countdown = phone ? countdowns[phone] || 0 : 0

  // ---------------------- 发送验证码 ----------------------------
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
      console.log(`[VerificationCodeInput] 发送验证码 - 开始`, {
        phone,
        type,
        timestamp: new Date().toISOString()
      })
      
      await requestCaptcha(phone, type as CaptchaRequest['type']) //三种类型：'register' | 'login' | 'resetPassword' 
      
      console.log(`[VerificationCodeInput] 发送验证码 - 成功`)
      
      // 使用共享的倒计时状态
      startCountdown(phone)

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


  // ---------------------- 渲染组件 ----------------------------
  return (
    <div className={`grid gap-2 ${className}`}>
      <Label htmlFor="code">验证码</Label>
      <div className="flex gap-2">
        <Input
          id="code"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="请输入验证码"
          disabled={disabled}
          required
        />
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleSendCode}
          disabled={disabled || isSendingCode || countdown > 0}
          className="flex-shrink-0"
        >
          {countdown > 0 ? `${countdown}秒后重试` : "发送验证码"}
        </Button>
      </div>
    </div>
  )
} 