"use client"

import * as React from "react"
import { useState } from "react"
import { BadgeCheck, User, Mail, Phone, Key, Loader2 } from "lucide-react"
import { useToast } from "@/_hooks/use-toast"
import { useUser } from "@/_hooks/useUser"
import { UserUpdateInput } from "@/_types/user_dt_stru"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { VerificationCodeInput } from "@/components/auth/verification-code-input"

export function Account() {
  const { user, isLoading, updateUser, isUpdating } = useUser()
  const { toast } = useToast()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    verificationCode: "",
    newPassword: "",
    confirmPassword: "",
  })

  // 初始化表单数据
  React.useEffect(() => {
    if (user) {
      setFormData({
        ...formData,
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
      })
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const updateData: UserUpdateInput = {
        email: formData.email,
      }

      await updateUser({
        userId: user.id,
        data: updateData
      })
      
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
    }
  }

  const handleChangePassword = async () => {
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
      // TODO: 实现密码修改逻辑
      await new Promise(resolve => setTimeout(resolve, 1000))
      
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

  if (!user) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-muted-foreground">未找到用户信息</p>
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
          管理您的个人信息和账户安全设置
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
              {/* 用户基本信息 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    账户创建于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    用户角色: {user.role === 'admin' ? '管理员' : '普通用户'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* 表单部分 */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">手机号码</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      readOnly
                      className="pl-10 bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">用户名</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      readOnly
                      className="pl-10 bg-muted"
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
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
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