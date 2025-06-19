import fastApiInstance from '../axios_instance_fa';

// ========================= 类型定义 =========================

export interface GetDocumentResponse {
  keyName: string;
  content?: Record<string, any> | null;
}

export interface UpdateDocumentRequest {
  editedContent: Record<string, any>;
}

export interface UpdateDocumentResponse {
  success: boolean;
  message: string;
}


// ========================= API 对象 =========================

export const documentsApi = {
  /**
   * 获取文档（供前端编辑器加载）
   * GET /projects/{project_id}/documents/{key_name}
   */
  getDocument: async (projectId: string, key_name: string): Promise<GetDocumentResponse> => {
    console.log('📤 进入API端点getDocument:');
        const response = await fastApiInstance.get<GetDocumentResponse>(
            `/projects/${projectId}/documents/${key_name}`
        );
        console.log('🐛 getDocument的结果:', response.data);
        return response.data;
  },

  /**
   * 更新最终文档（保存编辑内容）
   * PUT /projects/{project_id}/documents/{key_name}
   */
  updateDocument: async (
    projectId: string, 
    key_name: string,
    data: UpdateDocumentRequest
  ): Promise<UpdateDocumentResponse> => {
    console.log('📤 进入API端点updateFinalDocument:');
    const response = await fastApiInstance.put<UpdateDocumentResponse>(
        `/projects/${projectId}/documents/${key_name}`,
        data
    );
    return response.data;
  },

};

// ========================= 导出默认对象 =========================

export default documentsApi;



