import { ProjectQueryParams, ProjectStage, ProjectType } from '@/types/projects_dt_stru';

interface ProjectFilterProps {
  queryParams: ProjectQueryParams;
  onQueryChange: (newParams: Partial<ProjectQueryParams>) => void;
}

export function ProjectFilter({ queryParams, onQueryChange }: ProjectFilterProps) {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg shadow">
      {/* 项目状态过滤器 */}
      <select
        className="border rounded px-2 py-1"
        value={queryParams.current_stage || ''}
        onChange={(e) => onQueryChange({ 
          current_stage: e.target.value as ProjectStage || undefined 
        })}
      >
        <option value="">所有状态</option>
        {Object.values(ProjectStage).map(stage => (
          <option key={stage} value={stage}>
            {stage === 'DRAFT' ? '草稿' :
             stage === 'ANALYZING' ? '分析中' :
             stage === 'PENDING_CONFIRM' ? '待确认' :
             stage === 'WRITING' ? '编写中' :
             stage === 'REVIEWING' ? '审核中' :
             stage === 'REVISING' ? '修订中' :
             stage === 'COMPLETED' ? '已完成' :
             stage === 'CANCELLED' ? '已取消' : stage}
          </option>
        ))}
      </select>

      {/* 项目类型过滤器 */}
      <select
        className="border rounded px-2 py-1"
        value={queryParams.project_type || ''}
        onChange={(e) => onQueryChange({ 
          project_type: e.target.value as ProjectType || undefined 
        })}
      >
        <option value="">所有类型</option>
        {Object.values(ProjectType).map(type => (
          <option key={type} value={type}>
            {type === 'WELFARE' ? '企业福利' :
             type === 'FSD' ? '食材配送' :
             type === 'OTHER' ? '其他' : type}
          </option>
        ))}
      </select>

      {/* 搜索框 */}
      <input
        type="text"
        className="border rounded px-2 py-1 min-w-[200px]"
        placeholder="搜索项目名称、编号、单位..."
        value={queryParams.search || ''}
        onChange={(e) => onQueryChange({ search: e.target.value || undefined })}
      />

      {/* 紧急项目过滤器 */}
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={queryParams.is_urgent || false}
          onChange={(e) => onQueryChange({ is_urgent: e.target.checked || undefined })}
          className="mr-2"
        />
        紧急项目
      </label>
    </div>
  );
}
