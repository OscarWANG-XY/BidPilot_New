// AgreementCheckbox.tsx
// 引入所需的UI组件和路由库
import { Checkbox } from "@/components/ui/checkbox"; // 复选框组件
import { Link } from "@tanstack/react-router"; // 路由链接组件，用于导航

// 定义 AgreementCheckbox 组件，接收以下属性：
// agreed: 当前复选框是否被选中
// onAgreedChange: 当复选框状态变化时的回调函数
export function AgreementCheckbox({
  agreed,
  onAgreedChange,
}: {
  agreed: boolean; // 复选框的选中状态
  onAgreedChange: (checked: boolean) => void; // 当复选框状态变化时的回调函数
}) {
  return (
    // 使用 div 容器包裹复选框和标签，设置 flex 布局，使内容水平排列，并设置间距为 2
    <div className="flex items-center space-x-2">
      {/* 使用 Checkbox 组件创建复选框 */}
      <Checkbox
        id="terms" // 复选框的唯一标识符
        checked={agreed} // 复选框的选中状态由 agreed 属性控制
        onCheckedChange={(checked) => onAgreedChange(checked as boolean)} // 当复选框状态变化时，调用 onAgreedChange 回调函数
      />
      {/* 使用 label 标签为复选框添加描述文本 */}
      <label htmlFor="terms" className="text-sm text-muted-foreground">
        我已阅读并同意 {/* 描述文本 */}
        {/* 使用 Link 组件创建用户协议链接 */}
        <Link
          to="/auth/service-term" // 链接的目标路由
          target="_blank" // 在新标签页中打开链接
          rel="noopener noreferrer" // 安全设置，防止新页面访问原页面的 window.opener 对象
          className="text-primary hover:underline" // 链接的样式
        >
          用户协议 {/* 链接的文本 */}
        </Link>
        与 {/* 描述文本 */}
        {/* 使用 Link 组件创建隐私政策链接 */}
        <Link
          to="/auth/privacy-policy" // 链接的目标路由
          target="_blank" // 在新标签页中打开链接
          rel="noopener noreferrer" // 安全设置，防止新页面访问原页面的 window.opener 对象
          className="text-primary hover:underline" // 链接的样式
        >
          隐私政策 {/* 链接的文本 */}
        </Link>
      </label>
    </div>
  );
}