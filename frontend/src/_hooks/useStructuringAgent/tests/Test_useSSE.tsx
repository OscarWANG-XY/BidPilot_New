import React from 'react';
import { useSSE } from '../useSSE';

// 定义 Props 接口
interface Test_useSSEProps {
    projectId: string;
}

// 方法1: 使用 React.FC
const Test_useSSE: React.FC<Test_useSSEProps> = ({ projectId }) => {

  const {connectionState, isConnected, isConnecting, connect, disconnect} = useSSE(projectId)

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
      <h1>=========测试SSE连接管理=========</h1>

    </div>
    </>
  );
};

export default Test_useSSE;