import React, { useState, useCallback, useEffect } from 'react';
import { AlertCircle, Save, FileText, Clock, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import TiptapEditor from './TiptapEditor';
import { useDocumentEditor } from '@/components/TiptapEditor_Pro/useDocumentEditor';
import { DocumentType } from '@/_hooks/useStructuringAgent.ts/useDocuments';

// ========================= 类型定义 =========================
interface DocumentManagerProps {
  projectId: string;
  docType?: DocumentType;
  className?: string;
  
  // 编辑器配置
  readOnly?: boolean;
  enableAutoSave?: boolean;
  enableDraft?: boolean;
  autoSaveDelay?: number;
  
  // 回调函数
  onSave?: (content: any) => void;
  onError?: (error: Error, operation: 'save' | 'load' | 'draft') => void;
  onContentChange?: (content: any) => void;
}

// ========================= 状态指示器组件 =========================
const StatusIndicator: React.FC<{
  isLoading: boolean;
  isSaving: boolean;
  isAutoSaving: boolean;
  isDirty: boolean;
  saveError: Error | null;
  lastSavedAt?: Date;
}> = ({ isLoading, isSaving, isAutoSaving, isDirty, saveError, lastSavedAt }) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-blue-600">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">加载中...</span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-blue-600">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">保存中...</span>
      </div>
    );
  }

  if (isAutoSaving) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">自动保存中...</span>
      </div>
    );
  }

  if (saveError) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">保存失败</span>
      </div>
    );
  }

  if (isDirty) {
    return (
      <div className="flex items-center gap-2 text-amber-600">
        <Clock className="h-4 w-4" />
        <span className="text-sm">未保存的更改</span>
      </div>
    );
  }

  if (lastSavedAt) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">
          已保存 {lastSavedAt.toLocaleTimeString()}
        </span>
      </div>
    );
  }

  return null;
};

// ========================= 冲突解决对话框 =========================
const ConflictDialog: React.FC<{
  isOpen: boolean;
  onResolve: (useLocal: boolean) => void;
  serverVersion?: string;
}> = ({ isOpen, onResolve, serverVersion }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          <h3 className="text-lg font-semibold">版本冲突</h3>
        </div>
        
        <p className="text-gray-600 mb-6">
          检测到文档版本冲突。服务器上的文档已被其他用户修改（版本: {serverVersion}）。
          请选择要保留的版本：
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={() => onResolve(true)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            保留我的更改
          </button>
          <button
            onClick={() => onResolve(false)}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            使用服务器版本
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================= 草稿通知 =========================
const DraftNotification: React.FC<{
  hasDraft: boolean;
  onLoadDraft: () => void;
  onClearDraft: () => void;
}> = ({ hasDraft, onLoadDraft, onClearDraft }) => {
  const [isVisible, setIsVisible] = useState(hasDraft);

  useEffect(() => {
    setIsVisible(hasDraft);
  }, [hasDraft]);

  if (!isVisible) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-amber-600" />
          <span className="text-amber-800">
            检测到未保存的草稿
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              onLoadDraft();
              setIsVisible(false);
            }}
            className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
          >
            恢复草稿
          </button>
          <button
            onClick={() => {
              onClearDraft();
              setIsVisible(false);
            }}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            忽略
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================= 主组件 =========================
const DocumentManager: React.FC<DocumentManagerProps> = ({
  projectId,
  docType = 'final-document',
  className = '',
  readOnly = false,
  enableAutoSave = false,
  enableDraft = true,
  autoSaveDelay = 5000,
  onSave,
  onError,
  onContentChange,
}) => {
  // ========================= 状态管理 =========================
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  // ========================= Document Editor Hook =========================
  // 这里没有显式的数据查询,数据加载被封装在了useDocumentEditor中. 
  // 组件挂载时,会触发以下的调用,该调用触发useDocumentEditor的挂载
  // 进一步, doucumentsResultS被构建, 并调用useDocument.ts 来实现数据查询
  // 然后, useDocumentEditor 的初始化useEffect 被触发. 
  const documentEditor = useDocumentEditor(projectId, docType, {
    enableAutoSave,
    enableDraft,
    autoSaveDelay,
    onContentChange,
    onSave,
    onError,
  });

  console.log('🐛 传导到组件的数据:', documentEditor.content?JSON.stringify(documentEditor.content).slice(0,300):'null');

  // ========================= 事件处理 =========================
  const handleSave = useCallback(async () => {
    try {
      await documentEditor.save();
    } catch (error) {
      console.error('保存失败:', error);
    }
  }, [documentEditor]);

  const handleContentChange = useCallback((content: any) => {
    documentEditor.updateContent(content);
  }, [documentEditor]);

  const handleConflictResolve = useCallback((useLocal: boolean) => {
    documentEditor.resolveConflict(useLocal);
    setShowConflictDialog(false);
  }, [documentEditor]);

  const handleLoadDraft = useCallback(() => {
    documentEditor.loadDraft();
  }, [documentEditor]);

  const handleClearDraft = useCallback(() => {
    documentEditor.clearDraft();
  }, [documentEditor]);

  // ========================= 副作用 =========================
  // 监听冲突状态
  useEffect(() => {
    if (documentEditor.hasConflict) {
      setShowConflictDialog(true);
    }
  }, [documentEditor.hasConflict]);

  // ========================= 键盘快捷键 =========================
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S 或 Cmd+S 保存
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (!readOnly && !documentEditor.isSaving) {
          handleSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [readOnly, documentEditor.isSaving, handleSave]);

  // ========================= 渲染 =========================
  if (documentEditor.error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">加载文档失败</span>
          </div>
          <p className="text-red-700 mt-2">
            {documentEditor.error.message}
          </p>
          <button
            onClick={documentEditor.resetToServer}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* 草稿通知 */}
      <DraftNotification
        hasDraft={documentEditor.hasDraft}
        onLoadDraft={handleLoadDraft}
        onClearDraft={handleClearDraft}
      />

      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            文档编辑器
          </h2>
          
          {/* 状态指示器 */}
          <StatusIndicator
            isLoading={documentEditor.isLoading}
            isSaving={documentEditor.isSaving}
            isAutoSaving={documentEditor.isAutoSaving}
            isDirty={documentEditor.isDirty}
            saveError={documentEditor.saveError}
            lastSavedAt={documentEditor.lastSavedAt}
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {/* 自动保存状态 */}
          {enableAutoSave && (
            <span className="text-sm text-gray-500">
              自动保存已启用
            </span>
          )}

          {/* 保存按钮 */}
          {!readOnly && docType === 'final-document' && (
            <button
              onClick={handleSave}
              disabled={documentEditor.isSaving || !documentEditor.isDirty}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              {documentEditor.isSaving ? '保存中...' : '保存'}
            </button>
          )}

          {/* 重置按钮 */}
          {!readOnly && documentEditor.isDirty && (
            <button
              onClick={documentEditor.reset}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              重置
            </button>
          )}
        </div>
      </div>

      {/* 错误信息 */}
      {documentEditor.saveError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">保存失败</span>
          </div>
          <p className="text-red-700 mt-1">
            {documentEditor.saveError.message}
          </p>
        </div>
      )}

      {/* 编辑器 */}
      <TiptapEditor
        initialContent={documentEditor.content}
        onContentChange={handleContentChange}
        readOnly={readOnly || documentEditor.isLoading}
        className="transition-opacity duration-200"
      />

      {/* 冲突解决对话框 */}
      <ConflictDialog
        isOpen={showConflictDialog}
        onResolve={handleConflictResolve}
        serverVersion={documentEditor.serverVersion}
      />
    </div>
  );
};

export default DocumentManager;