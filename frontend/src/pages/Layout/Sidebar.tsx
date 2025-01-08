import { FC } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Building2, Users, LucideIcon } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
}

interface MenuItem {
  title: string
  icon: LucideIcon
  path: string
}

export const Sidebar: FC<SidebarProps> = ({ isOpen }) => {
  const menuItems: MenuItem[] = [
    {
      title: '招投标管理',
      icon: FileText,
      path: '/tender-bid-management',
    },
    {
      title: '公司档案',
      icon: Building2,
      path: '/company',
    },
    {
      title: '用户管理',
      icon: Users,
      path: '/users',
    }
  ]

  return (
    <div className="py-7"> {/* 侧边栏的外部容器 */}
      {/* Logo 部分 */}
      <div className={`px-4 transition-all duration-300 
        ${isOpen ? 'mb-8 h-auto' : 'mb-4 h-[28px]'}`}> {/* 控制收缩时的高度和间距 */}
        <h1 className={`text-xl font-bold text-blue-600 transition-all duration-300 
          ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
          智能招投标系统
        </h1>
      </div>

      <nav>
        {menuItems.map((item) => (
          <div key={item.title} className="mb-4">
            <Link
              to={item.path}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50"
            >
              <item.icon className="w-5 h-5 min-w-[20px]" />
              <span className={`ml-2 transition-all duration-300 transform whitespace-nowrap
                ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
                {item.title}
              </span>
            </Link>
            {isOpen && (
              <div className="pl-8">
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}