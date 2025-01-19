import { FileRecord, FileType } from "@/types/files_dt_stru";  // 数据接口文件类型


//========================= FileHelpers.ts 是辅助函数的集合 ========================= 
// 1. 文件大小格式化 formatFileSize, 这在validateFile里引用。 
// 2. 文件验证 validateFile, 验证文件大小 和 文件格式。 
// 3. 预览相关的辅助函数 getPreviewTitle, isPreviewable。




// ----------------------------- 文件大小格式化 ----------------------------- 
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ------------------------文件验证模块 done check! ------------------------- 
//注意 toast功能 需要父组件以参数方式传入，因为Hooks只能在React函数内部直接使用，不能在普通函数中使用。
//函数组件以大写开头，而普通函数以小写开头
export const validateFile = (file: File, toast: any) => {

  const allowedTypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    toast({
      title: "不支持的文件类型",
      description: "请上传PDF、DOC或DOCX文件",
      variant: "destructive",
    });
    return
    //throw new Error("不支持的文件类型");
  }
  
  if (file.size > maxSize) {
    // 用toast函数显示'文件大小'错误信息 
    toast({
      title: "文件过大",
      description: "请选择小于10MB的文件",
      variant: "destructive",
    });
    return
    //throw new Error("文件过大");
  }
};

// --------------------------- 预览相关的辅助函数 done check! ----------------------------- 
export const getPreviewFileName = (file: FileRecord) => {
  return file.name || '文件预览';
};

// 文件类型是否支持预览，支持的类型有PDF和WORD
// 这里使用FileType枚举类型，而不是字符串类型， 与files_dt_stru.ts里的FileType枚举类型保持一致
export const isFileTypePreviewable = (fileType: FileType) => {
  const previewableTypes = [
    FileType.PDF,
    FileType.WORD,
  ];
  return previewableTypes.includes(fileType);
};
