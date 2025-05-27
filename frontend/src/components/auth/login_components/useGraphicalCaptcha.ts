// hooks/useCaptcha.ts
import { useCallback, useRef } from 'react'; // 引入 React 的 useCallback 和 useRef 钩子
import { verifyGphCaptcha } from '@/_api/auth_api/gph_captcha_api'; // 引入验证图形验证码的 API 函数

// 为 AliyunCaptcha 添加类型声明
declare global {
  function initAliyunCaptcha(config: {
    SceneId: string; // 场景 ID
    prefix: string;  // 前缀
    mode: string;    // 模式（如 'popup'）
    element: string; // 验证码容器的选择器
    button: string;  // 触发验证码的按钮选择器
    captchaVerifyCallback: (captchaVerifyParam: string) => Promise<{
      captchaResult: boolean; // 验证码验证结果
      bizResult: boolean;     // 业务验证结果（由于我的业务验证没有实际意义，所以bizResult实际意义也不大）
    }>;

    // 业务验证结果回调，在我以下的代码里，没有实际作用，但阿里云的sdk需要有。 
    onBizResultCallback: (bizResult: boolean) => void; 
    getInstance: (instance: any) => void; // 获取验证码实例的回调
    slideStyle: { width: number; height: number }; // 滑动验证码的样式
    language: string; // 语言设置
    region: string;   // 区域设置
  }): void;
}

// 定义 useGraphicalCaptcha 钩子，接收一个成功回调函数 onSuccess
export function useGphCaptcha(onSuccess: () => void) {

  // 使用 useRef 创建一个引用，用于保存验证码实例，在下面会被赋值。
  // useRef 是React为组件设计的变量，用于储存不因为组件渲染而改变的变量，同时和全局变量区别开。 
  const GphcaptchaInstance = useRef<any>(null);

  // ----------------- 定义业务验证结果回调函数 ---------------------------
  // useCallback 返回记忆化的回调函数，目的是优化性能。 
  // useCallback 的第一个参数是返回的记忆化的参数，第二个参数是依赖项。 
  // 第二个参数为空意味着不依赖外部变量或状态，所以onBizResultCallback只会在组件首次渲染时创建一次。 
  const onBizResultCallback = useCallback((bizResult: boolean) => {
    if (!bizResult) { // 如果业务验证失败，打印错误信息
      console.error('验证失败');
    }
  }, []);

  // ------------------ 定义初始化验证码的函数 -----------------------------
  const initCaptcha = useCallback(() => {
    if (GphcaptchaInstance.current) { // 如果图形验证码实例已经存在，直接返回
      return;
    }
    
    // 确保图形验证码容器和按钮元素存在，是图形验证码显示的两个必要元素。
    const containerElement = document.getElementById('captcha-container');
    const buttonElement = document.getElementById('captcha-button');

    // 如果元素未找到，打印错误信息并返回
    if (!containerElement || !buttonElement) { 
      console.error('验证码容器元素未找到');
      return;
    }

    // 检查是否加载了阿里云图形验证码 SDK
    // 阿里云图形验证码 SDK 在index.html里加了<script>标签，引入了外部文件。
    // 这些文件中定义的全局变量或函数会被挂载到 window 对象上
    // 这里的 window 是浏览器中的全局对象，代表当前页面的全局作用域
    // typeof 是js的操作符，用于检查数据类型，即检查window.initAliyunCaptcha是不是一个函数
    // typeof...='function'的检查，是为了确保initAliyunCaptcha已经正确加载并可用。
    if (typeof window.initAliyunCaptcha === 'function') {

      // 如有initAliyunCaptcha已经加载并可用，那就调用它，进行初始化
      initAliyunCaptcha({
        SceneId: 'gblhuuku', // 场景id: 
        prefix: '1nwvia',    // 使用你的实际 prefix
        mode: 'popup',       // 使用弹出模式
        element: '#captcha-container', // 验证码容器的选择器, #是ID选择器的标识符
        button: '#captcha-button',     // 触发验证码的按钮选择器, #是ID选择器的标识符

        // 以下定义了captchaVerifyCallback的函数内容
        // captchaVerifyParam - 由验证码脚本回调的验证参数，不需要做任何处理，直接传给服务端即可
        captchaVerifyCallback: async (captchaVerifyParam: string) => {
          try {
            // 调用 API 验证图形验证码
            const result = await verifyGphCaptcha(captchaVerifyParam, {});

            // 如果验证成功，触发发送验证码的回调
            if (result.captchaResult && result.bizResult) {

              // 这里的onSuccess是useGraphicalCaptcha父组件传入的回调函数handleSendCode
              onSuccess?.();   
            }
            return result; // 返回验证结果
          } catch (error) { // 如果验证失败，打印错误信息并返回失败结果
            console.error('验证码验证失败:', error);
            return {
              captchaResult: false,
              bizResult: false         //意义不大的值，SDK必要
            };
          }
        },
        onBizResultCallback, // 业务验证结果回调 （意义不大的代码，SDK需要）

        // 以下定义了getInstance的函数内容
        // instance作为函数输入，在函数里被存储在GphcaptchaInstance.current里
        getInstance: (instance: any) => { 
          GphcaptchaInstance.current = instance; // 保存图形验证码实例
        },
        slideStyle: { width: 300, height: 40 }, // 滑动验证码的样式
        language: 'cn', // 设置语言为中文
        region: 'cn'    // 设置区域为中国
      });
    } else { // 如果阿里云验证码 SDK 未加载，打印错误信息
      console.error('阿里云验证码 SDK 未正确加载');
    }
  }, [onSuccess]); // 依赖 onSuccess 回调函数

  // 定义显示验证码的函数
  const showCaptcha = useCallback(() => {
    if (GphcaptchaInstance.current) { // 如果图形验证码实例存在，直接显示
      GphcaptchaInstance.current.show();
    } else { // 如果实例不存在，先初始化再显示
      initCaptcha();
    }
  }, [initCaptcha]); // 依赖 initCaptcha 函数

  // 返回初始化验证码和显示验证码的函数
  return {
    initGphCaptcha: initCaptcha,
    showGphCaptcha: showCaptcha
  };
}