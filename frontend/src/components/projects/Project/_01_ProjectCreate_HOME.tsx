import { useState } from "react"  // 引入React自带的useState钩子，用于管理组件的状态
import { useNavigate } from '@tanstack/react-router' // 用于项目创建后，跳转到项目详情页
import { ProjectType } from "@/_types/projects_dt_stru/projects_interface" // 引入自定义的数据类型
import { Button } from "@/components/ui/button"  // 使用shadcn的 按钮组件 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"  // 使用shadcn的 对话框组件
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"  // 使用shadcn的 下拉菜单组件 
import { Input } from "@/components/ui/input"  // 使用shadcn的 输入框组件
import { Label } from "@/components/ui/label"  // 使用shadcn的 标签组件
import { FilePlus2 } from "lucide-react"  // 使用lucide-react的图标
import { useProjects } from '@/_hooks/useProjects/useProjects'  // 使用自定义的 项目管理状态


// ================================ 创建项目对话框组件 ============================================ 
export function CreateProjectDialog() {
  
  // 使用useNavigate() Hook, 用于导航到其他页面
  const navigate = useNavigate()    
  // 添加 useProjects hook
  const { createProject } = useProjects()
  

  // 使用useState(), 用于控制对话框的开关状态
  const [open, setOpen] = useState(false)  

  // 添加表单数据状态
  const [formData, setFormData] = useState({
    name: '',
    type: ProjectType.OTHER,
    companyName: ''
  })

  // ----------------------------- 表单提交功能模块 --------------------------------- 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // 阻止表单的默认行为
    
    console.log('[ProjectCreate.tsx] 录入的formData:', formData)

    try {

      // 调用项目的HOOK文件useProjects里的createProject方法创建项目。
      // 该方法使用的是.mutateAsyn, 所以可以做异步等待，如下等待项目操作完成才执行下一步
      // creatProject使用的是CreateProjectRequest的数据接口，这个接口还有很多字段，
      // 其他字段被改成了可选，用在之后过程中自动填补。 否则这里需要输入，不然会报错。
      const result = await createProject({
        projectName: formData.name as string,
        projectType: formData.type as ProjectType,  // 这里强行将formData.type转换为ProjectType类型
        tenderee: formData.companyName as string,
        // 其他必要字段在后续步骤中补充
      })
      

      console.log('2. 创建项目返回的的result:', result)

      // 关闭对话框
      setOpen(false)
      
      // 重置表单
      setFormData({
        name: '',
        type: ProjectType.OTHER,
        companyName: ''
      })
      
      // 如果创建成功，跳转到项目详情页
      // 使用时，需要已经创建路由，tanstack的路由的创建方式很简单：直接在routes目录下新建文件。
      // 对于根据项目编号动态的路由，routes下新建的文件名可以为：如：projects.$projectId.tsx
      // 然后格式就是如下方式。
      if (result?.id) {
        navigate({ 
          to: '/projects/$projectId/tender-analysis', 
          params: { projectId: result.id.toString() } })
      }
    } catch (error) {
      console.error('创建项目失败:', error)
      // 这里可以添加错误提示
    }
  }

  // ----------------------------- 渲染组件 --------------------------------- 
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* 侧边栏上，触发对话框的按钮 “新建项目”*/}
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="lg"
          className="mt-8 px-8 py-4 text-lg font-semibold bg-transparent text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <FilePlus2 className="h-5 w-5 mr-2" />
          创建新项目
        </Button>
      </DialogTrigger>

      {/* 点击“新建项目”按钮后，弹出的表单对话框  */}
      <DialogContent className="sm:max-w-[425px]">
        {/* -----------------对话框的头部，标题和描述 ----------------- */}
        <DialogHeader>
          <DialogTitle>创建新项目</DialogTitle>
          <DialogDescription>
            请填写新项目的基本信息
          </DialogDescription>
        </DialogHeader>

        {/* ----------表单主题内容填写，提交表单后，调用 handleSubmit 函数 */}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="projectName" className="text-right">
                项目名称
              </Label>
              <Input
                id="projectName"
                className="col-span-3"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="projectType" className="text-right">
                项目类型
              </Label>
              {/* 定义了select的type的值，必须是ProjectType, 与Project的数据接口对齐*/}
              <Select 
                onValueChange={(value) => setFormData({...formData, type: value as ProjectType})}
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择项目类型" />
                </SelectTrigger>
                <SelectContent>
                  {/*SelectedItem的value需要和ProjectType的枚举对齐*/}
                  <SelectItem value="WELFARE">企业福利</SelectItem>
                  <SelectItem value="FSD">食材配送</SelectItem>
                  <SelectItem value="OTHER">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="companyName" className="text-right">
                招标单位
              </Label>
              <Input
                id="companyName"
                className="col-span-3"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                required
              />
            </div>
          </div>
          {/* --------对话框的底部，取消和确认按钮 -------- */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit">确认创建</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
