import { createFileRoute } from '@tanstack/react-router'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute('/auth/privacy-policy')({
  component: PrivacyPolicyComponent,
})

function PrivacyPolicyComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen py-6">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle>执智者（上海）科技有限公司 隐私政策</CardTitle>
          <p className="text-sm text-muted-foreground">生效日期：[日期]</p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-6 text-sm">
              <p>执智者（上海）科技有限公司（以下简称"我们"或"公司"）非常重视用户的隐私和个人信息保护。您在使用我们的产品和服务（以下简称"本服务"）时，我们可能会收集和使用您的相关信息。我们希望通过本《隐私政策》（以下简称"本政策"）向您说明我们在您使用本服务时如何收集、使用、存储、共享和保护您的个人信息，以及您如何管理您的个人信息。</p>

              <p>请您在使用本服务前，仔细阅读并理解本政策。您一旦注册、登录、使用或以任何方式使用本服务，即视为您已阅读并同意本政策的全部内容。</p>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold">一、我们如何收集和使用您的个人信息</h2>
                <p>1.1 我们仅会出于本政策所述的以下目的，收集和使用您的个人信息：</p>
                <ul className="list-disc list-inside">
                  <li>实现本服务的基本功能：例如，注册账号、登录、使用特定功能等。</li>
                  <li>改进和优化我们的服务：例如，分析用户行为、诊断服务问题等。</li>
                  <li>保障服务的安全性和稳定性：例如，身份验证、安全防范、诈骗监测等。</li>
                  <li>向您提供个性化服务：例如，推荐您可能感兴趣的内容、广告等。</li>
                  <li>履行法律法规规定的义务：例如，配合政府部门进行监管等。</li>
                </ul>
                <p>1.2 我们收集的个人信息类型可能包括：</p>
                <ul className="list-disc list-inside">
                  <li>个人基本资料：例如，姓名、性别、出生日期、电话号码、电子邮件地址等。</li>
                  <li>设备信息：例如，设备型号、操作系统版本、唯一设备标识符等。</li>
                  <li>服务日志信息：例如，IP地址、访问时间、浏览记录、操作记录等。</li>
                  <li>位置信息：例如，GPS位置、Wi-Fi接入点等。</li>
                  <li>其他信息：根据具体服务需要，收集的其他相关信息。</li>
                </ul>
                <p>1.3 我们承诺：</p>
                <ul className="list-disc list-inside">
                  <li>我们不会收集与提供服务无关的个人信息。</li>
                  <li>我们不会以任何方式出售您的个人信息。</li>
                  <li>我们仅在法律法规允许的范围内共享您的个人信息。</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold">二、我们如何使用 Cookie 和同类技术</h2>
                <p>2.1 我们可能会使用 Cookie 和同类技术来收集和存储您的信息，以便为您提供更加个性化的服务。</p>
                <p>2.2 您可以通过浏览器设置拒绝或管理 Cookie 和同类技术，但可能会影响您使用本服务的部分功能。</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold">三、我们如何共享、转让、公开披露您的个人信息</h2>
                <p>3.1 我们不会与任何公司、组织和个人共享您的个人信息，但以下情况除外：</p>
                <ul className="list-disc list-inside">
                  <li>获得您的明确同意或授权。</li>
                  <li>根据法律法规规定或政府部门的强制性要求。</li>
                  <li>为保护我们及他人的合法权益、财产或安全免遭损害而有必要提供。</li>
                  <li>与授权合作伙伴共享：仅为实现本政策中声明的目的，我们的某些服务将由授权合作伙伴提供。我们可能会与合作伙伴共享您的某些个人信息，以提供更好的客户服务和用户体验。我们仅会出于合法、正当、必要、特定、明确的目的共享您的个人信息，并且只会共享提供服务所必要的个人信息。我们的合作伙伴无权将共享的个人信息用于任何其他用途。</li>
                </ul>
                <p>3.2 我们不会将您的个人信息转让给任何公司、组织和个人，但以下情况除外：</p>
                <ul className="list-disc list-inside">
                  <li>获得您的明确同意或授权。</li>
                  <li>在涉及合并、收购、资产转让或类似交易时，如涉及到个人信息转让，我们会要求新的持有您个人信息的公司、组织继续受本政策的约束，否则我们将要求该公司、组织重新向您征求授权同意。</li>
                </ul>
                <p>3.3 我们仅会在以下情况下，公开披露您的个人信息：</p>
                <ul className="list-disc list-inside">
                  <li>获得您的明确同意或授权。</li>
                  <li>基于法律的披露：在法律、法律程序、诉讼或政府主管部门强制性要求的情况下，我们可能会公开披露您的个人信息。</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold">四、我们如何保护您的个人信息</h2>
                <p>4.1 我们已采取符合业界标准的安全防护措施保护您的个人信息，防止数据遭到未经授权访问、公开披露、使用、修改、损坏或丢失。</p>
                <p>4.2 我们会采取合理可行的措施，避免收集无关的个人信息。</p>
                <p>4.3 我们仅允许有必要知晓的人员访问您的个人信息，并为此设置了严格的访问权限控制和监控机制。</p>
                <p>4.4 我们会尽力保护您的个人信息，但请您理解，由于技术的限制以及可能存在的各种恶意手段，在互联网行业，即便竭尽所能加强安全措施，也不可能始终保证信息百分之百的安全。</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold">五、您的权利</h2>
                <p>5.1 您有权访问、更正、删除您的个人信息，以及注销您的账号。</p>
                <p>5.2 您有权拒绝或限制我们处理您的个人信息。</p>
                <p>5.3 您有权获取您的个人信息副本，以及将您的个人信息转移至其他服务提供者。</p>
                <p>5.4 您有权撤回您对本政策的同意。</p>
                <p>5.5 您可以通过以下方式行使您的权利：[请在此处提供用户行使权利的方式，例如：发送电子邮件至 [邮箱地址]，或通过应用内设置进行操作]。</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold">六、我们如何处理儿童的个人信息</h2>
                <p>6.1 我们的产品和服务主要面向成人。如果没有父母或监护人的同意，儿童不应创建自己的用户账户。</p>
                <p>6.2 对于经父母或监护人同意而收集的儿童个人信息，我们只会在法律法规允许、父母或监护人明确同意或者保护儿童所必要的情况下使用或公开披露此信息。</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold">七、本政策的修订</h2>
                <p>7.1 我们可能会根据业务调整、法律法规变化等原因适时修订本政策。</p>
                <p>7.2 未经您明确同意，我们不会削减您按照本政策所应享有的权利。</p>
                <p>7.3 对于重大变更，我们会通过网站公告、系统通知等方式告知您。</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold">八、如何联系我们</h2>
                <p>8.1 如果您对本政策有任何疑问、意见或建议，请通过以下方式联系我们：</p>
                <ul className="list-disc list-inside">
                  <li>电子邮件：[邮箱地址]</li>
                  <li>电话：[电话号码]</li>
                  <li>邮寄地址：[公司地址]</li>
                </ul>
              </section>

              <div className="pt-4">
                <p>请您再次确认已完全阅读、理解并同意本政策的全部内容。</p>
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
