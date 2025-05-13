"use client"

import * as React from "react"
import { useState } from "react"
import { BadgeCheck, User, Mail, Phone, Key, Upload, Loader2 } from "lucide-react"
import { useToast } from "@/_hooks/use-toast"
import { useAuth } from "@/_hooks/auth-context"
import { UserResponse } from "@/_types/user_dt_stru"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { VerificationCodeInput } from "@/components/auth/verification-code-input"

// 模拟用户信息，扩展 UserResponse 类型
const defaultUser = {
  id: "u-123456",
  phone: "18501771516",
  email: "example@email.com",
  username: "王晖",
  role: 'user' as const,
  createdAt: new Date("2023-01-15"),
  updatedAt: new Date(),
  // 扩展字段 - 视图显示用
  avatar: "/avatars/shadcn.jpg",
  company: "北京科技有限公司",
  position: "项目经理",
} as const;

// 扩展 UserResponse 类型，增加视图所需的字段
interface ExtendedUserResponse extends UserResponse {
  avatar?: string;
  company?: string;
  position?: string;
  username?: string;
}

export function Account() {
  const { user: authUser, isLoading, forgotPassword } = useAuth()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    verificationCode: "",
    newPassword: "",
    confirmPassword: "",
  })

  // 使用实际用户数据或默认数据
  const userData: ExtendedUserResponse = authUser || defaultUser

  // 初始化表单数据
  React.useEffect(() => {
    if (userData) {
      setFormData({
        ...formData,
        username: userData.username || "",
        email: userData.email || "",
        phone: userData.phone || "",
        company: userData.company || "",
        position: userData.position || "",
      })
    }
  }, [userData])


  // React 推荐使用受控组件，而不是直接操作 DOM 元素，建议使用state来管理表单数据, 所以我们需要相应的处理函数。
  // 所有输入字段共用一个处理函数，避免重复代码，通过name动态区分不同的输入字段。 
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleUpdateProfile = async () => {
    setIsUpdating(true)
    try {
      // 这里添加更新个人资料的API调用
      await new Promise((resolve) => setTimeout(resolve, 1000)) // 模拟API延迟
      
      toast({
        title: "个人资料已更新",
        description: "您的个人信息已成功保存",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "更新失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      })
    } finally {
      setIsUpdating(false)
    }
  }


  // 已经使用了forgotPassword API 
  const handleChangePassword = async () => {
    // 验证密码
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "密码不匹配",
        description: "新密码与确认密码不一致，请重新输入",
      })
      return
    }

    setIsChangingPassword(true)
    try {
      // 调用 forgotPassword API 而不是 updatePassword
      await forgotPassword({
        phone: formData.phone,
        captcha: formData.verificationCode,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      })
      
      // 清空密码表单
      setFormData({
        ...formData,
        verificationCode: "",
        newPassword: "",
        confirmPassword: "",
      })
      
      toast({
        title: "密码已修改",
        description: "您的密码已成功更新，下次登录请使用新密码",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "修改失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-10">
      <div className="mb-10 space-y-4">
        <div className="flex items-center gap-2">
          <BadgeCheck className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">账户管理</h1>
        </div>
        <p className="text-muted-foreground">
          管理您的个人信息、密码和账户安全设置
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">个人资料</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
        </TabsList>

        {/* 个人资料标签页 */}
        <TabsContent value="profile" className="space-y-6">
          {/* 个人信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>个人信息</CardTitle>
              <CardDescription>
                更新您的个人信息和联系方式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 头像部分 */}
              <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={userData.avatar || ""} alt={userData.username || ""} />
                  <AvatarFallback>{userData.username?.slice(0, 2) || "用户"}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-base font-medium">{userData.username || "未设置姓名"}</h3>
                  <p className="text-sm text-muted-foreground">
                    账户创建于 {new Date(userData.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    更换头像
                  </Button>
                </div>
              </div>

              <Separator />

              {/* 表单部分 */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">姓名</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">公司</Label>
                  <div className="relative">
                    <BadgeCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">职位</Label>
                  <div className="relative">
                    <BadgeCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">电子邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">手机号码</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button variant="outline">重置</Button>
              <Button
                onClick={handleUpdateProfile}
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存更改
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 安全设置标签页 */}
        <TabsContent value="security" className="space-y-6">
          {/* 修改密码卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>修改密码</CardTitle>
              <CardDescription>
                使用手机验证码重置您的账户密码
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">手机号</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <VerificationCodeInput
                phone={formData.phone}
                type="resetPassword"
                disabled={isChangingPassword}
                value={formData.verificationCode}
                onChange={(code) => 
                  setFormData(prev => ({ ...prev, verificationCode: code }))
                }
              />

              <div className="space-y-2">
                <Label htmlFor="newPassword">新密码</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  密码应至少包含8个字符，包括字母、数字和特殊符号
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认新密码</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                重置密码
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Account