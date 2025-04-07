import { createFileRoute } from '@tanstack/react-router'
import MarkdownEditorTest from '@/components/MarkdownEditor/MD_test';

export const Route = createFileRoute('/playground/markdown_editor')({
  component: RouteComponent,
})

function RouteComponent() {
  return(
  <>
    <div>
        Hello "/playground/markdown_editor"!
    </div>
    <MarkdownEditorTest />
  </>

  )
}