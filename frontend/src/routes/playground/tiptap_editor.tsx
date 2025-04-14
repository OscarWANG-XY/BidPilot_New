import { createFileRoute } from '@tanstack/react-router'
import TiptapEditorTest from '@/components/TiptapEditor/TE_test';
import TiptapEditor from '@/components/TiptapEditor/TiptapEditor_pro';

export const Route = createFileRoute('/playground/tiptap_editor')({
  component: RouteComponent,
})

function RouteComponent() {
  return(
  <>
    <div>Hello "/playground/tiptap_editor"!</div>
    {/* <TiptapEditorTest /> */}
    <TiptapEditor />
  </>

  )
}
