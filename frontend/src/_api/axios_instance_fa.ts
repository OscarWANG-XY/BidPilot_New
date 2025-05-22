import axios from 'axios';

// 复用原有的命名转换函数（如果 FastAPI 也使用 snake_case）
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

// 创建 FastAPI axios 实例
const fastApiInstance = axios.create({
    baseURL: '/fastapi'  // 使用新的代理路径
});

// 请求拦截器 - 复用 JWT 逻辑
fastApiInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        
        console.log(`🔍 [FastAPI] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url}`);
        
        // JWT token 处理
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // FormData 处理
        if (config.data instanceof FormData) {
            config.headers['Content-Type'] = 'multipart/form-data';
        }

        // 命名转换（如果 FastAPI 使用 snake_case）
        if (config.data && !(config.data instanceof FormData)) {
            config.data = convertKeysToSnake(config.data);
        }

        if (config.params) {
            config.params = convertKeysToSnake(config.params);
        }

        return config;
    },
    (error) => {
        console.error('❌ [FastAPI] 请求拦截器错误:', error);
        return Promise.reject(error);
    }
);

// 响应拦截器 - 复用 JWT 刷新逻辑
fastApiInstance.interceptors.response.use(
    (response) => {
        console.log(`✅ [FastAPI] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        
        if (response.data) {
            response.data = convertKeysToCamel(response.data);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // 401 错误处理 - 复用 Django 的 token 刷新逻辑
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                
                if (!refreshToken) {
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                console.log('🔄 [FastAPI] 刷新 token');
                // 注意：仍然使用 Django 的刷新接口
                const response = await axios.post('/api/auth/token/refresh/', {
                    refresh: refreshToken
                });

                const { access } = response.data;
                localStorage.setItem('token', access);

                originalRequest.headers.Authorization = `Bearer ${access}`;
                return fastApiInstance(originalRequest);
            } catch (refreshError) {
                console.error('❌ [FastAPI] token 刷新失败:', refreshError);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        console.error(`❌ [FastAPI] ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'}`);
        
        if (error.response?.data) {
            error.response.data = convertKeysToCamel(error.response.data);
        }

        return Promise.reject(error);
    }
);

export default fastApiInstance;