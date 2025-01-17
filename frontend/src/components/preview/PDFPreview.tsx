import { useState } from 'react';    // React钩子，用于管理组件状态 
import { Document, Page, pdfjs } from 'react-pdf';     // 用于渲染PDF文档和页面
import { Button } from '@/components/ui/button';          // 按钮组件
import { ChevronLeft, ChevronRight } from 'lucide-react';  // 左右箭头图标


// 设置 PDF.js 工作器路径，以便在浏览器中处理PDF文件
// 通过工作路径，我们把PDF的解析和渲染移到后台线程中执行，从而不阻塞主线程（应用）的响应性。
// 为避免Typescript类型问题，不直接导入.mjs文件，而是使用以下 URL 构造方式
// 需要确保node_modules/pdfjs-dist/build/pdf.worker.min.mjs存在
// 另外在vite.config.ts中，需要配置optimizeDeps，以确保pdf.worker.min.mjs被包含在构建中
// 同时，需要确保
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',  
  import.meta.url,
).toString();


// 定义PDF预览组件的props，这里用的是url
interface PDFPreviewProps {
  url: string;
}


//============================ PDF预览组件 ===================================
// {url}:PDFPreviewProps是结构赋值语法，表示从PDFPreviewProps对象中，提取url属性
export function PDFPreview({ url }: PDFPreviewProps) {

  // 定义状态变量
  const [numPages, setNumPages] = useState<number>(0); //存储PDF文件的总页数
  const [pageNumber, setPageNumber] = useState<number>(1); //当前显示的页码

  // 自定义的文档加载状态管理，以下启用了<Document>组件内置的loading状态管理功能
  // 自定义的好处：更好的用户体验，更灵活的UI控制，更强的扩展性，更精确性能优化
  const [loading, setLoading] = useState<boolean>(true); 


  // 这里定义了文档加载成功的回调函数，其内容是更新总页数和加载状态，这个函数在后续渲染时被调用。
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  // -------------- 渲染组件 ------------------
  return (
    <div className="flex flex-col items-center">

      {/* 如果文档正在加载，显示加载动画 */}
      {loading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">加载中...</span>
        </div>
      )}
      
      {/* 渲染PDF文档 */}
      <Document    // 这里使用了react-pdf包import进来的功能组件。  
        file={url}
        onLoadSuccess={onDocumentLoadSuccess} //配置了“加载成功”的回调函数
        loading={null}   //Document有内置额的加载状态管理，由于我们用了自定的loading管理，{null}意味着内置loading功能不启用。
      >

        <Page 
          pageNumber={pageNumber} // 指定要渲染的页码，组件会根据这个页面提取并渲染
          renderTextLayer={false} // 禁用文本层渲染，这时只显示图像，提供渲染速度 （这个是可选的，默认是true） 
          renderAnnotationLayer={false} // 不显示注释、标记和其他交互元素。 
          className="max-w-full"
        />
      </Document>

      {/* 如果文档加载完成，显示页码导航按钮，按钮使用了shadcn/ui的组件 */}
      {!loading && (
        <div className="flex items-center gap-4 mt-4">
          <Button 
            variant="outline"
            onClick={() => setPageNumber(page => Math.max(1, page - 1))} // 点击按钮，页面数-1, 最小为1
            disabled={pageNumber <= 1}  // 当页面小<=1, 按钮禁用 
          >
            <ChevronLeft className="h-4 w-4" /> 
          </Button>
          
          <span>
            第 {pageNumber} 页，共 {numPages} 页
          </span>
          
          <Button
            variant="outline"
            onClick={() => setPageNumber(page => Math.min(numPages, page + 1))}
            disabled={pageNumber >= numPages} // 当页面数>=总页数, 按钮禁用
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
} 