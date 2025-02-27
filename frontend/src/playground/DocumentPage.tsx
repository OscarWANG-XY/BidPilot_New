// DocumentPage.tsx
import React, { useState, useEffect } from 'react';
import DocumentTree, { DocNode } from './DocumentTree';
import DocumentViewer from './DocumentViewer';
import { Button } from "@/components/ui/button";
import { Loader2, FileUp, RefreshCw, Save } from "lucide-react";
import { mockDocumentData } from './mockData';

const DocumentPage: React.FC = () => {
  // 状态管理
  const [document, setDocument] = useState<DocNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<DocNode | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");

  // 处理节点选择
  const handleNodeSelect = (node: DocNode) => {
    setSelectedNode(node);
  };

  // 模拟从后端加载文档树
  const loadDocumentTree = async (docId: string) => {
    setLoading(true);
    setLoadingMessage("正在加载文档结构...");
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // 使用模拟数据
      const doc = mockDocumentData[docId] || mockDocumentData.default;
      setDocument(doc);
      setDocumentId(docId);
      setSelectedNode(null);
    } catch (error) {
      console.error("加载文档失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 模拟请求后端分析文档
  const handleAnalyzeDocument = async () => {
    if (!documentId) return;
    
    setLoading(true);
    setLoadingMessage("正在分析文档...");
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟获取分析后的文档
      const analyzedDocId = `${documentId}_analyzed`;
      const analyzedDoc = mockDocumentData[analyzedDocId] || mockDocumentData.enhanced;
      
      setDocument(analyzedDoc);
      setSelectedNode(null);
    } catch (error) {
      console.error("分析文档失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载默认文档
  useEffect(() => {
    loadDocumentTree('default');
  }, []);

  // 模拟上传文档后的回调
  const handleDocumentUpload = async () => {
    // 在实际应用中，这里会处理文件上传，然后从后端获取处理结果
    setLoading(true);
    setLoadingMessage("正在上传文档...");
    
    try {
      // 模拟上传和处理延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 加载上传后的文档结构
      await loadDocumentTree('uploaded');
    } catch (error) {
      console.error("上传文档失败:", error);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">文档结构查看器</h1>
          <div className="flex space-x-4">
            <Button onClick={handleDocumentUpload} disabled={loading}>
              <FileUp className="mr-2 h-4 w-4" />
              上传文档
            </Button>
            <Button 
              onClick={() => loadDocumentTree('default')} 
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              重置
            </Button>
            <Button 
              onClick={handleAnalyzeDocument} 
              disabled={loading || !document}
              variant="default"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {loadingMessage}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  分析优化
                </>
              )}
            </Button>
          </div>
        </div>

        {loading && !document ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <p>{loadingMessage}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 border rounded-lg p-4 bg-white dark:bg-gray-950">
              {document ? (
                <DocumentTree 
                  document={document} 
                  onNodeSelect={handleNodeSelect} 
                />
              ) : (
                <div className="text-center p-4 text-gray-500">
                  没有可用的文档
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <DocumentViewer selectedNode={selectedNode} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentPage;