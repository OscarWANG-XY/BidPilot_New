import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const TiptapEditor: React.FC = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: '<p>Hello World! 这是一个简单的Tiptap编辑器。</p>',
  })

  return (
    <div className="border border-gray-300 rounded-md p-4">
      <EditorContent editor={editor} className="prose max-w-none focus:outline-none" />
    </div>
  )
}

export default TiptapEditor