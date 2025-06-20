import { ProjectQueryParams, ProjectType } from '@/_types/projects_dt_stru/projects_interface';

interface ProjectFilterProps {
  queryParams: ProjectQueryParams;
  onQueryChange: (newParams: Partial<ProjectQueryParams>) => void;
}

export function ProjectFilter({ queryParams, onQueryChange }: ProjectFilterProps) {
  return (
    <div className="flex flex-wrap gap-3 p-4 bg-background">

      {/* 项目类型过滤器 */}
      <select
        className="h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        value={queryParams.projectType || ''}
        onChange={(e) => onQueryChange({ 
          projectType: e.target.value as ProjectType || undefined 
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
        className="h-9 w-[240px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        placeholder="搜索项目名称、编号、单位..."
        value={queryParams.search || ''}
        onChange={(e) => onQueryChange({ search: e.target.value || undefined })}
      />

      {/* 紧急项目过滤器 */}
      <label className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
        <input
          type="checkbox"
          checked={queryParams.starred || false}
          onChange={(e) => onQueryChange({ starred: e.target.checked || undefined })}
          className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
        />
        紧急项目
      </label>
    </div>
  );
}
