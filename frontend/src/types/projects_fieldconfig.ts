import { Project, ProjectType, ProjectStatus, ProjectPhase, ProjectDocumentType } from './projects_dt_stru'

// 字段值的类型
export type FieldValueType = 
  | 'text'      // 文本输入
  | 'select'    // 下拉选择
  | 'number'    // 数字输入
  | 'date'      // 日期选择
  | 'textarea'  // 多行文本
  | 'file'      // 文件上传
  | 'phases'    // 项目阶段
  | 'documents' // 项目文档
  | 'readonly'  // 只读字段

// 字段配置接口
export interface FieldConfig {
  key: keyof Project;           // 字段键名
  label: string;               // 字段显示标签
  type: FieldValueType;        // 字段值类型
  required?: boolean;          // 是否必填
  editable?: boolean;          // 是否可编辑
  options?: { value: string; label: string }[];  // 选择项（用于select类型）
  description?: string;        // 字段描述
  placeholder?: string;        // 输入提示
  validator?: (value: any) => boolean | string;  // 验证函数
  group: 'basic' | 'status' | 'phases' | 'documents' | 'system';  // 字段分组
}

// 将枚举转换为选项数组的辅助函数
const enumToOptions = (enumObj: object) => {

    // 在return里，key并未被用到，用_key标识这个是有意未使用的参数，这样不会出现problem的报错
  return Object.entries(enumObj).map(([_key, value]) => ({
    value: value,
    label: value
  }));
};

// 项目字段配置
export const PROJECT_FIELDS: FieldConfig[] = [
  // 基本信息组
  {
    key: 'name',
    label: '项目名称',
    type: 'text',
    required: true,
    editable: true,
    group: 'basic',
    placeholder: '请输入项目名称',
    validator: (value) => value.length >= 2 || '项目名称至少2个字符'
  },
  {
    key: 'code',
    label: '项目编号',
    type: 'text',
    required: true,
    editable: true,  // 暂时先改为editbal, 未来结合后端再改为系统自动生成
    group: 'basic'
  },
  {
    key: 'projectType',
    label: '项目类型',
    type: 'select',
    required: true,
    editable: true,
    options: enumToOptions(ProjectType),
    group: 'basic'
  },
  {
    key: 'tenderee',
    label: '招标方',
    type: 'text',
    required: true,
    editable: true,
    group: 'basic'
  },
  {
    key: 'bidder',
    label: '投标方',
    type: 'text',
    required: true,
    editable: true,
    group: 'basic'
  },
  {
    key: 'industry',
    label: '所属行业',
    type: 'text',
    editable: true,
    group: 'basic'
  },
  {
    key: 'expectedBudget',
    label: '预计预算',
    type: 'number',
    editable: true,
    group: 'basic',
    validator: (value) => value > 0 || '预算必须大于0'
  },
  {
    key: 'deadline',
    label: '截止时间',
    type: 'date',
    required: true,
    editable: true,
    group: 'basic'
  },

  // 状态信息组
  {
    key: 'status',
    label: '项目状态',
    type: 'select',
    required: true,
    editable: true,
    options: enumToOptions(ProjectStatus),
    group: 'status'
  },
  {
    key: 'currentPhase',
    label: '当前阶段',
    type: 'select',
    required: true,
    editable: true,
    options: enumToOptions(ProjectPhase),
    group: 'status'
  },
  {
    key: 'progress',
    label: '总体进度',
    type: 'number',
    editable: false,
    group: 'status'
  },

  // 阶段信息组
  {
    key: 'phases',
    label: '项目阶段',
    type: 'phases',
    editable: true,
    group: 'phases'
  },

  // 文档信息组
  {
    key: 'attachments',
    label: '项目文档',
    type: 'documents',
    editable: true,
    group: 'documents',
    options: enumToOptions(ProjectDocumentType),
    description: '支持上传的文档类型：招标文件、技术方案、价格文件等'
  },

  // 系统信息组
  {
    key: 'id',
    label: '项目ID',
    type: 'readonly',
    editable: false,
    group: 'system',
    description: '系统内部标识符'
  },
  {
    key: 'createTime',
    label: '创建时间',
    type: 'readonly',
    editable: false,
    group: 'system'
  },
  {
    key: 'updateTime',
    label: '更新时间',
    type: 'readonly',
    editable: false,
    group: 'system'
  },
  {
    key: 'createBy',
    label: '创建人',
    type: 'readonly',
    editable: false,
    group: 'system'
  },
  {
    key: 'lastModifiedBy',
    label: '最后修改人',
    type: 'readonly',
    editable: false,
    group: 'system'
  },
  {
    key: 'remarks',
    label: '备注',
    type: 'textarea',
    editable: true,
    group: 'basic',
    placeholder: '请输入项目备注信息'
  }
];

// 获取特定分组的字段配置
export const getFieldsByGroup = (group: string) => {
  return PROJECT_FIELDS.filter(field => field.group === group);
};

// 获取可编辑字段配置
export const getEditableFields = () => {
  return PROJECT_FIELDS.filter(field => field.editable);
};

// 获取必填字段配置
export const getRequiredFields = () => {
  return PROJECT_FIELDS.filter(field => field.required);
};

// 验证字段值
export const validateField = (field: FieldConfig, value: any): boolean | string => {
  if (field.required && (value === undefined || value === null || value === '')) {
    return `${field.label}不能为空`;
  }
  
  if (field.validator && value !== undefined && value !== null) {
    return field.validator(value);
  }

  return true;
};

// 添加一个类型检查函数来使用 key
export const getFieldConfig = (key: keyof Project): FieldConfig | undefined => {
  return PROJECT_FIELDS.find(field => field.key === key);
};
