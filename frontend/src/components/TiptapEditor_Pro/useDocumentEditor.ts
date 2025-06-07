import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/_hooks/use-toast';
import { debounce } from 'lodash';
import { useDocuments, DocumentType } from '../../_hooks/useStructuringAgent.ts/useDocuments';
import { UpdateDocumentRequest } from '@/_api/structuring_agent_api/documents_api';

// ========================= 类型定义 =========================
interface DocumentDraft {
  content: any; // TiptapJSON 格式
  timestamp: number;
  version?: string;
}

interface UseDocumentEditorOptions {
  autoSaveInterval?: number;
  enableDraft?: boolean;
  enableAutoSave?: boolean;
  autoSaveDelay?: number;
  onContentChange?: (content: any) => void; // TiptapJSON 格式
  onSave?: (content: any) => void;
  onError?: (error: Error, operation: 'save' | 'load' | 'draft') => void;
}

interface DocumentEditorState {
  // 数据状态
  content: any; // TiptapJSON 格式
  originalContent: any;
  
  // 编辑状态
  isDirty: boolean;
  hasDraft: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isAutoSaving: boolean;
  
  // 错误状态
  error: Error | null;
  saveError: Error | null;
  
  // 版本冲突
  hasConflict: boolean;
  serverVersion?: string;
  
  // 时间戳
  lastSavedAt?: Date;
  lastModifiedAt?: Date;
}

interface DocumentEditorActions {
  // 内容操作（简化）
  updateContent: (content: any) => void; // 只保留核心的内容更新
  
  // 保存操作
  save: () => Promise<void>;
  saveAs: (content: any) => Promise<void>;
  
  // 草稿操作
  saveDraft: () => void;
  loadDraft: () => void;
  clearDraft: () => void;
  
  // 重置操作
  reset: () => void;
  resetToServer: () => void;
  
  // 冲突处理
  resolveConflict: (useLocal: boolean) => void;
}

// ========================= 工具函数 =========================
const isContentEqual = (content1: any, content2: any): boolean => {
  // 比较 TiptapJSON 内容是否相等
  if (!content1 && !content2) return true;
  if (!content1 || !content2) return false;
  return JSON.stringify(content1) === JSON.stringify(content2);
};

// ========================= 主要 Hook =========================
export const useDocumentEditor = (
  projectId: string,
  docType: DocumentType,
  options: UseDocumentEditorOptions = {}
): DocumentEditorState & DocumentEditorActions => {
  const {
    autoSaveInterval = 1000,
    enableDraft = true,
    enableAutoSave = false,
    autoSaveDelay = 5000,
    onContentChange,
    onSave,
    onError
  } = options;

  // ========================= 依赖 Hooks =========================
  const { toast } = useToast();
  
  // 直接使用新的useDocuments hook
  const documentsResult = useDocuments({
    projectId,
    docType,
    queryOptions: {
      enabled: !!projectId,
      staleTime: docType === 'final-document' ? 5 * 60 * 1000 : 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutationOptions: {
      onSuccess: () => {
        setLastSavedAt(new Date());
        setIsSaving(false);
        setIsAutoSaving(false);
        setSaveError(null);
        onSave?.(editContent);
        toast({
          title: '保存成功',
          description: '文档已保存到服务器',
        });
      },
      onError: (error) => {
        setIsSaving(false);
        setIsAutoSaving(false);
        setSaveError(error as Error);
        onError?.(error as Error, 'save');
        toast({
          title: '保存失败',
          description: '文档保存失败',
        });
      }
    }
  });

  // 获取当前文档查询和mutation
  const documentQuery = documentsResult.currentDocumentQuery;
  console.log('🐛 documentQuery:', documentQuery);
  console.log('🐛 documentQuery的结果:', documentQuery.data?.document?JSON.stringify(documentQuery.data?.document).slice(0,300):'null');

  const updateMutation = docType === 'final-document' ? documentsResult.updateFinalDocumentMutation : null;

  // ========================= 状态管理（简化）=========================
  const [editContent, setEditContent] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date>();
  const [lastModifiedAt, setLastModifiedAt] = useState<Date>();

  // ========================= 草稿工具函数 =========================
  const getDraftKey = useCallback((projectId: string, docType: string) => {
    return `document-draft-${projectId}-${docType}`;
  }, []);

  const saveDraftToStorage = useCallback((content: any) => {
    if (!enableDraft) return;
    
    try {
      const draft: DocumentDraft = {
        content,
        timestamp: Date.now(),
        version: documentQuery.data?.version
      };
      localStorage.setItem(getDraftKey(projectId, docType), JSON.stringify(draft));
      setHasDraft(true);
    } catch (error) {
      console.warn('Failed to save draft:', error);
      onError?.(error as Error, 'draft');
    }
  }, [enableDraft, getDraftKey, projectId, docType, documentQuery.data?.version, onError]);

  const loadDraftFromStorage = useCallback((): DocumentDraft | null => {
    if (!enableDraft) return null;
    
    try {
      const draftStr = localStorage.getItem(getDraftKey(projectId, docType));
      if (!draftStr) return null;
      
      const draft: DocumentDraft = JSON.parse(draftStr);
      setHasDraft(true);
      return draft;
    } catch (error) {
      console.warn('Failed to load draft:', error);
      onError?.(error as Error, 'draft');
      return null;
    }
  }, [enableDraft, getDraftKey, projectId, docType, onError]);

  const clearDraftFromStorage = useCallback(() => {
    if (!enableDraft) return;
    
    try {
      localStorage.removeItem(getDraftKey(projectId, docType));
      setHasDraft(false);
    } catch (error) {
      console.warn('Failed to clear draft:', error);
    }
  }, [enableDraft, getDraftKey, projectId, docType]);

  // ========================= 防抖保存 =========================
  // 防抖使用了lodash, 内部使用了setTimeout实现了定时器机制,所以后面得添加清理函数. 
  const debouncedSaveDraft = useMemo(
    () => debounce((content: any) => {
      saveDraftToStorage(content);
    }, autoSaveInterval), //延迟时间autoSaveInterval毫秒后, 执行saveDraftToStorage 
    [saveDraftToStorage, autoSaveInterval]
  );

  const debouncedAutoSave = useMemo(
    () => debounce(async (content: any) => {
      if (!enableAutoSave || !updateMutation || docType !== 'final-document') return;
      
      try {
        setIsAutoSaving(true);
        const request: UpdateDocumentRequest = {
          editedDocument: content // ✅ 直接传递 TiptapJSON 对象
        };
        await updateMutation.mutateAsync(request);
        clearDraftFromStorage();
      } catch (error) {
        console.warn('Auto save failed:', error);
      }
    }, autoSaveDelay),
    [enableAutoSave, updateMutation, docType, autoSaveDelay, clearDraftFromStorage]
  );

  // ========================= 初始化逻辑 (要用到loadDraftFromStorage)=========================
  // 首次挂载时：documentQuery.data 会从 undefined 变成有值 → 执行
  // 如果 isDirty 状态变化 → 重新执行
  // 如果 loadDraftFromStorage 的引用变化（一般不会）→ 重新执行
  useEffect(() => {
    if (documentQuery.data && !isDirty) {
      // ✅ 假设服务器直接返回 TiptapJSON 对象
      const serverContent = documentQuery.data.document;
      const draft = loadDraftFromStorage();
      //如果存在草稿,且草稿与服务器内容不一致
      if (draft && !isContentEqual(draft.content, serverContent)) {
        // 检查版本冲突
        if (draft.version && draft.version !== documentQuery.data.version) {
          setHasConflict(true); // 版本冲突
        }
        //则使用本地草稿
        setEditContent(draft.content);
        console.log('🐛 初始化, editContent取值draft.content')
        setHasDraft(true); // 存在草稿
      
      //否则, 不存在草稿,或者草稿和服务器内容一致时
      } else {
        //取值服务器内容
        setEditContent(serverContent);
        console.log('🐛 初始化, editContent取值serverContent')
        setHasDraft(false); // 没有草稿
      }
      console.log('🐛 serverContent初始化:', serverContent?JSON.stringify(serverContent).slice(0,300):'null');
      console.log('🐛 hasconflict初始化:', hasConflict);
      console.log('🐛 hasDraft初始化:', hasDraft);
      console.log('🐛 editContent初始化:', editContent?JSON.stringify(editContent).slice(0,300):'null');
      

    }
  }, [documentQuery.data, isDirty, loadDraftFromStorage]);

  // ========================= 内容操作（简化）=========================
  const updateContent = useCallback((newContent: any) => {
    setEditContent(newContent);
    
    const originalContent = documentQuery.data?.document;
    setIsDirty(!isContentEqual(newContent, originalContent));
    setLastModifiedAt(new Date());
    setSaveError(null);
    
    // 保存草稿
    debouncedSaveDraft(newContent);
    
    // 自动保存到服务器
    if (enableAutoSave) {
      debouncedAutoSave(newContent);
    }
    
    onContentChange?.(newContent);
  }, [documentQuery.data?.document, debouncedSaveDraft, debouncedAutoSave, enableAutoSave, onContentChange]);

  // ========================= 保存操作 =========================
  const save = useCallback(async () => {
    if (!updateMutation || docType !== 'final-document') {
      console.warn('Save operation not supported for this document type');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      
      const request: UpdateDocumentRequest = {
        editedDocument: editContent // ✅ 直接传递 TiptapJSON 对象
      };
      
      await updateMutation.mutateAsync(request);
      setIsDirty(false);
      clearDraftFromStorage();
      setHasConflict(false);
    } catch (error) {
      console.error('Save failed:', error);
      throw error;
    }
  }, [updateMutation, docType, editContent, clearDraftFromStorage]);

  const saveAs = useCallback(async (content: any) => {
    const originalContent = editContent;
    try {
      setEditContent(content);
      await save();
    } catch (error) {
      setEditContent(originalContent);
      throw error;
    }
  }, [editContent, save]);

  // ========================= 草稿操作 =========================
  const saveDraft = useCallback(() => {
    saveDraftToStorage(editContent);
  }, [saveDraftToStorage, editContent]);

  const loadDraft = useCallback(() => {
    const draft = loadDraftFromStorage();
    if (draft) {
      setEditContent(draft.content);
      const originalContent = documentQuery.data?.document;
      setIsDirty(!isContentEqual(draft.content, originalContent));
      setHasConflict(draft.version !== documentQuery.data?.version);
    }
  }, [loadDraftFromStorage, documentQuery.data]);

  const clearDraft = useCallback(() => {
    clearDraftFromStorage();
  }, [clearDraftFromStorage]);

  // ========================= 重置操作 =========================
  const reset = useCallback(() => {
    const originalContent = documentQuery.data?.document;
    setEditContent(originalContent);
    setIsDirty(false);
    setSaveError(null);
    setHasConflict(false);
    clearDraftFromStorage();
  }, [documentQuery.data?.document, clearDraftFromStorage]);

  const resetToServer = useCallback(() => {
    documentsResult.refreshDocument(projectId, docType);
    reset();
  }, [documentsResult, projectId, docType, reset]);

  // ========================= 冲突处理 =========================
  const resolveConflict = useCallback((useLocal: boolean) => {
    if (useLocal) {
      setHasConflict(false);
    } else {
      reset();
    }
  }, [reset]);

  // ========================= 清理 =========================
  // 组件 卸载时 触发
  // 或者依赖发生变化（即 debouncedSaveDraft、debouncedAutoSave）导致重新执行这个 useEffect 时，先执行上一次的清理
  useEffect(() => {
    //挂载后,先返回清理函数,但不会立即执行. 
    return () => { // 清理函数
      debouncedSaveDraft.cancel();
      debouncedAutoSave.cancel();
    };
  }, [debouncedSaveDraft, debouncedAutoSave]);

  // ========================= 返回值 =========================
  return {
    // 数据状态
    content: editContent,
    originalContent: documentQuery.data?.document,
    
    // 编辑状态
    isDirty,
    hasDraft,
    isLoading: documentQuery.isLoading,
    isSaving,
    isAutoSaving,
    
    // 错误状态
    error: documentQuery.error as Error | null,
    saveError,
    
    // 版本冲突
    hasConflict,
    serverVersion: documentQuery.data?.version,
    
    // 时间戳
    lastSavedAt,
    lastModifiedAt,
    
    // 内容操作（简化）
    updateContent,
    
    // 保存操作
    save,
    saveAs,
    
    // 草稿操作
    saveDraft,
    loadDraft,
    clearDraft,
    
    // 重置操作
    reset,
    resetToServer,
    
    // 冲突处理
    resolveConflict,
  };
};