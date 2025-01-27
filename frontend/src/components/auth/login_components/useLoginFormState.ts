// useLoginFormState.ts

// 导入React中的useState钩子，用于在函数组件中管理状态
import { useState } from "react";

// 导出一个自定义Hook：useLoginFormState
export function useLoginFormState() {
  // 定义登录类型的状态，初始值为'code'，表示默认使用验证码登录
  // loginType可以是'code'（验证码登录）或'password'（密码登录）
  const [loginType, setLoginType] = useState<'code' | 'password'>('code');

  // 定义表单状态，初始值包含以下字段：
  // - phone: 手机号，初始为空字符串
  // - email: 邮箱，初始为空字符串
  // - password: 密码，初始为空字符串
  // - verificationCode: 验证码，初始为空字符串
  // - agreed: 是否同意协议，初始为false
  const [formState, setFormState] = useState({
    phone: '',
    phoneOrEmail: '',
    password: '',
    verificationCode: '',
    agreed: false,
  });

  // 定义加载状态，初始值为false，表示默认没有加载中
  const [isLoading, setIsLoading] = useState(false);

  // 定义一个处理表单字段变化的函数
  // 参数field表示需要更新的字段名，value表示字段的新值（可以是字符串或布尔值）
  const handleChange = (field: keyof typeof formState, value: string | boolean) => {
    // 使用函数式更新方式，确保基于最新的状态进行更新
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  // 返回一个对象，包含以下内容：
  // - loginType: 当前登录类型（'code'或'password'）
  // - setLoginType: 用于更新登录类型的函数
  // - formState: 当前表单状态
  // - handleChange: 用于更新表单字段的函数
  // - isLoading: 当前是否处于加载中
  // - setIsLoading: 用于更新加载状态的函数
  return {
    loginType,
    setLoginType,
    formState,
    handleChange,
    isLoading,
    setIsLoading,
  };
}