import fastApiInstance from '../axios_instance_fa';

// ========================= 类型定义 =========================

export interface GetDocumentResponse {
  success: boolean;
  message: string;
  projectId: string;
  docType: string;
  document?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
}

export interface UpdateDocumentRequest {
  editedDocument: Record<string, any>;
}

export interface UpdateDocumentResponse {
  success: boolean;
  message: string;
  projectId: string;
  docType: string;
  savedAt: string;
}

export interface DocumentCompareResponse {
  success: boolean;
  message: string;
  projectId: string;
  sourceType: string;
  targetType: string;
  sourceDocument?: Record<string, any> | null;
  targetDocument?: Record<string, any> | null;
  comparisonMetadata?: Record<string, any> | null;
}

// ========================= API 对象 =========================

export const documentsApi = {
  /**
   * 获取原始文档（供前端编辑器加载）
   * GET /structuring/raw-document/{project_id}
   */
  getRawDocument: async (projectId: string): Promise<GetDocumentResponse> => {
    console.log('📤 进入API端点getRawDocument:');
        const response = await fastApiInstance.get<GetDocumentResponse>(
            `/structuring/raw-document/${projectId}`
        );
        return response.data;
  },

  /**
   * 获取审查建议文档
   * GET /structuring/review-suggestions/{project_id}
   */
  getReviewSuggestions: async (projectId: string): Promise<GetDocumentResponse> => {
    console.log('📤 进入API端点getReviewSuggestions:');
    const response = await fastApiInstance.get<GetDocumentResponse>(
        `/structuring/review-suggestions/${projectId}`
    );
    return response.data;
  },

  /**
   * 获取最终文档（供前端编辑器加载）
   * GET /structuring/final-document/{project_id}
   */
  getFinalDocument: async (projectId: string): Promise<GetDocumentResponse> => {
    console.log('📤 进入API端点getFinalDocument:');
    const response = await fastApiInstance.get<GetDocumentResponse>(
        `/structuring/final-document/${projectId}`
    );
    return response.data;
  },

  /**
   * 更新最终文档（保存编辑内容）
   * PUT /structuring/final-document/{project_id}
   */
  updateFinalDocument: async (
    projectId: string, 
    data: UpdateDocumentRequest
  ): Promise<UpdateDocumentResponse> => {
    console.log('📤 进入API端点updateFinalDocument:');
    const response = await fastApiInstance.put<UpdateDocumentResponse>(
        `/structuring/final-document/${projectId}`,
        data
    );
    return response.data;
  },

  // ========================= 便捷方法 =========================

  /**
   * 获取任意类型的文档
   * @param projectId 项目ID
   * @param docType 文档类型：'raw-document' | 'review-suggestions' | 'final-document'
   */
  getDocument: async (
    projectId: string, 
    docType: 'raw-document' | 'review-suggestions' | 'final-document'
  ): Promise<GetDocumentResponse> => {
    switch (docType) {
      case 'raw-document':
        return documentsApi.getRawDocument(projectId);
      case 'review-suggestions':
        return documentsApi.getReviewSuggestions(projectId);
      case 'final-document':
        return documentsApi.getFinalDocument(projectId);
      default:
        throw new Error(`不支持的文档类型: ${docType}`);
    }
  },

};

// ========================= 导出默认对象 =========================

export default documentsApi;



