"use client"

import { useState } from "react"
import { Sparkles, Check, Info, CreditCard } from "lucide-react"
import { cn } from "@/components/ui/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/_hooks/use-toast"

// 定义订阅计划类型
interface PlanFeature {
  name: string
  included: boolean
  info?: string
}

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: {
    monthly: number
    yearly: number
  }
  projects: number
  features: PlanFeature[]
  popular?: boolean
}

// 招投标智能agent服务的订阅计划数据
const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "基础版",
    description: "适合偶尔参与招投标的个人",
    price: {
      monthly: 99,
      yearly: 990
    },
    projects: 3,
    features: [
      { name: "招标文件智能分析", included: true },
      { name: "投标文件智能撰写", included: true },
      { name: "Word格式文档导出", included: true },
      { name: "每月3个招投标项目", included: true },
      { name: "技术支持服务", included: true },
    ]
  },
  {
    id: "professional",
    name: "专业版",
    description: "适合经常参与招投标的个人或小型企业",
    price: {
      monthly: 299,
      yearly: 2990
    },
    projects: 10,
    popular: true,
    features: [
      { name: "招标文件智能分析", included: true },
      { name: "投标文件智能撰写", included: true },
      { name: "Word格式文档导出", included: true },
      { name: "每月10个招投标项目", included: true },
      { name: "技术支持服务", included: true },
    ]
  },
  {
    id: "enterprise",
    name: "企业版",
    description: "适合大量参与招投标的专家或企业",
    price: {
      monthly: 499,
      yearly: 4990
    },
    projects: 20,
    features: [
      { name: "招标文件智能分析", included: true },
      { name: "投标文件智能撰写", included: true },
      { name: "Word格式文档导出", included: true },
      { name: "每月20个招投标项目", included: true },
      { name: "技术支持服务", included: true },
    ]
  }
]

export function Subscription() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const { toast } = useToast()

  const handleUpgrade = (planId: string) => {
    const planName = planId === "basic" ? "基础版" : planId === "professional" ? "专业版" : "企业版";
    toast({
      title: "订阅请求已提交",
      description: `您选择了${planName}${billingCycle === "monthly" ? "月付" : "年付"}方案，每月${
        planId === "basic" ? "3" : planId === "professional" ? "10" : "20"
      }个招投标项目`,
    })
    // 这里可以添加实际的订阅处理逻辑
  }

  return (
    <div className="container max-w-6xl py-10">
      <div className="mb-10 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">招投标智能服务订阅</h1>
        </div>
        <p className="text-muted-foreground">
          选择适合您企业需求的招投标智能服务方案，按项目数量付费
        </p>
      </div>

      {/* 计费周期选择 */}
      <div className="mb-8 flex justify-center">
        <Tabs 
          defaultValue="monthly" 
          value={billingCycle}
          onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")}
          className="w-[400px]"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">月付方案</TabsTrigger>
            <TabsTrigger value="yearly">
              年付方案
              <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">省2个月</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 主要服务说明 */}
      <div className="mb-8">
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <h3 className="mb-3 text-lg font-medium">所有方案包含的智能服务</h3>
            <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span className="text-sm">招标文件智能分析</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span className="text-sm">投标文件智能撰写</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span className="text-sm">Word格式文档导出</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span className="text-sm">技术支持服务</span>
              </li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">各方案仅在每月可使用的项目数量上有差异，服务质量和功能完全一致</p>
          </CardContent>
        </Card>
      </div>

      {/* 订阅计划卡片 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {subscriptionPlans.map((plan) => (
          <Card 
            key={plan.id} 
            className={cn(
              "flex flex-col",
              plan.popular && "border-primary shadow-md"
            )}
          >
            {plan.popular && (
              <div className="absolute right-0 top-0 rounded-bl-lg rounded-tr-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                推荐方案
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">¥{plan.price[billingCycle]}</span>
                  {plan.price[billingCycle] > 0 && (
                    <span className="ml-1 text-sm text-muted-foreground">
                      /{billingCycle === "monthly" ? "月" : "年"}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.projects}个项目/月{billingCycle === "yearly" ? "（每月重置）" : ""}
                </p>
              </div>
              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <div className={cn(
                      "mr-2 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full",
                      feature.included ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {feature.included ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <span className="text-xs">-</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "text-sm",
                        !feature.included && "text-muted-foreground line-through"
                      )}>
                        {feature.name}
                      </span>
                      {feature.info && feature.included && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs text-xs">{feature.info}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              {plan.id === "basic" ? (
                <Button 
                  className="w-full" 
                  onClick={() => handleUpgrade(plan.id)}
                  variant={plan.popular ? "default" : "outline"}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  订阅基础版
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => handleUpgrade(plan.id)}
                  variant={plan.popular ? "default" : "outline"}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {plan.id === "professional" ? "订阅专业版" : "订阅企业版"}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* 常见问题 */}
      <div className="mt-16">
        <h2 className="mb-6 text-2xl font-bold">常见问题</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">什么是一个招投标项目？</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                一个招投标项目指一次完整的招投标流程，包括招标文件分析、投标文件撰写和最终Word文档生成。项目数量每月1日重置。
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">年付和月付有什么区别？</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                选择年付方案可享受相当于10个月的价格，节省16.7%的费用。项目数量仍然按月重置，每月固定配额。
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">如果月内项目用完了怎么办？</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                您可以随时升级到更高级别的方案，新增的项目数量将立即生效。或联系客服购买单次项目服务。
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">一个项目可以修改多少次？</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                每个项目包含3次修改机会。对同一个招投标项目的分析和文件生成不会重复计算项目数量。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Subscription