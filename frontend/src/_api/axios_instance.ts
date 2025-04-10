import axios from 'axios';

// 命名转换工具函数
const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

const convertKeysToSnake = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToSnake);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        camelToSnake(key),
        convertKeysToSnake(value)
      ])
    );
  }
  return obj;
};

const convertKeysToCamel = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamel);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        snakeToCamel(key),
        convertKeysToCamel(value)
      ])
    );
  }
  return obj;
};

// 处理排序参数的特殊转换
const convertOrderingParam = (ordering: string): string => {
    if (!ordering) return ordering;
    
    // 处理多字段排序，例如 "-projectName,createTime"
    return ordering.split(',').map(field => {
        // 保留排序方向的前缀（- 或 +）
        const prefix = field.startsWith('-') ? '-' : '';
        const cleanField = field.replace(/^[+-]/, '');
        // 转换字段名为下划线格式
        return prefix + camelToSnake(cleanField);
    }).join(',');
};

// 创建 axios 实例
const axiosInstance = axios.create({
    baseURL: '/api'
});

// 请求拦截器
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        
        // 简化请求日志
        console.log(`🔍 ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url}`);
        
        // 如果存在 token，则添加到请求头
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // 如果是 FormData 类型的数据，自动设置 Content-Type
        if (config.data instanceof FormData) {
            config.headers['Content-Type'] = 'multipart/form-data';
        }

        // 移除转换前后的详细日志，保留关键信息
        if (config.data && !(config.data instanceof FormData)) {
            config.data = convertKeysToSnake(config.data);
        }

        if (config.params) {
            // 特殊处理 ordering 参数
            if (config.params.ordering) {
                config.params.ordering = convertOrderingParam(config.params.ordering);
            }
            config.params = convertKeysToSnake(config.params);
        }

        return config;
    },
    (error) => {
        console.error('❌ 请求拦截器错误:', error);
        return Promise.reject(error);
    }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
    (response) => {
        // 简化响应日志
        console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        
        if (response.data) {
            response.data = convertKeysToCamel(response.data);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // 如果是 401 错误且不是刷新 token 的请求
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                
                if (!refreshToken) {
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                console.log('🔄 刷新 token');
                const response = await axios.post('/api/auth/token/refresh/', {
                    refresh: refreshToken
                });

                const { access } = response.data;
                localStorage.setItem('token', access);

                originalRequest.headers.Authorization = `Bearer ${access}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                console.error('❌ token 刷新失败:', refreshError);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // 简化错误日志
        console.error(`❌ ${error.config.method?.toUpperCase()} ${error.config.url} - ${error.response?.status || 'Network Error'}`);
        
        if (error.response?.data) {
            error.response.data = convertKeysToCamel(error.response.data);
        }

        return Promise.reject(error);
    }
);

// 导出命名转换工具函数（以备特殊情况使用）
export const nameConversion = {
    camelToSnake,
    snakeToCamel,
    convertKeysToSnake,
    convertKeysToCamel
};

export default axiosInstance;
