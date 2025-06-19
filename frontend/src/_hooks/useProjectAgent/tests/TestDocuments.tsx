import React, { useState } from 'react';
import { useDocuments } from '../useDocuments';

interface TestDocumentsProps {
  projectId: string;
  keyName: string;
}

const TestDocuments: React.FC<TestDocumentsProps> = ({ projectId, keyName }) => {
  const [editContent, setEditContent] = useState('');

  const {
    documentQuery,
    updateDocumentMutation,
    refreshDocument,
  } = useDocuments({ 
    projectId, 
    keyName,
    mutationOptions: {
      onSuccess: () => alert('✅ 文档更新成功！'),
      onError: (error) => alert(`❌ 更新失败: ${error.message}`),
    }
  });

  const handleUpdateDocument = () => {
    if (!editContent.trim()) {
      alert('请输入要更新的内容');
      return;
    }
    updateDocumentMutation.mutate({
      editedContent: { "type": "doc", "content": [editContent.trim()] }
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>📄 文档测试面板</h2>
      <p><strong>项目ID:</strong> {projectId}</p>
      <p><strong>文档类型:</strong> {keyName}</p>
      
      {/* 操作按钮 */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => refreshDocument()} 
          style={{ 
            marginRight: '10px', 
            padding: '8px 15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '3px'
          }}
        >
          🔄 刷新文档
        </button>
      </div>

      {/* 文档查询状态 */}
      <div style={{ marginBottom: '25px' }}>
        <h3>📋 文档查询状态</h3>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '5px', 
          border: '1px solid #dee2e6' 
        }}>
          <p><strong>状态:</strong> {
            documentQuery.isLoading ? '⏳ 加载中' : 
            documentQuery.error ? '❌ 错误' : '✅ 完成'
          }</p>
          <p><strong>获取中:</strong> {documentQuery.isFetching ? '🔄 是' : '💤 否'}</p>
          
          {documentQuery.error && (
            <div style={{ color: 'red', fontSize: '14px' }}>
              错误: {String(documentQuery.error)}
            </div>
          )}
          
          {documentQuery.data && (
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>📊 查看数据</summary>
              <pre style={{ 
                backgroundColor: '#e9ecef', 
                padding: '10px', 
                borderRadius: '3px', 
                overflow: 'auto', 
                fontSize: '12px', 
                maxHeight: '200px' 
              }}>
                {JSON.stringify(documentQuery.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>

      {/* 文档更新功能 */}
      <div style={{ marginBottom: '25px' }}>
        <h3>✏️ 更新文档</h3>
        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '15px', 
          borderRadius: '5px', 
          border: '1px solid #ffeaa7' 
        }}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="输入要更新的文档内容..."
            style={{ 
              width: '100%', 
              height: '120px', 
              padding: '8px', 
              marginBottom: '10px', 
              resize: 'vertical',
              border: '1px solid #ccc',
              borderRadius: '3px'
            }}
          />
          <button 
            onClick={handleUpdateDocument}
            disabled={updateDocumentMutation.isPending}
            style={{ 
              padding: '8px 15px', 
              backgroundColor: updateDocumentMutation.isPending ? '#ccc' : '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '3px',
              cursor: updateDocumentMutation.isPending ? 'not-allowed' : 'pointer'
            }}
          >
            {updateDocumentMutation.isPending ? '⏳ 更新中...' : '💾 更新文档'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestDocuments;