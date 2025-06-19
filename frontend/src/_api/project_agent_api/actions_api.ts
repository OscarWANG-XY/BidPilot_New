// FastAPI 实例
import fastApiInstance from '@/_api/axios_instance_fa';

// ------------- 定义接口 -------------

export interface StartAnalysisRequest {
    // 空body，但保留接口定义以便未来扩展
}

export interface StartAnalysisResponse {
    success: boolean;
    message: string;
    projectId: string;
    initialState: string;
}

export interface RetryAnalysisRequest {
    projectId: string;
}

export interface RetryAnalysisResponse {
    success: boolean;
    message: string;
    projectId: string;
    currentState: string;
}

export interface StateStatusResponse {
    projectId: string;
    userState: string;
    internalState: string;
    progress: number;
    message?: string;
}

// ------------- FastAPI API -------------
export const StructuringActionsApi = {
    /**
     * 开始分析 - 用户上传文件后点击分析按钮触发此端点
     */
    startAnalysis: async (
        projectId: string,
        requestData: StartAnalysisRequest = {}
    ): Promise<StartAnalysisResponse> => {
        console.log('📤 [FastAPI] 开始分析:', { projectId, requestData });
        const response = await fastApiInstance.post(
            `/structuring/start-analysis/${projectId}`,
            requestData
        );
        console.log('📥 [FastAPI] 开始分析成功:', response.data);
        return response.data;
    },

    /**
     * 重试分析 - 当流程出现错误时，用户可以点击重新开始
     */
    retryAnalysis: async (
        requestData: RetryAnalysisRequest
    ): Promise<RetryAnalysisResponse> => {
        console.log('📤 [FastAPI] 重试分析:', requestData);
        const response = await fastApiInstance.post(
            `/structuring/retry-analysis`,
            requestData
        );
        console.log('📥 [FastAPI] 重试分析成功:', response.data);
        return response.data;
    },

};
