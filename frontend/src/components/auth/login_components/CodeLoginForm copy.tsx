// CodeLoginForm.tsx
// 引入所需的UI组件
import { Input } from "@/components/ui/input"; // 输入框组件
import { Label } from "@/components/ui/label"; // 标签组件
import { Button } from "@/components/ui/button"; // 按钮组件

// 定义 CodeLoginForm 组件，接收以下属性：
// phone: 当前输入的手机号
// verificationCode: 当前输入的验证码
// isLoading: 是否正在加载中，用于禁用输入框和按钮
// onPhoneChange: 当手机号输入框内容变化时的回调函数
// onCodeChange: 当验证码输入框内容变化时的回调函数
// onSendCode: 当点击“发送验证码”按钮时的回调函数
export function CodeLoginForm({
  phone,
  verificationCode,
  isLoading,
  onPhoneChange,
  onCodeChange,
  onSendCode,
}: {
  phone: string;
  verificationCode: string;
  isLoading: boolean;
  onPhoneChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onSendCode: () => void;
}) {
  return (
    // 使用 div 容器包裹整个表单，设置网格布局，并设置间距为 4
    <div className="grid gap-4">
      {/* 手机号输入框部分 */}
      <div className="grid gap-2">
        {/* 使用 Label 组件为手机号输入框添加标签 */}
        <Label htmlFor="phone">手机号</Label>
        {/* 使用 flex 布局将输入框放在一行，并设置间距为 2 */}
        <div className="flex gap-2">
          {/* 使用 Input 组件创建手机号输入框 */}
          <Input
            id="phone" // 输入框的唯一标识符
            type="tel" // 输入框类型为电话
            value={phone} // 输入框的值为 phone 属性
            onChange={(e) => onPhoneChange(e.target.value)} // 当输入框内容变化时，调用 onPhoneChange 回调函数
            placeholder="请输入手机号" // 输入框的占位符文本
            disabled={isLoading} // 根据 isLoading 属性决定是否禁用输入框
            required // 输入框为必填项
          />
        </div>
      </div>

      {/* 验证码输入框部分 */}
      <div className="grid gap-2">
        {/* 使用 Label 组件为验证码输入框添加标签 */}
        <Label htmlFor="code">验证码</Label>
        {/* 使用 flex 布局将验证码输入框和发送验证码按钮放在一行，并设置间距为 2 */}
        <div className="flex gap-2">
          {/* 使用 Input 组件创建验证码输入框 */}
          <Input
            id="code" // 输入框的唯一标识符
            value={verificationCode} // 输入框的值为 verificationCode 属性
            onChange={(e) => onCodeChange(e.target.value)} // 当输入框内容变化时，调用 onCodeChange 回调函数
            placeholder="请输入验证码" // 输入框的占位符文本
            disabled={isLoading} // 根据 isLoading 属性决定是否禁用输入框
            required // 输入框为必填项
          />
          {/* 使用 Button 组件创建发送验证码按钮 */}
          <Button
            type="button" // 按钮类型为普通按钮
            variant="outline" // 按钮样式为轮廓样式
            onClick={onSendCode} // 当按钮被点击时，调用 onSendCode 回调函数
            disabled={isLoading} // 根据 isLoading 属性决定是否禁用按钮
          >
            发送验证码 {/* 按钮的文本 */}
          </Button>
        </div>
      </div>
    </div>
  );
}