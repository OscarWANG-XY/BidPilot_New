import { createFileRoute } from '@tanstack/react-router'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute('/auth/service-term')({
  component: ServiceTermComponent,
})

function ServiceTermComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen py-6">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle>执智者（上海）科技有限公司 用户协议</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-6 text-sm">
              <p>欢迎使用执智者（上海）科技有限公司（以下简称"我们"或"公司"）提供的产品和服务！</p>
              
              <p>请您在使用我们的产品和服务（以下简称"本服务"）前，仔细阅读并理解本《用户协议》（以下简称"本协议"）。您一旦注册、登录、使用或以任何方式使用本服务，即视为您已阅读并同意本协议的约束。</p>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold">一、协议范围</h2>
                <p>1.1 本协议是您与我们之间关于您使用本服务所订立的协议。</p>
                <p>1.2 本协议内容同时包括我们可能不断发布的关于本服务的相关协议、规则、声明、公告、政策等内容（以下简称"其他条款"）。上述内容一经正式发布，即为本协议不可分割的组成部分，您同样应当遵守。</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold">二、用户账号</h2>
                <p>2.1 您在使用本服务前可能需要注册一个账号。您承诺注册账号时提供的信息真实、准确、完整，并及时更新。</p>
                <p>2.2 您应妥善保管您的账号及密码，并对您账号下的所有行为承担法律责任。</p>
                <p>2.3 如您发现任何未经授权使用您账号或存在其他安全漏洞的情况，请立即通知我们。</p>
              </section>

              {/* 继续添加其他章节，格式类似 */}
              
              <section className="space-y-2">
                <h2 className="text-lg font-semibold">九、其他</h2>
                <p>9.1 本协议构成您与我们之间关于本服务的完整协议，取代您与我们之前就本服务达成的任何口头或书面协议。</p>
                <p>9.2 本协议任何条款被认定为无效或不可执行，不影响其他条款的效力。</p>
                <p>9.3 我们未行使或执行本协议任何权利或规定，不构成对前述权利或规定的放弃。</p>
              </section>

              <div className="pt-4">
                <p>请您再次确认已完全阅读、理解并同意本协议的所有条款。</p>
                <p className="mt-4">执智者（上海）科技有限公司</p>
                <p className="text-muted-foreground">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
