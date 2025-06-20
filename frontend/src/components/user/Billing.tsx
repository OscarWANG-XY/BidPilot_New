"use client"

import { useState } from "react"
import { 
  CreditCard, 
  Search, 
  CalendarIcon, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/components/ui/utils"
import { useToast } from "@/_hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"

// 订单状态类型
type OrderStatus = "completed" | "pending" | "failed"

// 订单记录类型
interface Order {
  id: string
  date: Date
  description: string
  amount: number
  status: OrderStatus
  invoice?: string
  invoiceStatus?: "available" | "processing" | "requested" | null
}

// 订阅信息类型
interface Subscription {
  plan: string
  status: "active" | "inactive" | "trial"
  startDate: Date
  endDate: Date | null
  amount: number
  billingCycle: "monthly" | "yearly"
  nextBillingDate: Date | null
  paymentMethod: {
    type: "credit_card" | "alipay" | "wechat"
    last4?: string
    expiry?: string
  }
}

// 模拟订单数据
const mockOrders: Order[] = [
  {
    id: "ORD-2025051001",
    date: new Date(2025, 4, 10), // May 10, 2025
    description: "专业版订阅 - 月付",
    amount: 299,
    status: "completed",
    invoice: "INV-2025051001",
    invoiceStatus: "available"
  },
  {
    id: "ORD-2025041001",
    date: new Date(2025, 3, 10), // April 10, 2025
    description: "专业版订阅 - 月付",
    amount: 299,
    status: "completed",
    invoice: "INV-2025041001",
    invoiceStatus: "available"
  },
  {
    id: "ORD-2025031001",
    date: new Date(2025, 2, 10), // March 10, 2025
    description: "专业版订阅 - 月付",
    amount: 299,
    status: "completed",
    invoice: "INV-2025031001",
    invoiceStatus: "available"
  },
  {
    id: "ORD-2025021001",
    date: new Date(2025, 1, 10), // February 10, 2025
    description: "方案升级: 基础版 → 专业版",
    amount: 200,
    status: "completed",
    invoice: "INV-2025021001",
    invoiceStatus: "available"
  },
  {
    id: "ORD-2025020501",
    date: new Date(2025, 1, 5), // February 5, 2025
    description: "额外项目包 (5个项目)",
    amount: 150,
    status: "completed",
    invoice: "INV-2025020501",
    invoiceStatus: "available"
  },
  {
    id: "ORD-2025011001",
    date: new Date(2025, 0, 10), // January 10, 2025
    description: "基础版订阅 - 月付",
    amount: 99,
    status: "completed",
    invoice: "INV-2025011001",
    invoiceStatus: "available"
  }
]

// 模拟当前订阅
const mockSubscription: Subscription = {
  plan: "专业版",
  status: "active",
  startDate: new Date(2025, 1, 10), // February 10, 2025
  endDate: null,
  amount: 299,
  billingCycle: "monthly",
  nextBillingDate: new Date(2025, 5, 10), // June 10, 2025
  paymentMethod: {
    type: "credit_card",
    last4: "4242",
    expiry: "05/28"
  }
}

export function Billing() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [subscription] = useState<Subscription>(mockSubscription)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // 处理搜索和筛选
  const filteredOrders = orders.filter(order => {
    // 搜索逻辑
    const matchesSearch = 
      searchQuery === "" || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    // 状态筛选逻辑
    const matchesStatus = 
      statusFilter === "all" || 
      order.status === statusFilter
    
    // 日期筛选逻辑
    const matchesDate = 
      !date || 
      (order.date.getDate() === date.getDate() && 
       order.date.getMonth() === date.getMonth() && 
       order.date.getFullYear() === date.getFullYear())
    
    return matchesSearch && matchesStatus && matchesDate
  })

  // 清除所有筛选条件
  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setDate(undefined)
  }

  // 格式化显示金额
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount)
  }

  // 状态徽章渲染
  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
            <CheckCircle2 className="mr-1 h-3 w-3" /> 成功
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">
            <Clock className="mr-1 h-3 w-3" /> 处理中
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
            <AlertCircle className="mr-1 h-3 w-3" /> 失败
          </Badge>
        )
    }
  }

  return (
    <div className="container max-w-6xl py-10">
      <div className="mb-10 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">订单查询</h1>
        </div>
        <p className="text-muted-foreground">
          查看您的订阅记录、交易历史和管理发票
        </p>
      </div>

      <Tabs defaultValue="orders" className="space-y-8">
        <TabsList>
          <TabsTrigger value="subscription">当前订阅</TabsTrigger>
          <TabsTrigger value="orders">交易记录</TabsTrigger>
          <TabsTrigger value="invoices">发票管理</TabsTrigger>
        </TabsList>

        {/* 当前订阅标签页 */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>订阅详情</CardTitle>
              <CardDescription>
                您当前的订阅方案和账单信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{subscription.plan}</h3>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "mt-1",
                        subscription.status === "active" ? "bg-green-50 text-green-700" : 
                        subscription.status === "trial" ? "bg-blue-50 text-blue-700" : 
                        "bg-gray-50 text-gray-700"
                      )}
                    >
                      {subscription.status === "active" ? "已激活" : 
                       subscription.status === "trial" ? "试用中" : "未激活"}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{formatAmount(subscription.amount)}</div>
                    <div className="text-sm text-muted-foreground">
                      {subscription.billingCycle === "monthly" ? "月付" : "年付"}
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">开始日期</div>
                    <div>{format(subscription.startDate, 'yyyy年MM月dd日')}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">下次付款日期</div>
                    <div>
                      {subscription.nextBillingDate 
                        ? format(subscription.nextBillingDate, 'yyyy年MM月dd日')
                        : "不适用"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">支付方式</div>
                    <div className="flex items-center">
                      {subscription.paymentMethod.type === "credit_card" ? (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          <span>**** {subscription.paymentMethod.last4}</span>
                        </>
                      ) : subscription.paymentMethod.type === "alipay" ? (
                        <span>支付宝</span>
                      ) : (
                        <span>微信支付</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button variant="outline">
                  <CreditCard className="mr-2 h-4 w-4" />
                  更改支付方式
                </Button>
                <Button variant="outline">
                  升级方案
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 交易记录标签页 */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>交易记录</CardTitle>
              <CardDescription>
                查看您的所有交易记录和支付历史
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* 搜索和筛选 */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索订单编号或描述"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有状态</SelectItem>
                      <SelectItem value="completed">成功</SelectItem>
                      <SelectItem value="pending">处理中</SelectItem>
                      <SelectItem value="failed">失败</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'yyyy年MM月dd日') : "选择日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* 已应用的筛选器 */}
              {(searchQuery || statusFilter !== "all" || date) && (
                <div className="flex items-center justify-between rounded-lg border border-dashed p-2">
                  <div className="text-sm text-muted-foreground">
                    已应用筛选条件 {searchQuery && <Badge variant="outline" className="ml-1">搜索</Badge>}
                    {statusFilter !== "all" && <Badge variant="outline" className="ml-1">状态</Badge>}
                    {date && <Badge variant="outline" className="ml-1">日期</Badge>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    清除筛选
                  </Button>
                </div>
              )}
              
              {/* 订单表格 */}
              {filteredOrders.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>订单编号</TableHead>
                        <TableHead>日期</TableHead>
                        <TableHead>描述</TableHead>
                        <TableHead>金额</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>{format(order.date, 'yyyy-MM-dd')}</TableCell>
                          <TableCell>{order.description}</TableCell>
                          <TableCell>{formatAmount(order.amount)}</TableCell>
                          <TableCell>{renderStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "发票申请提示",
                                  description: "请联系售后开具发票",
                                })
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              联系售后开票
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">无交易记录</h3>
                  <p className="text-sm text-muted-foreground">
                    没有找到符合条件的交易记录
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                共 {filteredOrders.length} 条记录
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  上一页
                </Button>
                <Button variant="outline" size="sm" disabled>
                  下一页
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 发票管理标签页 */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>发票管理</CardTitle>
              <CardDescription>
                请联系客服开具发票
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">请联系售后开票</h3>
                <p className="text-muted-foreground max-w-md">
                  目前系统暂不支持自助开票，如需开具发票，请联系我们的客户服务团队协助您处理。
                </p>
                <Button className="mt-6">
                  联系客服
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Billing