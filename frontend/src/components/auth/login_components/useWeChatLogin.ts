// useWechatLogin.ts
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { LoginMethod } from "@/types/auth_dt_stru";

export function useWechatLogin() {
  const { login } = useAuth();
  const { toast } = useToast();

  const handleWechatLogin = async () => {
    try {
      const response = await login(LoginMethod.WECHAT, { code: '微信授权码' });
      if ('tempToken' in response) {
        toast({
          title: "微信登录成功",
          description: "请绑定手机号",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "微信登录失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      });
    }
  };

  return { handleWechatLogin };
}