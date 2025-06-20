// import React, { useState, useEffect } from 'react';
// import { useQueries } from '@/_hooks/useProjectAgent/useQueries';
// import { useSSE } from '@/_hooks/useProjectAgent/useSSE';
// import { useStructuringActions } from '@/_hooks/useProjectAgent/useActions';
// import { useDocuments } from '@/_hooks/useProjectAgent/useDocuments';
// import TenderFileUpload from '@/components/projects/TenderAnalysis/TenderFileUpload/TenderFileupload';

// interface BidPilotProps {
//   projectId: string;
// }

// // 页面状态枚举
// enum PageState {
//   LOADING = 'loading',           // 初始加载中
//   NO_HISTORY = 'no_history',     // 无历史记录，显示文件上传
//   HAS_HISTORY = 'has_history',   // 有历史记录，显示历史消息
//   ERROR = 'error'                // 错误状态
// }

// const BidPilot: React.FC<BidPilotProps> = ({ projectId }) => {
//   // 页面状态
//   const [pageState, setPageState] = useState<PageState>(PageState.LOADING);
  
// //   // 使用数据hooks
// //   const { agentStateQuery, sseHistoryQuery } = useQueries(projectId);
// //   const sseConnection = useSSE(projectId, {
// //     autoConnect: false, // 先不自动连接，等确定状态后再连接
// //     enableReconnect: true,
// //     maxReconnectAttempts: 3
// //   });
  
// //   const { startAnalysis, retryAnalysis } = useStructuringActions();

// //   const agentState = agentStateQuery();
// //   const sseHistory = sseHistoryQuery();
  
//   // 初始化时检查历史消息
//   useEffect(() => {
//     // 当查询完成时，判断页面状态
//     if (agentState.isSuccess && sseHistory.isSuccess) {
//       const hasHistory = sseHistory.data?.messages && 
//                         sseHistory.data.messages.length > 0;
      
//       if (hasHistory) {
//         setPageState(PageState.HAS_HISTORY);
//       } else {
//         setPageState(PageState.NO_HISTORY);
//       }
      
//       // 确定状态后开启SSE连接
//       sseConnection.connect();
//     }
    
//     if (agentState.isError || sseHistory.isError) {
//       setPageState(PageState.ERROR);
//     }
//   }, [
//     agentState.isSuccess, 
//     agentState.isError,
//     sseHistory.isSuccess, 
//     sseHistory.isError,
//     sseConnection.connect
//   ]);

//   // 渲染不同状态的组件
//   const renderContent = () => {
//     switch (pageState) {
//       case PageState.LOADING:
//         return <LoadingComponent />;
      
//       case PageState.NO_HISTORY:
//         return (
//           <NoHistoryView 
//             projectId={projectId}
//             sseConnection={sseConnection}
//             onFileUpload={() => {
//               // 文件上传完成后的处理逻辑
//               console.log('文件上传完成');
//             }}
//           />
//         );
      
//       case PageState.HAS_HISTORY:
//         return (
//           <HasHistoryView 
//             projectId={projectId}
//             sseConnection={sseConnection}
//             historyMessages={sseHistory.data?.messages || []}
//             onContinueAgent={() => {
//               // 继续agent流程的处理逻辑
//               console.log('继续agent流程');
//             }}
//           />
//         );
      
//       case PageState.ERROR:
//         return <ErrorComponent />;
      
//       default:
//         return <LoadingComponent />;
//     }
//   };

//   return (
//     <div className="bid-pilot-container">
//       <header className="page-header">
//         <h1>BidPilot AI工作流</h1>
//         <div className="connection-status">
//           {sseConnection.isConnected && <span className="connected">●连接正常</span>}
//           {sseConnection.isConnecting && <span className="connecting">●连接中...</span>}
//           {sseConnection.isReconnecting && <span className="reconnecting">●重连中...</span>}
//           {sseConnection.hasError && <span className="error">●连接错误</span>}
//         </div>
//       </header>
      
//       <main className="page-content">
//         {renderContent()}
//       </main>
//     </div>
//   );
// };

// // 临时占位组件，后续我们会详细实现
// const LoadingComponent = () => (
//   <div className="loading-state">
//     <div className="spinner">加载中...</div>
//   </div>
// );

// const ErrorComponent = () => (
//   <div className="error-state">
//     <p>加载失败，请刷新页面重试</p>
//   </div>
// );

// // 无历史记录视图的占位组件
// const NoHistoryView: React.FC<{
//   projectId: string;
//   sseConnection: any;
//   onFileUpload: () => void;
// }> = ({ projectId, sseConnection, onFileUpload }) => (
//   <div className="no-history-view">
//     <h2>开始新的分析流程</h2>
//     <p>请上传文件开始分析...</p>
//     {/* 文件上传组件将在下一步实现 */}
//   </div>
// );

// // 有历史记录视图的占位组件
// const HasHistoryView: React.FC<{
//   projectId: string;
//   sseConnection: any;
//   historyMessages: any[];
//   onContinueAgent: () => void;
// }> = ({ projectId, sseConnection, historyMessages, onContinueAgent }) => (
//   <div className="has-history-view">
//     <h2>历史消息</h2>
//     <p>找到 {historyMessages.length} 条历史消息</p>
//     <button onClick={onContinueAgent}>继续Agent流程</button>
//     {/* 历史消息渲染组件将在后续实现 */}
//   </div>
// );

// export default BidPilot;