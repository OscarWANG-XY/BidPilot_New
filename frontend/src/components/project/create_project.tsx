import { useState } from "react"
import { useNavigate } from '@tanstack/react-router'
import { Project } from "@/types/project"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FilePlus2 } from "lucide-react"
import { useProjectStore } from '@/stores/projectStore'

export function CreateProjectDialog() {
  const navigate = useNavigate()    // 使用useNavigate() Hook, 用于导航到其他页面
  const [open, setOpen] = useState(false)  // 使用useState(), 用于控制对话框的开关状态
  const setActiveProject = useProjectStore(state => state.setActiveProject) // 从项目管理状态中，获取setActiveProject方法
  const [formData, setFormData] = useState<Partial<Project>>({  //使用useState()管理表单数据
    name: "",
    type: "",
    companyName: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // 阻止表单的默认行为
    
    const projectId = "demo-" + Math.random().toString(36).substr(2, 9)
    
    // 创建新项目对象
    const newProject: Project = {
      id: projectId,
      name: formData.name || "",
      type: formData.type || "",
      companyName: formData.companyName || "",
      status: 'draft',
      createdAt: new Date().toISOString(),  // 创建时间
      updatedAt: new Date().toISOString(),   // 更新时间
      processes: {
        current: 0,
        steps: []
      },
      documents: [],
      members: []
    }
    
    // 保存到 store
    setActiveProject(newProject)
    console.log("Creating project:", newProject)

    // 跳转到项目详情页
    navigate({ to: '/tender_bid', params: { projectId } })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        {/* 侧边栏上，触发对话框的按钮 “新建项目”*/}
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 px-2">
          <FilePlus2 className="h-4 w-4 text-red-600" />
          <span className="text-lg text-red-600">新建项目</span>
        </Button>
      </DialogTrigger>

      {/* 点击“新建项目”按钮后，弹出的对话框内容 */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>创建新项目</DialogTitle>
          <DialogDescription>
            请填写新项目的基本信息
          </DialogDescription>
        </DialogHeader>

        {/* 表单内容，提交表单后，调用 handleSubmit 函数 */}
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
              <Select 
                onValueChange={(value) => setFormData({...formData, type: value})}
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择项目类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welfare">企业福利</SelectItem>
                  <SelectItem value="food">食材配送</SelectItem>
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
