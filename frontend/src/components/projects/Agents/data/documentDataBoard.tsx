import React from 'react';
import { useDocuments } from '@/_hooks/useProjectAgent/useDocuments';

interface DocumentDataBoardProps {
  projectId: string;
  keyName?: string;
}

const DocumentDataBoard: React.FC<DocumentDataBoardProps> = ({
  projectId,
  keyName
}) => {
  // 获取文档查询hook实例
  const documentsResult = useDocuments({
    projectId,
    keyName,
    queryOptions: {
      enabled: !!projectId,
      staleTime: keyName === 'raw_document' ? 5 * 60 * 1000 : 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  });

  // 🔧 添加调试信息
  console.log('🐛 DocumentDataBoard - keyName:', keyName);
  console.log('🐛 DocumentDataBoard - documentQuery.data:', documentsResult.documentQuery.data);

  // 获取当前文档查询
  const {
    data: documentData,   // 格式为GetDocumentResponse
    isLoading: isDocumentLoading,
    error: documentError
  } = documentsResult.documentQuery;

  // 数据派生计算
  const derivedData = React.useMemo(() => {
    return {
      // 基础数据
      document: documentData?.content,
    //   version: documentData?.version,
    //   lastUpdated: documentData?.savedAt,
      documentType: keyName,
      
      // 统计信息
      documentSize: documentData?.content ? JSON.stringify(documentData.content).length : 0,
      hasContent: !!(documentData?.content),
      
      // 状态标识
      hasData: !!(documentData),
      isLoading: isDocumentLoading,
      hasError: !!(documentError),
    };
  }, [documentData, isDocumentLoading, documentError, keyName]);

  // 简单的渲染逻辑 - 专注数据展示
  if (derivedData.isLoading) {
    return <div>Loading document for project {projectId}...</div>;
  }

  if (derivedData.hasError) {
    const errorMessage = documentError?.message || '未知错误';
    
    return (
      <div>
        <p>Error: 文档加载错误: {errorMessage}</p>
        <button 
          onClick={() => documentsResult.refreshDocument(projectId, keyName)}
          style={{ marginTop: '10px', padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div>
      <h3>--- Document Data Board ---</h3>
      
      {/* 文档基础信息 */}
      <div>
        <h4>Document Info</h4>
        <p>Document Type: {derivedData.documentType}</p>
        {/* <p>Version: {derivedData.version || 'N/A'}</p> */}
        {/* <p>Last Updated: {derivedData.lastUpdated || 'N/A'}</p> */}
        <p>Document Size: {derivedData.documentSize} characters</p>
        <p>Has Content: {derivedData.hasContent ? 'Yes' : 'No'}</p>
      </div>

      {/* 文档内容预览 */}
      {derivedData.hasContent && (
        <div>
          <h4>Document Preview</h4>
          <div style={{ 
            maxHeight: '200px', 
            overflow: 'auto', 
            border: '1px solid #ddd', 
            padding: '10px', 
            backgroundColor: '#f9f9f9',
            fontSize: '12px'
          }}>
            <pre>{JSON.stringify(derivedData.document, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* 数据可用性指示 */}
      <div>
        <p>Data Available: {derivedData.hasData ? 'Yes' : 'No'}</p>
      </div>

      {/* 操作按钮 */}
      <div style={{ marginTop: '10px' }}>
        <button 
          onClick={() => documentsResult.refreshDocument(projectId, keyName)}
          style={{ marginRight: '10px', padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          刷新文档
        </button>
        <button 
          onClick={() => documentsResult.refreshAllDocuments()}
          style={{ padding: '5px 10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          刷新所有文档
        </button>
      </div>

      {/* 开发时数据展示 */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '10px', color: 'red', backgroundColor: 'white' }}>
          <h4>Debug Info - documentData原始数据:</h4>
          <pre>{JSON.stringify(documentData, null, 2)}</pre>
          
          <h4>Debug Info - 所有查询状态:</h4>
          <div style={{ fontSize: '12px' }}>
            <p>Document Loading: {documentsResult.documentQuery.isLoading.toString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentDataBoard;
