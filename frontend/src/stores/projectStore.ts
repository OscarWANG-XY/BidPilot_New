/**
 * 项目状态管理存储
 * 使用 Zustand 实现的项目状态管理store
 * 
 * 实现原理:
 * - 使用 Zustand 创建一个状态管理store
 * - 维护当前选中的项目状态
 * - 提供更新和设置项目的方法
 * 
 * 数据结构:
 * - activeProject: 当前激活的项目对象，可以为null
 * - setActiveProject: 设置当前激活的项目的方法
 * - updateActiveProject: 更新当前激活项目部分属性的方法
 * 
 * @typedef {Object} ProjectStore - Store的类型定义
 * @property {Project | null} activeProject - 当前选中的项目对象
 * @property {Function} setActiveProject - 设置当前激活项目的方法
 * @property {Function} updateActiveProject - 更新项目属性的方法
 * 
 * 语法
 * interface ProjectStore {} 定义一个TypeScript接口，描述store的结构
 * interface 里的 ":" 是 TypeScript 的类型注解
 * 在useProjectStore() 中，":" 是属性赋值。
 * activeProject: Project | null // 定义了 activeProject属性， 是一个Project类型或null
 * setActiveProject: (project: Project) => void // 函数类型声明，完全替换,()=>void 表示接受一个project参数，无返回值
 * 
 * //set 是 Zustand 提供的状态更新函数
 * //箭头函数 () => ({}) 定义了 store 的初始状态和方法
 * // 这里的state是当前store的状态, 它包含了store中所有当前的值。
 * 
 */



import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Project } from '@/types/project'

interface ProjectStore {
  activeProject: Project | null
  setActiveProject: (project: Project) => void
  updateActiveProject: (updates: Partial<Project>) => void
}

export const useProjectStore = create<ProjectStore>()(
  devtools(        //devtools 是 Zustand 提供的中间件，用于调试和观察store的变化
    (set) => ({
      activeProject: null,
      setActiveProject: (project) => 
        set({ activeProject: project }, false, 'setActiveProject'),  
      updateActiveProject: (updates) => 
        set(
          (state) => ({
            activeProject: state.activeProject 
              ? { ...state.activeProject, ...updates }
              : null
          }),
          false,  // replace=false,这个是默认参数，代表着制定范围之外的参数不会重置。
          'updateActiveProject'  //添加了‘setActiveProject’作为action的名称,用于redux观察
        )
    }),
    {
      name: 'Project Store',  // 也是用于redux观察
      enabled: true,
      anonymousActionType: 'Project'
    }
  )
)
