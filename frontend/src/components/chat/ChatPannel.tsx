// components/chat/ChatPanel.tsx
import { useChat } from '@/hooks/useChat';
import { ChatMessage as MessageType } from '@/types/chat_dt_stru';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, Trash2, AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ChatPanelProps {
  sessionId: string;
}

export function ChatPanel({ sessionId }: ChatPanelProps) {
  const {
    messages,
    status,
    error,
    sendMessage,
    clearHistory,
    isLoading
  } = useChat(sessionId);

  console.log('[ChatPanel.tsx] 聊天面板状态:', { messages, status, error, isLoading });

  const [input, setInput] = useState('');  //管理用户
  const scrollRef = useRef<HTMLDivElement>(null);  // 用于控制滚到某个元素的位置。 
  const textareaRef = useRef<HTMLTextAreaElement>(null);  //用于访问和操作文本区域元素

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 处理发送消息
  const handleSend = async () => {
    console.log('[ChatPanel.tsx] 正在尝试发送消息:', input);
    if (!input.trim() || status === 'sending' || status === 'receiving') {
      console.log('[ChatPanel.tsx] 发送取消 - 输入为空或状态繁忙:', { input, status });
      return;
    }

    const currentInput = input.trim();
    setInput(''); // 提前清空输入框

    try {
      await sendMessage(input);
      console.log('[ChatPanel.tsx] 消息发送成功');

      // 重置输入框高度
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (e) {
      console.error('[ChatPanel.tsx] 发送消息失败:', e);
      setInput(currentInput); // 如果发送失败，恢复输入内容
    }
  };

  // 处理按键事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('[ChatPanel.tsx] 按键触发:', e.key, 'Shift键状态:', e.shiftKey);
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* 头部工具栏 */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h3 className="font-semibold">
          {isLoading ? '加载中...' : `会话 ${messages.length}`}
        </h3>
        
        {/* 清除历史按钮 */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认清除历史记录？</AlertDialogTitle>
              <AlertDialogDescription>
                此操作将清除当前会话的所有聊天记录，但会保留会话本身。此操作无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={clearHistory}>
                确认清除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* 消息列表 */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLast={index === messages.length - 1}
            />
          ))}
          
          {/* 错误提示 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* 加载状态 */}
          {(status === 'sending' || status === 'receiving') && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">
                {status === 'sending' ? '正在发送...' : '等待回复...'}
              </span>
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* 输入区域 */}
      <div className="p-4">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，按 Enter 发送，Shift + Enter 换行"
            className="min-h-[60px] resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || status === 'sending' || status === 'receiving'}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  );
}

// 消息组件
function ChatMessage({
  message,
  isLast,
}: {
  message: MessageType;
  isLast: boolean;
}) {
  console.log('[ChatPanel.tsx] 渲染消息:', { message, isLast });
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex gap-3 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* 头像 */}
      <div className={`
        h-8 w-8 rounded-full flex items-center justify-center text-white
        ${isUser ? 'bg-primary' : 'bg-secondary'}
      `}>
        {isUser ? 'U' : 'A'}
      </div>

      {/* 消息内容 */}
      <div className={`
        max-w-[80%] rounded-lg p-3
        ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}
      `}>
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}