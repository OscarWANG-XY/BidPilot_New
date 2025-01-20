import { createLazyFileRoute } from '@tanstack/react-router'
import { TipTapEditor } from '@/components/shared/TipTapEditor'


export const Route = createLazyFileRoute('/company')({
  component: RouteComponent,
})

function RouteComponent() {
  const handleSave = async (content: string) => {
    // 这里可以添加保存内容的逻辑
    console.log('保存的内容:', content);
  };

  return <div>Have A try on TipTapEditor, 毛坯版!
    <TipTapEditor initialContent="Hello, World!" onSave={handleSave} />
  </div>
}
