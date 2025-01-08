import { FC, ReactNode, useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Menu, X } from 'lucide-react'
import { Outlet } from 'react-router-dom'

interface LayoutProps {
  children?: ReactNode
}

export const Layout: FC<LayoutProps> = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-gray-100 flex">
      
      {/* 侧边栏 */}
      <div className={`fixed top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 z-20 
        ${isSidebarOpen ? 'w-64' : 'w-16'}`}>
        {/* 收缩按钮 - 调整按钮的样式和定位 */}
        <button 
          className="absolute right-4 top-6 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 z-30"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
        <Sidebar isOpen={isSidebarOpen} />
      </div>

      {/* 主内容区 */}
      <div className={`flex-1 transition-all duration-300  
        ${isSidebarOpen ? 'pl-64' : 'pl-16'}`}>
        <div className="sticky top-0 z-30">
          <Header />
        </div>
        <div className="p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <Outlet />
          </div>
        </div>
      </div>

    </div>
  )
} 