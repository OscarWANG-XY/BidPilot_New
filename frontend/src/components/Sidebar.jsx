import { Link } from 'react-router-dom' // 导入 Link 组件用于路由导航
import { FileText, Building2, Users } from 'lucide-react' // 导入图标组件

// Sidebar 组件，接收 isOpen 属性以控制侧边栏的打开状态
export function Sidebar({ isOpen }) {
  // 定义菜单项，包括标题、图标和对应的路由路径
  const menuItems = [
    {
      title: '招投标管理', // 菜单项标题
      icon: FileText, // 菜单项图标
      path: '/tender-bid-management', // 菜单项对应的路由路径
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
      <div className="px-4 mb-10">
        {isOpen ? (
          <h1 className="text-xl font-bold text-blue-600">智能招投标系统</h1>
        ):(
          <div className="h-8"/>
        )} {/* 仅在侧边栏打开时显示 Logo */}
      </div>

      {/* 导航菜单 */}
      <nav>
        {menuItems.map((item) => ( // 遍历菜单项数组
          <div key={item.title} className="mb-4"> {/* 每个菜单项的容器 */}
            <Link
              to={item.path} // 点击链接时导航到对应的路由
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50" // 设置链接的样式
            >
              <item.icon className="w-5 h-5" /> {/* 显示菜单项图标 */}
              {isOpen && <h3 className="text-lg font-medium">{item.title}</h3>} {/* 仅在侧边栏打开时显示标题 */}
            </Link>
            {/* 可伸缩的子菜单（示例） */}
            {isOpen && (
              <div className="pl-8"> {/* 子菜单的容器，缩进 */}
                {/* 这里可以添加子菜单项 */}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}