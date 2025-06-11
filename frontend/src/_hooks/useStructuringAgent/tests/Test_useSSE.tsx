import React from 'react';
import { useSSE } from '../useSSE';

// 定义 Props 接口
interface Test_useSSEProps {
    projectId: string;
}

// 方法1: 使用 React.FC
const Test_useSSE: React.FC<Test_useSSEProps> = ({ projectId }) => {

  // 只调用一次 useSSE， 否则会有多个实例
  const {
    connectionState, 
    isConnected, 
    isConnecting, 
    connect, 
    disconnect,
    lastMessage, 
    subscribe, 
    subscribeToMessage,
    lastError, 
    hasError, 
    clearError, 
    subscribeToError,
    // isRetrying,
    // retryAttempt,  //使用显示用的状态
    // nextRetryIn,
    // retryNow,
    // cancelRetry,
  } = useSSE(projectId)



  // console.log(connectionState, isConnected, isConnecting)

  return (
    <>
    <div>
      <h1>=========测试SSE连接管理=========</h1>
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <button onClick={connect} style={{marginRight: '10px', backgroundColor: 'green', color: 'white'}}>连接</button>
      <button onClick={disconnect} style={{marginRight: '10px', backgroundColor: 'red', color: 'white'}}>断开</button>
      </div>
      <p>Connection State: {connectionState}</p>
      <p>Is Connected: {isConnected ? '已连接' : '未连接'}</p>
      <p>Is Connecting: {isConnecting ? '连接中' : '未连接'}</p>
    </div>

    <br />
    <br />

    <div>
      <h1>=========测试SSE消息订阅管理=========</h1>
      <p>Last Message: {lastMessage?.data}</p>
      <button onClick={() => subscribe('state_update', (message) => console.log('Message:', message))}>订阅state_update消息</button>
      <br />
      <button onClick={() => subscribeToMessage((message) => console.log('Message:', message))}>订阅默认消息</button>
    </div>

    <br />
    <br />

    <div>
      <h1>=========测试SSE错误订阅管理=========</h1>
      <p>Last Error: {lastError?.message}</p>
      <p>Has Error: {hasError ? '有错误' : '无错误'}</p>
      <button onClick={clearError}>清除错误</button>
      <button onClick={() => subscribeToError((error) => console.log('Error:', error))}>订阅错误</button>
    </div>


    {/* <div>
      <h1>=========测试SSE重连管理=========</h1>
      <p>Is Retrying: {isRetrying ? '重连中' : '未重连'}</p>
      <p>Retry Attempt: {retryAttempt}</p>
      <p>Next Retry In: {nextRetryIn} seconds</p>
      <button onClick={retryNow}>立即重连</button>
      <button onClick={cancelRetry}>取消重连</button>
    </div> */}

    </>
  );
};

export default Test_useSSE;