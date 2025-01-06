import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Menu, X } from 'lucide-react'

export function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 侧边栏 */}
      <div className={`fixed top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 z-20 
        ${isSidebarOpen ? 'w-64' : 'w-15'}`}>
        {/* 收缩按钮 */}
        <button 
          className="absolute right-2 top-6 p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Sidebar isOpen={isSidebarOpen} />
      </div>

      {/* 主内容区 */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-50' : 'ml-10'}`}>
        <Header />
        <div className="p-6">
          <div className="bg-white rounded-lg shadow p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
} 