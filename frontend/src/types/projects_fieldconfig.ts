import { Project, ProjectType, ProjectStage } from './projects_dt_stru';

// 字段值类型
export type FieldValueType = 
  | 'text'      // 文本输入
  | 'select'    // 下拉选择
  | 'date'      // 日期选择
  | 'textarea'  // 多行文本
  | 'boolean'   // 布尔值
  | 'readonly'  // 只读字段

// 字段配置接口
export interface FieldConfig {
  key: keyof Project;
  label: string;
  type: FieldValueType;
  required?: boolean;
  editable?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  validator?: (value: any) => boolean | string;
  group: 'basic' | 'status' | 'system';
}

// 枚举转换为选项
const enumToOptions = (enumObj: object) => 
  Object.entries(enumObj).map(([_key, value]) => ({
    value,
    label: value
  }));

// 项目字段配置
export const PROJECT_FIELDS: FieldConfig[] = [
  // 基本信息组
  {
    key: 'projectName',
    label: '项目名称',
    type: 'text',
    required: true,
    editable: true,
    group: 'basic',
    placeholder: '请输入项目名称',
    validator: (value) => value.length >= 2 || '项目名称至少2个字符'
  },
  {
    key: 'projectCode',
    label: '项目编号',
    type: 'readonly',
    required: true,
    editable: false,
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
    label: '招标单位',
    type: 'text',
    required: true,
    editable: true,
    group: 'basic'
  },
  {
    key: 'bidder',
    label: '投标单位',
    type: 'text',
    required: true,
    editable: true,
    group: 'basic'
  },
  {
    key: 'bidDeadline',
    label: '投标截止时间',
    type: 'date',
    required: true,
    editable: true,
    group: 'basic'
  },
  {
    key: 'isUrgent',
    label: '是否紧急',
    type: 'boolean',
    required: false,
    editable: true,
    group: 'basic'
  },

  // 状态信息组
  {
    key: 'currentStage',
    label: '当前阶段',
    type: 'select',
    required: true,
    editable: true,
    options: enumToOptions(ProjectStage),
    group: 'status'
  },

  // 系统信息组
  {
    key: 'projectId',
    label: '项目ID',
    type: 'readonly',
    editable: false,
    group: 'system'
  },
  {
    key: 'createTime',
    label: '创建时间',
    type: 'readonly',
    editable: false,
    group: 'system'
  },
  {
    key: 'lastUpdateTime',
    label: '最后更新时间',
    type: 'readonly',
    editable: false,
    group: 'system'
  },
  {
    key: 'creator',
    label: '创建人',
    type: 'readonly',
    editable: false,
    group: 'system'
  }
];

// 工具函数
export const getFieldsByGroup = (group: string) => 
  PROJECT_FIELDS.filter(field => field.group === group);

export const getEditableFields = () => 
  PROJECT_FIELDS.filter(field => field.editable);

export const getRequiredFields = () => 
  PROJECT_FIELDS.filter(field => field.required);

export const validateField = (field: FieldConfig, value: any): boolean | string => {
  if (field.required && (value === undefined || value === null || value === '')) {
    return `${field.label}不能为空`;
  }
  return field.validator ? field.validator(value) : true;
};

export const getFieldConfig = (key: keyof Project): FieldConfig | undefined => 
  PROJECT_FIELDS.find(field => field.key === key);