import React, { useState } from 'react';
import { useDocuments, DocumentType } from '../useDocuments'; // 请根据实际路径调整



interface TestDocumentsProps {
  projectId: string;
}


const TestDocuments: React.FC<TestDocumentsProps> = ({projectId}) => {

  const [docType, setDocType] = useState<DocumentType>('final-document');
  const [editContent, setEditContent] = useState('');

  const {
    currentDocumentQuery,
    rawDocumentQuery,
    reviewSuggestionsQuery,
    finalDocumentQuery,
    updateFinalDocumentMutation,
    prefetchDocument,
    refreshDocument,
    refreshAllDocuments,
  } = useDocuments({ 
    projectId, 
    docType,
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
    updateFinalDocumentMutation.mutate({
      editedDocument: {"type":"doc", "content": [editContent.trim()]}
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>📄 文档查询钩子测试面板</h2>
      
      {/* 控制面板 */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <div>
          <label>文档类型: </label>
          <select 
            value={docType} 
            onChange={(e) => setDocType(e.target.value as DocumentType)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="raw-document">原始文档</option>
            <option value="review-suggestions">审查建议</option>
            <option value="final-document">最终文档</option>
          </select>
        </div>
      </div>

      {/* 操作按钮 */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => refreshDocument(projectId, docType)} style={{ marginRight: '10px', padding: '8px 15px' }}>
          🔄 刷新当前文档
        </button>
        <button onClick={() => refreshDocument(projectId)} style={{ marginRight: '10px', padding: '8px 15px' }}>
          🔄 刷新项目所有文档
        </button>
        <button onClick={refreshAllDocuments} style={{ marginRight: '10px', padding: '8px 15px' }}>
          🔄 刷新全部文档
        </button>
        <button onClick={() => prefetchDocument(projectId, docType)} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px' }}>
          ⚡ 预取文档
        </button>
      </div>

      {/* 当前文档查询状态 */}
      <div style={{ marginBottom: '25px' }}>
        <h3>📋 当前文档查询 ({docType})</h3>
        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', border: '1px solid #dee2e6' }}>
          <p><strong>状态:</strong> {currentDocumentQuery.isLoading ? '⏳ 加载中' : currentDocumentQuery.error ? '❌ 错误' : '✅ 完成'}</p>
          <p><strong>获取中:</strong> {currentDocumentQuery.isFetching ? '🔄 是' : '💤 否'}</p>
          
          {currentDocumentQuery.error && (
            <div style={{ color: 'red', fontSize: '14px' }}>
              错误: {String(currentDocumentQuery.error)}
            </div>
          )}
          
          {currentDocumentQuery.data && (
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>📊 查看数据</summary>
              <pre style={{ backgroundColor: '#e9ecef', padding: '10px', borderRadius: '3px', overflow: 'auto', fontSize: '12px', maxHeight: '200px' }}>
                {JSON.stringify(currentDocumentQuery.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>

      {/* 文档更新功能 */}
      <div style={{ marginBottom: '25px' }}>
        <h3>✏️ 更新最终文档</h3>
        <div style={{ backgroundColor: '#fff3cd', padding: '15px', borderRadius: '5px', border: '1px solid #ffeaa7' }}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="输入要更新的文档内容..."
            style={{ width: '100%', height: '80px', padding: '8px', marginBottom: '10px', resize: 'vertical' }}
          />
          <button 
            onClick={handleUpdateDocument}
            disabled={updateFinalDocumentMutation.isPending}
            style={{ 
              padding: '8px 15px', 
              backgroundColor: updateFinalDocumentMutation.isPending ? '#ccc' : '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '3px',
              cursor: updateFinalDocumentMutation.isPending ? 'not-allowed' : 'pointer'
            }}
          >
            {updateFinalDocumentMutation.isPending ? '⏳ 更新中...' : '💾 更新文档'}
          </button>
        </div>
      </div>

      {/* 所有文档查询状态概览 */}
      <div>
        <h3>📚 所有文档状态概览</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {[
            { name: '原始文档', query: rawDocumentQuery },
            { name: '审查建议', query: reviewSuggestionsQuery },
            { name: '最终文档', query: finalDocumentQuery }
          ].map(({ name, query }) => (
            <div key={name} style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px', border: '1px solid #dee2e6' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{name}</h4>
              <div style={{ fontSize: '12px' }}>
                <div>{query.isLoading ? '⏳ 加载中' : query.error ? '❌ 错误' : query.data ? '✅ 有数据' : '⚪ 无数据'}</div>
                <div>获取: {query.isFetching ? '🔄' : '💤'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestDocuments;