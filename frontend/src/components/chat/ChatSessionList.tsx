// components/chat/ChatSessionList.tsx
import { useNavigate } from '@tanstack/react-router';
import { ChatSession } from '@/types/chat_dt_stru';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { useChatSessions } from '@/hooks/useChat';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
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

interface ChatSessionListProps {
  sessions: ChatSession[];
  isLoading: boolean;
}

export function ChatSessionList({ sessions, isLoading }: ChatSessionListProps) {
  const navigate = useNavigate();
  const { createSession, deleteSession } = useChatSessions();

  // 创建新会话
  const handleCreateSession = async () => {
    console.log('[ChatSessionList] 正在创建新会话...');
    try {
      const newSession = await createSession();
      console.log('[ChatSessionList] 新会话创建成功:', newSession);
      navigate({ to: '/chat/$sessionId', params: { sessionId: newSession.id } });
    } catch (error) {
      console.error('[ChatSessionList] 创建会话失败:', error);
    }
  };

  // 处理会话点击
  const handleSessionClick = (sessionId: string) => {
    console.log('[ChatSessionList] 会话被点击:', sessionId);
    navigate({ to: '/chat/$sessionId', params: { sessionId } });
  };

  // 处理会话删除
  const handleDeleteSession = async (sessionId: string) => {
    console.log('[ChatSessionList] 正在删除会话:', sessionId);
    try {
      await deleteSession(sessionId);
      console.log('[ChatSessionList] 会话删除成功');
      navigate({ to: '/chat' });
    } catch (error) {
      console.error('[ChatSessionList] 删除会话失败:', error);
    }
  };

  console.log('[ChatSessionList] 正在渲染会话列表:', {
    会话数量: sessions.length,
    加载状态: isLoading
  });

  return (
    <div className="flex flex-col h-full"
    >
      {/* 新建会话按钮 */}
      <div className="p-4">
        <Button
          variant="outline"  // 轮廓样式
          className="w-full justify-start gap-2"  //宽度占满父元素，内容左对齐，内部元素间距8PX
          onClick={handleCreateSession}
        >
          <MessageSquarePlus className="h-4 w-4" //新建会话图标 16x
          /> 
          新建会话
        </Button>
      </div>

      {/* 会话列表 */}
      <ScrollArea className="flex-1" // 滚动条 在Flexbox布局种占据剩余空间
      > 
        <div className="space-y-0 px-4" 
        // space-y-0: 子元素垂直间距0px
        // px-4: 左右内边距16px，移除了上下内边距， 不能用p-4
        >

          {isLoading ? (
            // 加载状态, 放五个Skeleton组件进行占位
            Array.from({ length: 5 }).map((_, i) => (
              <SessionSkeleton key={i} />
            ))
          ) : sessions.length === 0 ? ( // 否则如果session为空，则...
            // 空状态
            <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
              <p>没有聊天会话</p>
              <p>点击上方按钮开始新的对话</p>
            </div>
          ) : (  //但loading结束，且session不为空，展示列表Item
            // 会话列表
            sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                onClick={() => handleSessionClick(session.id)}
                onDelete={() => handleDeleteSession(session.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// 会话项组件
function SessionItem({
  session,  // 输入参数
  onClick,  // 输入参数
  onDelete, // 输入参数
}: {
  session: ChatSession;  //输入当前会话数据
  onClick: () => void;   // 输入点击事件，点击处理函数，无返回值
  onDelete: () => void; // 输入删除事件，删除会话函数，无返回值
}) {

  // 获取最后一条消息，如不存在返回'没有消息'
  const lastMessage = session.lastMessage?.content || '没有消息'; 
  
  // '几个小时前/1天前' 使用了date-fns库
  const timeAgo = formatDistanceToNow(new Date(session.updatedAt), {
    addSuffix: true,  // 添加时间后缀，如 3分钟前
    locale: zhCN,   //中文格式
  });

  return (
    <div
      className="group flex items-center gap-3 rounded-lg p-3 hover:bg-accent cursor-pointer relative pr-12 w-[270px]"
      // group: 用于在子元素中应用样式变化
      // flex: 使用 Flexbox 布局
      // items-center: 子元素在交叉轴上居中对齐
      // gap-3: 子元素之间的间距为 0.75rem（12px）
      // rounded-lg: 设置圆角，使边角变得圆滑
      // border: 添加边框
      // p-3: 设置内边距为 0.75rem（12px）
      // hover:bg-accent: 鼠标悬停时，背景色变为强调色
      // cursor-pointer: 将鼠标指针样式设置为手型，表示该元素可点击
      // relative: 设置定位为相对定位，以便子元素可以使用绝对定位
      // pr-12: 设置右内边距为 3rem（48px），为删除按钮留出空间
      // w-full:改为w-[300px] 设置为固定宽度
      onClick={onClick}
    >
      <div className="flex-1 overflow-hidden space-y-1 min-w-0" // 
      // flex-1: 在 Flexbox 布局中占据剩余空间
      // overflow-hidden: 防止内容溢出
      // space-y-1: 子元素之间的垂直间距为 0.25rem（4px）
      >
        <div className="text-xs text-muted-foreground" // 
        // text-xs: 设置字体大小为小号
        // text-muted-foreground: 设置文本颜色为淡色
        >
          {timeAgo}
        </div>
        <p className="truncate text-sm" // 
        // truncate: 确保文本超出时显示省略号
        // text-sm: 设置字体大小为小号
        >
          {lastMessage}
        </p>
      </div>

      {/* 删除按钮调整为绝对定位 */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost" // 设置按钮样式为透明
            size="icon" // 设置按钮大小为图标大小
            className="hidden group-hover:flex h-8 w-8 absolute right-2" // 
            // hidden: 默认情况下隐藏按钮
            // group-hover:flex: 鼠标悬停时显示按钮
            // h-8: 设置高度为 2rem（32px）
            // w-8: 设置宽度为 2rem（32px）
            // absolute: 绝对定位
            // right-2: 设置右侧距离为 0.5rem（8px）
            onClick={(e) => e.stopPropagation()} // 阻止冒泡到父组件，父组件不会响应。
          >
            <Trash2 className="h-4 w-4" // 
            // h-4: 设置高度为 1rem（16px）
            // w-4: 设置宽度为 1rem（16px）
            />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除会话？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除该会话及其所有消息，此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// 加载骨架屏组件 （占位组件，提供视觉反馈）
function SessionSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3"
    // Flexbox布局，子元素居中对齐，子元素间距12px, 圆角， 边框， 内边距12px
    >
      <div className="flex-1 space-y-2" // flexbox布局占据剩余空间，子元素垂直间距8px
      >
        <Skeleton className="h-4 w-1/3" // 高度16px, 父元素宽度的1/3
        />
        <Skeleton className="h-4 w-2/3" // 高度16px, 父元素宽度的2/3
        />
      </div>
    </div>
  );
}