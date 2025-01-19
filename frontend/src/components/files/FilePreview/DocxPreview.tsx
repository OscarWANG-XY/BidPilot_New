// 未来考虑是否要像豆包一样，在后端使用转为PDF，然后再用PDFPreview组件来渲染。

import { useState, useEffect } from 'react';  // React 的 Hook，用于管理组件的状态和副作用
import mammoth from 'mammoth'; //用于将 DOCX 文件转换为 HTML

// -------------- 定义了DocxPreview组件的props ------------------
interface DocxPreviewProps {
  url: string;
}

//===========================  DOCX预览组件 （done check！） ==============================
// {url}:DocxPreviewProps是结构赋值语法，表示从DocxPreviewProps对象中，提取url属性
export function DocxPreview({ url }: DocxPreviewProps) {

  // 定义状态变量
  const [content, setContent] = useState<string>('');    // 文档内容，初始值为空字符串
  const [loading, setLoading] = useState<boolean>(true); // 文档加载状态，初始值为true
  const [error, setError] = useState<string | null>(null); // 错误信息，初始值为null

  // useEffect 接受两个参数，第一个是回调函数，第二个是依赖数组。
  // 当依赖数组中的值发生变化时，回调函数会被执行。
  useEffect(

    // 定义第一个参数 - 回调函数，
    () => {
      // 定义一个异步函数loadDocx的封装
      const loadDocx = async () => {
        try {
          setLoading(true);

          // 发送HTTP请求，获取DOCX文件
          const response = await fetch(url);

          // 将响应转换为Blob对象，即二进制数据对象（通常用于处理文件数据）
          // blob会返回promise对象，添加await等待promise解析完成。
          const blob = await response.blob(); 
          
          // 将Blob对象转换为ArrayBuffer对象，即二进制数据缓冲区
          // arrayBuffer也会返回promise对象，添加await等promise解析完成。
          const arrayBuffer = await blob.arrayBuffer();
        
          // 将ArrayBuffer对象转换为HTML字符串
          // mammoth.convertToHtml() 会返回promise对象，添加await等promise解析完成。
          const result = await mammoth.convertToHtml({ arrayBuffer });
          
          // 将HTML字符串设置为组件的状态, 将result.value赋值给content
          setContent(result.value);

        } catch (err) {
          console.error('Error loading DOCX:', err);
          setError('文件加载失败');

          // finally是无论try还是catch，都会执行的代码块
        } finally {
          setLoading(false);
        }
      };
      // 直接调用封装好的loadDocx函数，加载DOCX文件
      loadDocx();
    }, 

  // 定义第二个参数：依赖数组
  [url]
);


  // ----------------- 渲染组件 ---------------------
  return (
    <div className="flex flex-col items-center h-full">
      {loading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
          <span className="ml-2">加载中...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center p-4">
          <span className="ml-2">加载失败</span>
        </div>
      )}
  


      {/* 确保内容容器可以滚动 */}
      <div className="flex-1 overflow-y-auto w-full">
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: content }} 
        />
      </div>
  
      {/* 导航按钮固定在底部并居中 */}
      {!loading && (
        <div className="flex items-center justify-center gap-4 mt-4 sticky bottom-0 bg-white py-2 w-full">
          {/* 这里可以添加翻页按钮或其他操作 */}
        </div>
      )}
    </div>
  );
} 