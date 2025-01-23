// 引入所需的UI组件和路由库
import { Input } from "@/components/ui/input"; // 输入框组件
import { Label } from "@/components/ui/label"; // 标签组件
import { Link } from "@tanstack/react-router"; // 路由链接组件，用于导航

// 定义 PasswordLoginForm 组件，接收以下属性：
// email: 当前输入的邮箱或手机号
// password: 当前输入的密码
// isLoading: 是否正在加载中，用于禁用输入框
// onEmailChange: 当邮箱或手机号输入框内容变化时的回调函数
// onPasswordChange: 当密码输入框内容变化时的回调函数
export function PasswordLoginForm({
  email,
  password,
  isLoading,
  onEmailChange,
  onPasswordChange,
}: {
  email: string;
  password: string;
  isLoading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}) {
  return (
    // 使用 div 容器包裹整个表单，设置网格布局，并设置间距为 4
    <div className="grid gap-4">
      {/* 邮箱/手机号输入框部分 */}
      <div className="grid gap-2">
        {/* 使用 Label 组件为输入框添加标签 */}
        <Label htmlFor="emailOrPhone">手机号/邮箱</Label>
        {/* 使用 Input 组件创建输入框 */}
        <Input
          id="emailOrPhone" // 输入框的唯一标识符
          type="text" // 输入框类型为文本
          value={email} // 输入框的值为 email 属性
          onChange={(e) => onEmailChange(e.target.value)} // 当输入框内容变化时，调用 onEmailChange 回调函数
          placeholder="请输入手机号或邮箱" // 输入框的占位符文本
          disabled={isLoading} // 根据 isLoading 属性决定是否禁用输入框
          required // 输入框为必填项
        />
      </div>

      {/* 密码输入框部分 */}
      <div className="grid gap-2">
        {/* 使用 flex 布局将标签和忘记密码链接放在同一行，并设置间距和对齐方式 */}
        <div className="flex items-center justify-between">
          {/* 使用 Label 组件为密码输入框添加标签 */}
          <Label htmlFor="password">密码</Label>
          {/* 使用 Link 组件创建忘记密码的链接 */}
          <Link
            to="/auth/forgot-password" // 链接的目标路由
            className="text-sm text-muted-foreground hover:underline" // 链接的样式
          >
            忘记密码? {/* 链接的文本 */}
          </Link>
        </div>
        {/* 使用 Input 组件创建密码输入框 */}
        <Input
          id="password" // 输入框的唯一标识符
          type="password" // 输入框类型为密码
          value={password} // 输入框的值为 password 属性
          onChange={(e) => onPasswordChange(e.target.value)} // 当输入框内容变化时，调用 onPasswordChange 回调函数
          placeholder="请输入密码" // 输入框的占位符文本
          disabled={isLoading} // 根据 isLoading 属性决定是否禁用输入框
          required // 输入框为必填项
        />
      </div>
    </div>
  );
}