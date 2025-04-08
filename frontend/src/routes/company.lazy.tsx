import { createLazyFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/company')({
  component: RouteComponent,
})

function RouteComponent() {
  // You can replace these with actual values from your application context,
  // URL parameters, or state management system

  return (
    <div className="p-4"> 
      <h1 className="text-2xl font-bold mb-4">Company Task Management</h1>

      <Link
        to="/playground/markdown_editor"
        className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Go to Markdown Editor
      </Link>

      <br />

      <Link
        to="/playground/tiptap_editor"
        className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Go to Tiptap Editor
      </Link>

      <br />

      <Link
        to="/playground/task"
        className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Go to Task
      </Link>



    </div>
  )
}
