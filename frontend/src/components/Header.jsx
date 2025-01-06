import { useState } from 'react'
import { Bell, Search, User, ChevronDown, Settings, LogOut } from 'lucide-react'

export function Header() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
      {/* 搜索框 */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索文件、模板或内容..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:border-blue-500"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* 右侧工具栏 */}
      <div className="flex items-center space-x-4">
        {/* 通知按钮 */}
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
            3
          </span>
        </button>

        {/* 用户菜单 */}
        <div className="relative">
          <button
            className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium">管理员</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-30">
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>设置</span>
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                <LogOut className="w-4 h-4" />
                <span>退出登录</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 