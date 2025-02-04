import { useState, useEffect } from 'react'
import { createFileRoute, Outlet, useRouter,useLocation } from '@tanstack/react-router'
import { ProjectManager } from '@/components/projects/_ProjectManager'


export const Route = createFileRoute('/projects')({
  component: () => {
    const router = useRouter()
    const location = useLocation()
    const [key, setKey] = useState(0)

    // 监听路由变化
    useEffect(() => {
      console.log('路由变化:', location) // 添加日志查看是否触发
      // 路由变化时更新 key，强制重新渲染
      setKey(prev => prev + 1)
    }, [location])


    //router.state表示当前路由的抓过你太，包含当前路由信息
    //这些路由被存储在matches属性里（包含了多个层级的父和子级的路由）
    //some（）进行验证，是否有一个路由与模板路由匹配，如果是，返回true. 
    //用这种方式来确定 当前页 是否为 详情页？从而控制渲染。 
    const isDetailPage = router.state.matches.some(
      match => match.routeId === '/projects/$id'
    )

    return (
      <div key={key}>
        {!isDetailPage && <ProjectManager />}
        <Outlet />
      </div>
    )
  },
})