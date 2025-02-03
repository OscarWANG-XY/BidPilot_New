import { useState, useEffect } from 'react'    // 引入react的useState和useEffect
import { useProjects } from '@/hooks/useProjects'  // 引入useProjects HOOK
import { useToast } from '@/hooks/use-toast'  // 引入useToast HOOK
import { Project } from '@/types/projects_dt_stru'  // 引入项目数据类型
import { PROJECT_FIELDS, getFieldsByGroup, validateField } from '@/types/projects_fieldconfig'
import { Button } from "@/components/ui/button"  // 引入UI组件
import { Input } from "@/components/ui/input"  // 引入UI组件
import { Textarea } from "@/components/ui/textarea" // 新增
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"  // 引入UI组件
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"  // 引入UI组件
import { Edit2, Save, X } from 'lucide-react'  // 图标
import { ScrollArea } from "@/components/ui/scroll-area"  // 添加导入




// 项目详情组件的props
interface ProjectDetailProps {
  projectId: string
  onClose: () => void
}

//=============================== 项目详情组件  ===============================
export function ProjectDetail({ projectId, onClose }: ProjectDetailProps) {

  // 引入HOOKS 功能  
  const { toast } = useToast()
  const { singleProjectQuery, updateProject } = useProjects()
  const { data: project, isLoading, error } = singleProjectQuery(Number(projectId))

  // 定义 编辑和项目 状态
  const [isEditing, setIsEditing] = useState(false)
  const [editedProject, setEditedProject] = useState<Project | undefined>(undefined)



  // ----------------- 项目编辑状态的管理逻辑 -----------------------
  // 当 project 数据加载完成后，更新 editedProject
  useEffect(() => {
    if (project) {
      setEditedProject(project)
    }
  }, [project])

  // 处理编辑状态切换
  const handleEditToggle = () => {
    if (isEditing) {
      // 取消编辑时恢复原始数据
      setEditedProject(project)
    }
    setIsEditing(!isEditing)
  }

  // 修复类型错误的 handleFieldChange
  const handleFieldChange = (field: keyof Project, value: any) => {
    setEditedProject(prev => {
      if (!prev) return prev
      
      return {
        ...prev,
        [field]: value
      } as Project // 使用类型断言确保返回类型符合 Project
    })
  }

  // 渲染单个字段的函数
  const renderField = (fieldConfig: typeof PROJECT_FIELDS[0]) => {
    const value = editedProject?.[fieldConfig.key]
    
    // 如果字段不可编辑或不在编辑状态，显示只读值
    if (!fieldConfig.editable || !isEditing) {
      return (
        <div key={fieldConfig.key} className="space-y-2">
          <label className="text-sm font-bold">{fieldConfig.label}{fieldConfig.required && "（必填）"}</label>
          <p>{value as string}</p>
        </div>
      )
    }

    // 根据字段类型渲染不同的编辑组件
    switch (fieldConfig.type) {
      case 'select':
        return (
          <div key={fieldConfig.key} className="space-y-2">
            <label className="text-sm font-bold">{fieldConfig.label}{fieldConfig.required && "（必填）"}</label>
            <Select
              value={value as string}
              defaultValue={value as string}
              onValueChange={(newValue) => handleFieldChange(fieldConfig.key, newValue)}
            >
              <SelectTrigger>
                <SelectValue placeholder={fieldConfig.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {fieldConfig.options?.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'textarea':
        return (
          <div key={fieldConfig.key} className="space-y-2">
            <label className="text-sm font-bold">{fieldConfig.label}{fieldConfig.required && "（必填）"}</label>
            <Textarea
              value={value as string}
              placeholder={fieldConfig.placeholder}
              onChange={(e) => handleFieldChange(fieldConfig.key, e.target.value)}
            />
          </div>
        )

      case 'number':
        return (
          <div key={fieldConfig.key} className="space-y-2">
            <label className="text-sm font-bold">{fieldConfig.label}{fieldConfig.required && "（必填）"}</label>
            <Input
              type="number"
              value={value as number}
              placeholder={fieldConfig.placeholder}
              onChange={(e) => handleFieldChange(fieldConfig.key, Number(e.target.value))}
            />
          </div>
        )

      case 'date':
        return (
          <div key={fieldConfig.key} className="space-y-2">
            <label className="text-sm font-bold">{fieldConfig.label}{fieldConfig.required && "（必填）"}</label>
            <Input
              type="date"
              value={value ? new Date(value as Date).toISOString().split('T')[0] : ''}
              onChange={(e) => handleFieldChange(fieldConfig.key, new Date(e.target.value))}
            />
          </div>
        )

      case 'phases':
        return (
          <div key={fieldConfig.key} className="space-y-2">
            <label className="text-sm font-bold">{fieldConfig.label}{fieldConfig.required && "（必填）"}</label>
            {/* 这里需要实现专门的阶段编辑组件 */}
            <p>阶段编辑器组件（待实现）</p>
          </div>
        )

      case 'documents':
        return (
          <div key={fieldConfig.key} className="space-y-2">
            <label className="text-sm font-bold">{fieldConfig.label}{fieldConfig.required && "（必填）"}</label>
            {/* 这里需要实现专门的文档管理组件 */}
            <p>文档管理组件（待实现）</p>
          </div>
        )

      // 默认文本输入
      default:
        return (
          <div key={fieldConfig.key} className="space-y-2">
            <label className="text-sm font-bold">{fieldConfig.label}{fieldConfig.required && "（必填）"}</label>
            <Input
              value={value as string}
              placeholder={fieldConfig.placeholder}
              onChange={(e) => handleFieldChange(fieldConfig.key, e.target.value)}
            />
          </div>
        )
    }
  }

  // 验证所有必填字段
  const validateFields = () => {
    for (const field of PROJECT_FIELDS) {
      const value = editedProject?.[field.key]
      const validationResult = validateField(field, value)
      if (validationResult !== true) {
        toast({
          title: "验证失败",
          description: validationResult as string,
          variant: "destructive"
        })
        return false
      }
    }
    return true
  }

  // 更新保存处理函数
  const handleSave = async () => {
    if (!editedProject || !validateFields()) return

    try {
      await updateProject({
        project_id: projectId,
        project_data: editedProject
      })
      toast({
        title: "更新成功",
        description: "项目信息已更新"
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "更新失败",
        description: "保存项目信息时出错",
        variant: "destructive"
      })
    }
  }

  // ---------------------------- 组件渲染 ----------------------------
  if (isLoading) return <div>加载中...</div>
  if (error) return <div>加载失败: {error.message}</div>
  if (!project) return <div>项目不存在</div>

  return (
    <div className="space-y-4">
      {/* 标题和按钮固定在顶部 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">项目详情</h2>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} variant="default">
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
              <Button onClick={handleEditToggle} variant="ghost">
                <X className="mr-2 h-4 w-4" />
                取消
              </Button>
            </>
          ) : (
            <Button onClick={handleEditToggle}>
              <Edit2 className="mr-2 h-4 w-4" />
              编辑
            </Button>
          )}
        </div>
      </div>

      {/* 使用 ScrollArea 包裹内容部分 */}
      <ScrollArea className="h-[calc(100vh-12rem)] px-1">
        <div className="grid gap-4 md:grid-cols-2">
          {/* 基本信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>项目的基本信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFieldsByGroup('basic').map(renderField)}
              </div>
            </CardContent>
          </Card>

          {/* 项目状态卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>项目状态</CardTitle>
              <CardDescription>项目当前状态和进度</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFieldsByGroup('status').map(renderField)}
              </div>
            </CardContent>
          </Card>

          {/* 阶段信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>项目阶段</CardTitle>
              <CardDescription>项目阶段管理</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFieldsByGroup('phases').map(renderField)}
              </div>
            </CardContent>
          </Card>

          {/* 文档信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>项目文档</CardTitle>
              <CardDescription>项目相关文档管理</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFieldsByGroup('documents').map(renderField)}
              </div>
            </CardContent>
          </Card>

          {/* 系统信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>系统信息</CardTitle>
              <CardDescription>系统记录的信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFieldsByGroup('system').map(renderField)}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
