import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from "@/components/ui/button";

interface TipTapEditorProps {
  initialContent?: string;
  onSave: (content: string) => Promise<void>;
}

export function TipTapEditor({ initialContent = '', onSave }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-md p-4">
      <EditorContent editor={editor} />
      <div className="mt-4 flex justify-end">
        <Button
          onClick={() => onSave(editor.getHTML())}
        >
          保存修改
        </Button>
      </div>
    </div>
  );
}
